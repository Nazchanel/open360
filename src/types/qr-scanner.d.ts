declare module 'qr-scanner' {
  class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onScan: (result: { data: string }) => void,
      options?: {
        preferredCamera?: 'environment' | 'user';
        highlightScanRegion?: boolean;
        highlightCodeOutline?: boolean;
        maxScansPerSecond?: number;
      }
    );
    
    start(): Promise<void>;
    stop(): void;
    destroy(): void;
    switchCamera(): Promise<void>;
    static hasCamera(): Promise<boolean>;
  }

  export default QrScanner;
}
