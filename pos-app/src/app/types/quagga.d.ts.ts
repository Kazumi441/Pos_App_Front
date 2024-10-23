declare module 'quagga' {
    interface QuaggaConfig {
      inputStream: {
        name?: string;
        type: string;
        target: Element | string;
        constraints?: MediaTrackConstraints;
      };
      decoder: {
        readers: string[];
      };
      locator?: any;
      numOfWorkers?: number;
      frequency?: number;
      locate?: boolean;
      src?: string;
    }
  
    interface QuaggaResult {
      codeResult: {
        code: string;
        format: string;
      };
    }
  
    function init(config: QuaggaConfig, callback: (err: any) => void): void;
    function start(): void;
    function stop(): void;
    function onDetected(callback: (result: QuaggaResult) => void): void;
    function offDetected(callback: (result: QuaggaResult) => void): void;
  }