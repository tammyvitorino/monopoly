import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../api';

interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  is_bank: number;
}

interface Session {
  id: string;
  code: string;
  name: string;
}

export default function Lobby() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const playerId = localStorage.getItem('playerId');

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const data = await getSession(sessionId);
      setSession(data.session);
      setPlayers(data.players);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!session) return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>;

  const nonBankPlayers = players.filter(p => !p.is_bank);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1>{session.name}</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Código da sala:</p>
        <div className="code-display">{session.code}</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Compartilhe este código com os outros jogadores
        </p>
      </div>

      <div className="card">
        <h2>Jogadores ({nonBankPlayers.length})</h2>
        <div className="spacer" />
        <div className="player-list">
          {nonBankPlayers.map(p => (
            <div key={p.id} className="player-item">
              <span className="player-avatar">{p.avatar}</span>
              <span className="player-name">{p.name}</span>
              {p.id === playerId && <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>VOCÊ</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="spacer" />
      <button className="btn-green" onClick={() => navigate(`/wallet/${playerId}`)}>
        Ir para Minha Carteira
      </button>
    </div>
  );
}
