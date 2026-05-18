import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, joinSession, addPlayer } from '../api';

const AVATARS = ['🎩', '🚗', '🐕', '👢', '🚢', '🎲', '💎', '🏠', '🎵', '⭐'];

export default function Home() {
  const navigate = useNavigate();
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎩');
  const [code, setCode] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [initialBalance, setInitialBalance] = useState('15000000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Digite seu nome'); return; }
    setLoading(true);
    try {
      const { session } = await createSession(sessionName || 'Monopoly', parseInt(initialBalance));
      const player = await addPlayer(session.id, name, avatar);
      localStorage.setItem('playerId', player.id);
      localStorage.setItem('sessionId', session.id);
      navigate(`/lobby/${session.id}`);
    } catch { setError('Erro ao criar sessão'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('Digite seu nome'); return; }
    if (!code.trim()) { setError('Digite o código da sala'); return; }
    setLoading(true);
    try {
      const { session } = await joinSession(code);
      const player = await addPlayer(session.id, name, avatar);
      localStorage.setItem('playerId', player.id);
      localStorage.setItem('sessionId', session.id);
      navigate(`/wallet/${player.id}`);
    } catch { setError('Sala não encontrada'); }
    setLoading(false);
  };

  if (view === 'main') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh', gap: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem' }}>🏦</div>
          <h1 style={{ fontSize: '1.75rem' }}>Monopoly Bank</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Banco digital para seu jogo</p>
        </div>
        <button className="btn-primary" onClick={() => setView('create')}>Criar Nova Partida</button>
        <button className="btn-secondary" onClick={() => setView('join')}>Entrar em Partida</button>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={() => { setView('main'); setError(''); }}>←</button>
        <h1>{view === 'create' ? 'Nova Partida' : 'Entrar na Partida'}</h1>
      </div>

      {error && <div style={{ color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <div className="card">
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Seu nome</label>
        <div className="spacer" />
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do jogador" />
      </div>

      <div className="card">
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Escolha seu avatar</label>
        <div className="avatar-grid">
          {AVATARS.map(a => (
            <div key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>
              {a}
            </div>
          ))}
        </div>
      </div>

      {view === 'create' && (
        <>
          <div className="card">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nome da partida (opcional)</label>
            <div className="spacer" />
            <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Monopoly" />
          </div>
          <div className="card">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Saldo inicial (M$)</label>
            <div className="spacer" />
            <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
          </div>
          <button className="btn-green" onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Partida'}
          </button>
        </>
      )}

      {view === 'join' && (
        <>
          <div className="card">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Código da sala</label>
            <div className="spacer" />
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="EX: ABC123"
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
            />
          </div>
          <button className="btn-green" onClick={handleJoin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na Partida'}
          </button>
        </>
      )}
    </div>
  );
}
