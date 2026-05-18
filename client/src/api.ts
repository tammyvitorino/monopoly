const API = '';

export async function createSession(name: string, initialBalance: number) {
  const res = await fetch(`${API}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, initialBalance })
  });
  return res.json();
}

export async function joinSession(code: string) {
  const res = await fetch(`${API}/api/sessions/join/${code}`);
  if (!res.ok) throw new Error('Sessão não encontrada');
  return res.json();
}

export async function getSession(id: string) {
  const res = await fetch(`${API}/api/sessions/${id}`);
  return res.json();
}

export async function addPlayer(sessionId: string, name: string, avatar: string) {
  const res = await fetch(`${API}/api/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, name, avatar })
  });
  return res.json();
}

export async function getPlayer(id: string) {
  const res = await fetch(`${API}/api/players/${id}`);
  return res.json();
}

export async function makeTransfer(fromPlayerId: string, toPlayerId: string, amount: number, description?: string) {
  const res = await fetch(`${API}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromPlayerId, toPlayerId, amount, description })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

export async function getTransactions(sessionId: string) {
  const res = await fetch(`${API}/api/transactions/session/${sessionId}`);
  return res.json();
}
