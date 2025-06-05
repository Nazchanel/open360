import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import 'qr-scanner/qr-scanner-worker.min.js';

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result: { data: string }) => {
        onScanSuccess(result.data);
        onClose();
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      }
    );

    const startScanner = async () => {
      try {
        await qrScannerRef.current?.start();
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.');
        console.error('QR Scanner error:', err);
      }
    };

    startScanner();

    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
    };
  }, [onScanSuccess, onClose]);

  const switchCamera = async () => {
    try {
      await qrScannerRef.current?.switchCamera();
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <button onClick={onClose} className="close-button">
          &times;
        </button>
        <h3>Scan Group QR Code</h3>
        <button onClick={switchCamera} className="switch-camera-button">
          ↻
        </button>
      </div>

      <video ref={videoRef} className="qr-video-element" />

      {error && (
        <div className="scanner-error">
          <p>{error}</p>
        </div>
      )}

      <div className="scanner-guide">
        <p>Align QR code within the frame</p>
      </div>
    </div>
  );
};

export default QRCodeScanner;