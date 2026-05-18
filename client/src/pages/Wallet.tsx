import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayer, getSession } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from '../components/QRScanner';
import BankPay from '../components/BankPay';
import { io as socketIO } from 'socket.io-client';

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
  const [showScanner, setShowScanner] = useState(false);
  const [showBankPay, setShowBankPay] = useState(false);
  const [notification, setNotification] = useState('');
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

  // Socket.IO para notificações do banco
  useEffect(() => {
    if (!sessionCode) return;
    const API_URL = import.meta.env.VITE_API_URL || '';
    const socket = socketIO(API_URL || window.location.origin);
    socket.on('connect', () => {
      socket.emit('join-session', sessionCode);
    });
    socket.on('bank-notification', (data: { message: string }) => {
      setNotification(data.message);
    });
    return () => { socket.disconnect(); };
  }, [sessionCode]);

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

      {notification && (
        <div
          onClick={() => setNotification('')}
          style={{
            background: 'var(--primary)', color: 'white', padding: '1rem',
            borderRadius: '8px', marginBottom: '1rem', textAlign: 'center',
            fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {notification}
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.8 }}>toque para fechar</div>
        </div>
      )}

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
        <button className="btn-secondary" onClick={() => setShowBankPay(true)}>
          🏦 Receber do Banco
        </button>
        <button className="btn-secondary" onClick={() => setShowScanner(true)}>
          📷 Escanear QR
        </button>
        <button className="btn-secondary" onClick={() => setShowQR(!showQR)}>
          📱 Meu QR
        </button>
      </div>

      {showBankPay && (
        <BankPay
          playerId={playerId!}
          sessionId={player.session_id}
          onClose={() => setShowBankPay(false)}
          onSuccess={() => {}}
        />
      )}

      {showScanner && (
        <QRScanner
          onScan={(data) => {
            setShowScanner(false);
            navigate(`/transfer/${playerId}?to=${data}`);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

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
