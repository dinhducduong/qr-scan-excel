import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Home() {
  const [orderCode, setOrderCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRescan, setCanRescan] = useState(false);
  const qrScanner = useRef(null);

  useEffect(() => {
    const startScanner = async () => {
      if (!qrScanner.current) {
        qrScanner.current = new Html5Qrcode('qr-reader');

        try {
          await qrScanner.current.start(
            { facingMode: 'environment' }, // Camera sau
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              disableFlip: true,
              // Không kích hoạt torch (flash)
              videoConstraints: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            (decodedText) => {
              if (decodedText !== orderCode) {
                setOrderCode(decodedText);
                handleSubmit(decodedText);
              }
            },
            (err) => {
              console.warn('QR Scan Error', err);
            }
          );
        } catch (err) {
          console.error('QR init error', err);
        }
      }
    };

    startScanner();

    return () => {
      if (qrScanner.current) {
        qrScanner.current.stop().then(() => {
          qrScanner.current.clear();
        });
      }
    };
  }, []);

  const handleSubmit = async (code) => {
    if (!code) return;
    setLoading(true);
    setStatus('');
    setCanRescan(false);

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode: code }),
    });

    const data = await res.json();
    setStatus(data.message);
    setCanRescan(data.canRescan);
    setLoading(false);

    // Reset sau 5s để cho phép scan lại
    setTimeout(() => {
      setOrderCode('');
      setStatus('');
      setCanRescan(false);
    }, 5000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📦 Quét đơn hàng</h1>
      <div id="qr-reader" style={styles.qrBox}></div>

      <div style={styles.infoBox}>
        <p style={styles.text}>
          <strong>Mã đơn:</strong> {orderCode || 'Chưa quét'}
        </p>
        {loading && <p style={styles.text}>⏳ Đang xử lý...</p>}
        {status && <p style={styles.status}>{status}</p>}
        {canRescan && <p style={styles.warning}>⚠️ Đã đóng xong đơn này</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '10px',
    textAlign: 'center',
    background: '#f8f8f8',
    height: '100vh',
    boxSizing: 'border-box',
  },
  header: {
    fontSize: '24px',
    marginBottom: '10px',
  },
  qrBox: {
    width: '100%',
    maxWidth: '400px',
    height: 'auto',
    margin: '0 auto',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  infoBox: {
    marginTop: '20px',
    background: '#fff',
    padding: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  text: {
    fontSize: '16px',
    margin: '5px 0',
  },
  status: {
    color: '#007b00',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  warning: {
    color: '#c0392b',
    fontWeight: 'bold',
    marginTop: '10px',
  },
};
