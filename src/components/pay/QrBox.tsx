'use client';
import { QRCodeSVG } from 'qrcode.react';   // npm i qrcode.react

/** Vrai QR code (SVG) du lien de paiement. */
export default function QrBox({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-xl bg-white p-3" role="img" aria-label="QR code du lien de paiement">
      <QRCodeSVG value={value} size={size} level="M" marginSize={1} />
    </div>
  );
}
