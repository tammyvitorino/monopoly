import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayer, getSession } from '../api';
import { QRCodeSVG } from 'qrcode.react';

interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  session_id: string;
}

interface Transaction {
  id: string;
  from_player_id: string;
  to_player_id: string;
  from_name: string;
  to_name: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [sessionCode, setSessionCode] = useState('');

  useEffect(() => {
    if (!playerId) return;
    const load = async () => {
      const data = await getPlayer(playerId);
      setPlayer(data.player);
      setTransactions(data.transactions);
      const sessionData = await getSession(data.player.session_id);
      setSessionCode(sessionData.session.code);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [playerId]);

  if (!player) return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>;

  const formatMoney = (value: number) => {
    return `M$ ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={() => navigate(`/lobby/${player.session_id}`)}>←</button>
        <h1>Minha Carteira</h1>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{player.avatar}</div>
        <h2>{player.name}</h2>
        <div className="balance-label">Saldo disponível</div>
        <div className="balance">{formatMoney(player.balance)}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Sala: {sessionCode}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="btn-green" onClick={() => navigate(`/transfer/${playerId}`)}>
          💸 Transferir
        </button>
        <button className="btn-secondary" onClick={() => setShowQR(!showQR)}>
          📱 Meu QR
        </button>
      </div>

      {showQR && (
        <div className="card">
          <div className="qr-container">
            <QRCodeSVG value={playerId || ''} size={180} />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Mostre para receber pagamentos
          </p>
        </div>
      )}

      <div className="card">
        <h2>Histórico</h2>
        <div className="spacer" />
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Nenhuma transação ainda</p>
        ) : (
          <div className="transaction-list">
            {transactions.map(tx => {
              const isReceiving = tx.to_player_id === playerId;
              return (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-info">
                    <span>{isReceiving ? `De: ${tx.from_name}` : `Para: ${tx.to_name}`}</span>
                    <span className="tx-description">{tx.description}</span>
                  </div>
                  <span className={`tx-amount ${isReceiving ? 'positive' : 'negative'}`}>
                    {isReceiving ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
