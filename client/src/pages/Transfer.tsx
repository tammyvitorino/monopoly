import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getPlayer, getSession, makeTransfer } from '../api';

interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  is_bank: number;
  session_id: string;
}

export default function Transfer() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>(searchParams.get('to') || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    const load = async () => {
      const data = await getPlayer(playerId);
      setPlayer(data.player);
      const sessionData = await getSession(data.player.session_id);
      setPlayers(sessionData.players.filter((p: Player) => p.id !== playerId));
    };
    load();
  }, [playerId]);

  const handleTransfer = async () => {
    setError('');
    setSuccess('');
    if (!selectedPlayer) { setError('Selecione um destinatário'); return; }
    if (!amount || parseInt(amount) <= 0) { setError('Digite um valor válido'); return; }

    const parsedAmount = parseInt(amount);

    setLoading(true);
    try {
      await makeTransfer(playerId!, selectedPlayer, parsedAmount, description || 'Transferência');
      setSuccess('Transferência realizada! ✅');
      setAmount('');
      setDescription('');
      setTimeout(() => navigate(`/wallet/${playerId}`), 1500);
    } catch (e: any) {
      setError(e.message || 'Erro na transferência');
    }
    setLoading(false);
  };

  if (!player) return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>;

  const formatMoney = (value: number) => `M$ ${value.toLocaleString('pt-BR')}`;

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={() => navigate(`/wallet/${playerId}`)}>←</button>
        <h1>Transferir</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="balance-label">Seu saldo</div>
        <div className="balance">{formatMoney(player.balance)}</div>
      </div>

      {error && <div style={{ color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
      {success && <div style={{ color: 'var(--accent-green)', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

      <div className="card">
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Para quem?</label>
        <div className="spacer" />
        <div className="player-list">
          {players.map(p => (
            <div
              key={p.id}
              className="player-item"
              style={{ border: selectedPlayer === p.id ? '2px solid var(--accent-green)' : '2px solid transparent' }}
              onClick={() => setSelectedPlayer(p.id)}
            >
              <span className="player-avatar">{p.avatar}</span>
              <span className="player-name">{p.is_bank ? '🏦 Banco' : p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Valor (M$)</label>
        <div className="spacer" />
        <input
          type="text"
          inputMode="numeric"
          className="amount-input"
          value={amount}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '');
            setAmount(raw);
          }}
          placeholder="0"
        />
        {amount && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            M$ {Number(amount).toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      <div className="card">
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Descrição (opcional)</label>
        <div className="spacer" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Aluguel, compra..." />
      </div>

      <button className="btn-green" onClick={handleTransfer} disabled={loading}>
        {loading ? 'Transferindo...' : '💸 Confirmar Transferência'}
      </button>
    </div>
  );
}
