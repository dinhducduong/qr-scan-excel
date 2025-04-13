"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import axios from "axios";

export default function QRScanner() {
  const qrScanner = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("📸 Sẵn sàng quét mã QR vận đơn...");

  const SHEETDB_URL = "https://sheetdb.io/api/v1/ce1x9rqgfxcv8"; // <== Thay URL API của bạn!

  const handleScanSuccess = async (orderCode) => {
    if (isScanning) return;  // chống lặp
    setIsScanning(true);
    setStatus(`✅ Đã quét: ${orderCode}`);

    try {
      const now = new Date().toISOString();

      // Kiểm tra xem orderCode đã tồn tại trên Sheet
      const { data } = await axios.get(`${SHEETDB_URL}/search?order_code=${orderCode}`);

      if (data.length === 0) {
        // Nếu chưa có -> thêm mới
        await axios.post(SHEETDB_URL, {
          data: [{ order_code: orderCode, start_time: now }]
        });
        setStatus(`🆕 Tạo mới đơn: ${orderCode}`);
      } else {
        const record = data[0];
        if (record.start_time && record.end_time) {
          setStatus(`📦 Đơn "${orderCode}" đã đóng xong! Nếu muốn, hãy đóng lại.`);
        } else if (record.start_time && !record.end_time) {
          // Nếu có start_time, cập nhật end_time
          await axios.patch(`${SHEETDB_URL}/order_code/${orderCode}`, {
            data: { end_time: now }
          });
          setStatus(`✅ Cập nhật thời gian kết thúc cho: ${orderCode}`);
        }
      }
    } catch (error) {
      setStatus(`❌ Lỗi khi gửi dữ liệu: ${error.message}`);
    }

    setTimeout(() => setIsScanning(false), 3000);  // 3 giây khoá quét
  };

  useEffect(() => {
    qrScanner.current = new Html5Qrcode("qr-reader");
    qrScanner.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        disableFlip: true,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      },
      handleScanSuccess,
      (error) => {
        // Có thể log ra console nếu muốn debug
      }
    );

    return () => {
      qrScanner.current?.stop().catch(console.error);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-4">
      <h1 className="text-2xl font-bold mb-4">📦 Quét mã vận đơn</h1>

      <div
        id="qr-reader"
        className="rounded-xl border-4 border-blue-300 shadow-lg overflow-hidden"
        style={{ width: 320, height: 320 }}
      ></div>

      <div className="mt-6 p-3 text-center bg-white border border-gray-300 rounded-lg shadow-sm w-full max-w-sm">
        <p className="text-sm text-gray-700">{status}</p>
      </div>
    </div>
  );
}
