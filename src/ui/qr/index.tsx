import {useMemo} from 'react';
import {Image} from 'expo-image';
import qrcode from 'qrcode-generator';

export interface QRCodeProps {
  /** Value encoded in the QR code. */
  value: string;
  /** Rendered width/height in points. */
  size?: number;
}

export function QRCode({value, size = 200}: QRCodeProps) {
  const uri = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    return qr.createDataURL(8, 2);
  }, [value]);
  return (
    <Image
      source={{uri}}
      style={{width: size, height: size, borderRadius: 12}}
      contentFit="contain"
    />
  );
}
