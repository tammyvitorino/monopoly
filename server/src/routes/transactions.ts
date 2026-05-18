import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import pool from '../database';

export const transactionRouter = Router();

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
