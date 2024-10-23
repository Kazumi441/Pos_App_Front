declare module 'react-barcode-reader' {
    import * as React from 'react';
  
    interface BarcodeReaderProps {
      onError: (err: any) => void;
      onScan: (data: string | null) => void;
      facingMode?: 'user' | 'environment';
      delay?: number;
      style?: React.CSSProperties;
      className?: string;
    }
  
    const BarcodeReader: React.FC<BarcodeReaderProps>;
  
    export default BarcodeReader;
  }
  