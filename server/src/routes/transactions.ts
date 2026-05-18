import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import pool from '../database';
import { Server } from 'socket.io';

export const transactionRouter = Router();

let ioInstance: Server;
export function setTransactionIO(io: Server) {
  ioInstance = io;
}

// Realizar transferência
transactionRouter.post('/', async (req: Request, res: Response) => {
  const { fromPlayerId, toPlayerId, amount, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Valor inválido' });
    return;
  }

  const [fromRows] = await pool.execute('SELECT * FROM players WHERE id = ?', [fromPlayerId]);
  const [toRows] = await pool.execute('SELECT * FROM players WHERE id = ?', [toPlayerId]);
  const fromPlayer = (fromRows as any[])[0];
  const toPlayer = (toRows as any[])[0];

  if (!fromPlayer || !toPlayer) {
    res.status(404).json({ error: 'Jogador não encontrado' });
    return;
  }

  if (!fromPlayer.is_bank && fromPlayer.balance < amount) {
    res.status(400).json({ error: 'Saldo insuficiente' });
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!fromPlayer.is_bank) {
      await conn.execute('UPDATE players SET balance = balance - ? WHERE id = ?', [amount, fromPlayerId]);
    }
    if (!toPlayer.is_bank) {
      await conn.execute('UPDATE players SET balance = balance + ? WHERE id = ?', [amount, toPlayerId]);
    }

    const txId = nanoid();
    await conn.execute(
      'INSERT INTO transactions (id, session_id, from_player_id, to_player_id, amount, description) VALUES (?, ?, ?, ?, ?, ?)',
      [txId, fromPlayer.session_id, fromPlayerId, toPlayerId, amount, description || 'Transferência']
    );

    await conn.commit();

    const [updatedFrom] = await pool.execute('SELECT * FROM players WHERE id = ?', [fromPlayerId]);
    const [updatedTo] = await pool.execute('SELECT * FROM players WHERE id = ?', [toPlayerId]);

    res.json({ transactionId: txId, from: (updatedFrom as any[])[0], to: (updatedTo as any[])[0] });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Erro na transferência' });
  } finally {
    conn.release();
  }
});

// Histórico da sessão
transactionRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  const [transactions] = await pool.execute(`
    SELECT t.*, fp.name as from_name, tp.name as to_name
    FROM transactions t
    LEFT JOIN players fp ON t.from_player_id = fp.id
    LEFT JOIN players tp ON t.to_player_id = tp.id
    WHERE t.session_id = ?
    ORDER BY t.created_at DESC LIMIT 100
  `, [req.params.sessionId]);

  res.json(transactions);
});

// Receber do banco
transactionRouter.post('/bank-pay', async (req: Request, res: Response) => {
  const { requestedBy, sessionId, amount, toAll, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Valor inválido' });
    return;
  }

  // Find bank player
  const [bankRows] = await pool.execute('SELECT * FROM players WHERE session_id = ? AND is_bank = 1', [sessionId]);
  const bank = (bankRows as any[])[0];
  if (!bank) {
    res.status(404).json({ error: 'Banco não encontrado' });
    return;
  }

  // Find session code for socket emission
  const [sessionRows] = await pool.execute('SELECT code FROM sessions WHERE id = ?', [sessionId]);
  const sessionCode = (sessionRows as any[])[0]?.code;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let recipients: any[] = [];

    if (toAll) {
      const [allPlayers] = await conn.execute(
        'SELECT * FROM players WHERE session_id = ? AND is_bank = 0', [sessionId]
      );
      recipients = allPlayers as any[];
    } else {
      const [playerRows] = await conn.execute('SELECT * FROM players WHERE id = ?', [requestedBy]);
      recipients = playerRows as any[];
    }

    for (const player of recipients) {
      await conn.execute('UPDATE players SET balance = balance + ? WHERE id = ?', [amount, player.id]);
      const txId = nanoid();
      await conn.execute(
        'INSERT INTO transactions (id, session_id, from_player_id, to_player_id, amount, description) VALUES (?, ?, ?, ?, ?, ?)',
        [txId, sessionId, bank.id, player.id, amount, description || 'Pagamento do Banco']
      );
    }

    await conn.commit();

    // Get requester name
    const [reqPlayer] = await pool.execute('SELECT name FROM players WHERE id = ?', [requestedBy]);
    const requesterName = (reqPlayer as any[])[0]?.name || 'Alguém';

    // Emit notification to all players in session
    if (ioInstance && sessionCode) {
      const notification = toAll
        ? `🏦 TODOS receberam M$ ${Number(amount).toLocaleString('pt-BR')} do banco (solicitado por ${requesterName})`
        : `🏦 ${requesterName} recebeu M$ ${Number(amount).toLocaleString('pt-BR')} do banco`;

      ioInstance.to(sessionCode).emit('bank-notification', { message: notification, amount, toAll, requesterName });
    }

    res.json({ success: true, recipients: recipients.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Erro ao processar pagamento do banco' });
  } finally {
    conn.release();
  }
});
