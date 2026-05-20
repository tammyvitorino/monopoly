import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, joinSession, addPlayer, getPlayer } from '../api';

const AVATARS = ['🎩', '🚗', '🐕', '👢', '🚢', '🎲', '💎', '🏠', '🎵', '⭐'];

interface SavedGame {
  playerId: string;
  sessionId: string;
  playerName: string;
  avatar: string;
  sessionName: string;
}

function getSavedGames(): SavedGame[] {
  try {
    return JSON.parse(localStorage.getItem('monopoly_games') || '[]');
  } catch { return []; }
}

function saveGame(game: SavedGame) {
  const games = getSavedGames().filter(g => g.playerId !== game.playerId);
  games.unshift(game);
  localStorage.setItem('monopoly_games', JSON.stringify(games));
}

function removeGame(playerId: string) {
  const games = getSavedGames().filter(g => g.playerId !== playerId);
  localStorage.setItem('monopoly_games', JSON.stringify(games));
}

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
  const [savedGames, setSavedGames] = useState<SavedGame[]>(getSavedGames());

  // Validate saved games on load (remove finished ones)
  useEffect(() => {
    const validate = async () => {
      const games = getSavedGames();
      const valid: SavedGame[] = [];
      for (const game of games) {
        try {
          const data = await getPlayer(game.playerId);
          if (data.player) valid.push(game);
        } catch {
          // player no longer exists, skip
        }
      }
      localStorage.setItem('monopoly_games', JSON.stringify(valid));
      setSavedGames(valid);
    };
    validate();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Digite seu nome'); return; }
    setLoading(true);
    try {
      const { session } = await createSession(sessionName || 'Monopoly', parseInt(initialBalance));
      const player = await addPlayer(session.id, name, avatar);
      localStorage.setItem('playerId', player.id);
      localStorage.setItem('sessionId', session.id);
      saveGame({ playerId: player.id, sessionId: session.id, playerName: name, avatar, sessionName: session.name || sessionName || 'Monopoly' });
      setSavedGames(getSavedGames());
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
      saveGame({ playerId: player.id, sessionId: session.id, playerName: name, avatar, sessionName: session.name || 'Monopoly' });
      setSavedGames(getSavedGames());
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

        {savedGames.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>🎮 Jogos em andamento</h3>
            {savedGames.map(game => (
              <div key={game.playerId} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{game.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{game.playerName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{game.sessionName}</div>
                </div>
                <button
                  className="btn-green"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => navigate(`/wallet/${game.playerId}`)}
                >
                  Entrar
                </button>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                  onClick={() => { removeGame(game.playerId); setSavedGames(getSavedGames()); }}
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

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
