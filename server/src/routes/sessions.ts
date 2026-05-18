import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import pool from '../database';

export const sessionRouter = Router();

function generateCode(): string {
  return nanoid(6).toUpperCase().replace(/[_-]/g, 'X');
}

// Criar nova sessão
sessionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, initialBalance = 15000000 } = req.body;
    const id = nanoid();
    const code = generateCode();

    await pool.execute(
      'INSERT INTO sessions (id, code, name, initial_balance) VALUES (?, ?, ?, ?)',
      [id, code, name || 'Monopoly', initialBalance]
    );

    const bankId = nanoid();
    await pool.execute(
      'INSERT INTO players (id, session_id, name, avatar, balance, is_bank) VALUES (?, ?, ?, ?, ?, ?)',
      [bankId, id, '🏦 Banco', '🏦', 999999999, 1]
    );

    const [rows] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [id]);
    res.json({ session: (rows as any[])[0], bankId });
  } catch (err) {
    console.error('Erro ao criar sessão:', err);
    res.status(500).json({ error: 'Erro ao criar sessão' });
  }
});

// Entrar em sessão pelo código
sessionRouter.get('/join/:code', async (req: Request, res: Response) => {
  const [rows] = await pool.execute(
    'SELECT * FROM sessions WHERE code = ? AND status = ?',
    [req.params.code.toUpperCase(), 'active']
  );
  const sessions = rows as any[];

  if (sessions.length === 0) {
    res.status(404).json({ error: 'Sessão não encontrada' });
    return;
  }

  const [players] = await pool.execute('SELECT * FROM players WHERE session_id = ?', [sessions[0].id]);
  res.json({ session: sessions[0], players });
});

// Obter detalhes da sessão
sessionRouter.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
  const sessions = rows as any[];
  if (sessions.length === 0) {
    res.status(404).json({ error: 'Sessão não encontrada' });
    return;
  }

  const [players] = await pool.execute(
    'SELECT * FROM players WHERE session_id = ? ORDER BY is_bank DESC, name',
    [sessions[0].id]
  );
  res.json({ session: sessions[0], players });
});
