import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText);
        });
      },
      () => {} // ignore scan failures
    ).catch((err) => {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error(err);
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div id="qr-reader" style={{ width: '300px' }} />
      {error && <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>{error}</p>}
      <button
        onClick={onClose}
        style={{
          marginTop: '1.5rem', padding: '0.75rem 2rem',
          background: 'var(--danger)', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer'
        }}
      >
        ✕ Fechar
      </button>
    </div>
  );
}
