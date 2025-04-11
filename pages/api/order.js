const SHEETDB_URL = 'https://sheetdb.io/api/v1/ce1x9rqgfxcv8';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderCode } = req.body;
  const now = new Date().toISOString();

  // Kiểm tra xem đơn đã tồn tại chưa
  const checkRes = await fetch(`${SHEETDB_URL}/search?order_code=${orderCode}`);
  const existing = await checkRes.json();

  if (existing.length === 0) {
    // Chưa có đơn này → tạo mới với thời gian bắt đầu
    await fetch(SHEETDB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          order_code: orderCode,
          start_time: now,
          end_time: '',
        },
      }),
    });
    return res.status(200).json({ message: '✅ Đã ghi thời gian bắt đầu đóng hàng.', canRescan: false });
  } else {
    const item = existing[0];
    if (!item.end_time) {
      // Có đơn rồi, nhưng chưa có thời gian kết thúc → cập nhật end_time
      await fetch(`${SHEETDB_URL}/order_code/${orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            end_time: now,
          },
        }),
      });
      return res.status(200).json({ message: '✅ Đã ghi thời gian kết thúc đóng hàng.', canRescan: true });
    } else {
      // Đơn đã có cả start và end
      return res.status(200).json({
        message: '⚠️ Đơn hàng đã được đóng xong trước đó.',
        canRescan: true,
      });
    }
  }
}
