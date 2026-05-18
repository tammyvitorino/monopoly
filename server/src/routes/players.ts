import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import pool from '../database';

export const playerRouter = Router();

// Adicionar jogador à sessão
playerRouter.post('/', async (req: Request, res: Response) => {
  const { sessionId, name, avatar } = req.body;

  const [rows] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  const sessions = rows as any[];
  if (sessions.length === 0) {
    res.status(404).json({ error: 'Sessão não encontrada' });
    return;
  }

  const id = nanoid();
  await pool.execute(
    'INSERT INTO players (id, session_id, name, avatar, balance) VALUES (?, ?, ?, ?, ?)',
    [id, sessionId, name, avatar || '🎩', sessions[0].initial_balance]
  );

  const [playerRows] = await pool.execute('SELECT * FROM players WHERE id = ?', [id]);
  res.json((playerRows as any[])[0]);
});

// Obter jogador com transações
playerRouter.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM players WHERE id = ?', [req.params.id]);
  const players = rows as any[];
  if (players.length === 0) {
    res.status(404).json({ error: 'Jogador não encontrado' });
    return;
  }

  const player = players[0];
  const [transactions] = await pool.execute(`
    SELECT t.*, fp.name as from_name, tp.name as to_name
    FROM transactions t
    LEFT JOIN players fp ON t.from_player_id = fp.id
    LEFT JOIN players tp ON t.to_player_id = tp.id
    WHERE t.session_id = ? AND (t.from_player_id = ? OR t.to_player_id = ?)
    ORDER BY t.created_at DESC LIMIT 50
  `, [player.session_id, player.id, player.id]);

  res.json({ player, transactions });
});
