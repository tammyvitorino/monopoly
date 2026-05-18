import { useState } from 'react';
import { bankPay } from '../api';

interface BankPayProps {
  playerId: string;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BankPay({ playerId, sessionId, onClose, onSuccess }: BankPayProps) {
  const [amount, setAmount] = useState('');
  const [toAll, setToAll] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Digite um valor válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await bankPay(playerId, sessionId, parseInt(amount), toAll, description || undefined);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏦 Receber do Banco</h3>

        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Valor</label>
        <input
          type="text"
          inputMode="numeric"
          className="amount-input"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        {amount && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            M$ {Number(amount).toLocaleString('pt-BR')}
          </p>
        )}

        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Motivo (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Passou no início, sorte..."
          style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
            color: 'var(--text-primary)', fontSize: '0.95rem'
          }}>
            <input
              type="checkbox"
              checked={toAll}
              onChange={e => setToAll(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            Todos os jogadores recebem
          </label>
        </div>

        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn-green" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? '...' : '✅ Receber'}
          </button>
        </div>
      </div>
    </div>
  );
}
