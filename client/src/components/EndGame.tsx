import { useState } from 'react';
import { endSession } from '../api';

interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  is_bank: number;
}

interface EndGameProps {
  sessionId: string;
  players: Player[];
  onClose: () => void;
  onEnd: (winner: Player | null) => void;
}

export default function EndGame({ sessionId, players, onClose, onEnd }: EndGameProps) {
  const [loading, setLoading] = useState(false);

  const nonBankPlayers = players.filter(p => !p.is_bank);

  // Sort by balance desc - winner is the one with highest balance
  const sorted = [...nonBankPlayers].sort((a, b) => b.balance - a.balance);
  const winnerId = sorted[0]?.id || '';

  const handleEnd = async () => {
    setLoading(true);
    try {
      await endSession(sessionId, winnerId || undefined);
      const winner = nonBankPlayers.find(p => p.id === winnerId) || null;
      onEnd(winner);
    } catch {
      onEnd(null);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>🏁 Finalizar Partida</h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
          Vencedor (maior saldo):
        </p>

        {sorted[0] && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem', borderRadius: '8px', marginBottom: '1rem',
            border: '2px solid var(--primary)', background: 'rgba(76, 175, 80, 0.1)'
          }}>
            <span style={{ fontSize: '2rem' }}>👑</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sorted[0].name}</div>
              <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                M$ {sorted[0].balance.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {sorted.slice(1).map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)'
            }}>
              <span>{i + 2}º</span>
              <span>{p.avatar}</span>
              <span style={{ flex: 1 }}>{p.name}</span>
              <span>M$ {p.balance.toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn-green" onClick={handleEnd} disabled={loading} style={{ flex: 1 }}>
            {loading ? '...' : '🏁 Finalizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
