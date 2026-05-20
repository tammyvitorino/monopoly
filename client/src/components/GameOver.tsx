import { useNavigate } from 'react-router-dom';

interface GameOverProps {
  winner: { name: string; avatar: string; balance: number } | null;
}

export default function GameOver({ winner }: GameOverProps) {
  const navigate = useNavigate();

  const handleNewGame = () => {
    // Remove current game from localStorage
    const playerId = localStorage.getItem('playerId');
    if (playerId) {
      try {
        const games = JSON.parse(localStorage.getItem('monopoly_games') || '[]');
        const filtered = games.filter((g: any) => g.playerId !== playerId);
        localStorage.setItem('monopoly_games', JSON.stringify(filtered));
      } catch {}
    }
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '2rem'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Fim de Jogo!</h1>

      {winner ? (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>O vencedor é:</p>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{winner.avatar}</div>
            <h2 style={{ fontSize: '1.5rem' }}>{winner.name}</h2>
            <p style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
              M$ {winner.balance.toLocaleString('pt-BR')}
            </p>
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>A partida foi encerrada.</p>
      )}

      <div style={{ marginTop: '2rem', width: '100%' }}>
        <button className="btn-primary" onClick={handleNewGame} style={{ width: '100%' }}>
          🎲 Novo Jogo
        </button>
      </div>
    </div>
  );
}
