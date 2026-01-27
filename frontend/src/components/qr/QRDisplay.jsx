import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRDisplay = ({ url, code, size = 200 }) => {
  const publicUrl = url || `${window.location.origin}/grave/${code}`;

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `qr-code-${code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="qr-display">
      <QRCodeSVG
        id="qr-code-svg"
        value={publicUrl}
        size={size}
        level="H"
        includeMargin={true}
      />
      <p style={{ marginTop: '15px' }}>
        <strong>Public Profile URL:</strong>
      </p>
      <div className="qr-url">{publicUrl}</div>
      <div style={{ marginTop: '15px' }}>
        <button className="btn btn-primary btn-sm" onClick={handleDownload}>
          Download QR Code
        </button>
      </div>
    </div>
  );
};

export default QRDisplay;
