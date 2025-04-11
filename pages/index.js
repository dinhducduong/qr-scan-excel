import { useState } from 'react';

export default function Home() {
  const [orderCode, setOrderCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRescan, setCanRescan] = useState(false);

  const handleSubmit = async () => {
    if (!orderCode) return;

    setLoading(true);
    setStatus('');
    setCanRescan(false);

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode }),
    });

    const data = await res.json();
    setStatus(data.message);
    setCanRescan(data.canRescan);
    setLoading(false);
  };

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>📦 Quét mã đơn hàng</h2>
      <input
        type="text"
        placeholder="Nhập hoặc quét mã vận đơn"
        value={orderCode}
        onChange={(e) => setOrderCode(e.target.value)}
        style={{ padding: 10, fontSize: 18, width: '100%', maxWidth: 400 }}
      />
      <br /><br />
      <button onClick={handleSubmit} disabled={loading} style={{ padding: 12, fontSize: 16 }}>
        {loading ? 'Đang xử lý...' : 'Lưu'}
      </button>
      {status && (
        <div style={{ marginTop: 20 }}>
          <strong>{status}</strong>
        </div>
      )}
      {canRescan && (
        <div style={{ marginTop: 10 }}>
          <button style={{ background: 'orange', padding: 10 }}>
            🔁 Đóng lại
          </button>
        </div>
      )}
    </main>
  );
}
