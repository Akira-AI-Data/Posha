declare class BarcodeDetector {
  static getSupportedFormats?: () => Promise<string[]>;
  constructor(options?: { formats?: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
}
