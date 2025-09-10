/**
 * Enhanced PDF extraction result interfaces
 */

export interface PDFExtractionMetadata {
  fileName: string;
  fileSize: number;
  numPages?: number;
  textLength?: number;
  extractionMethod: 'pdf-parse' | 'fallback';
  processingTime?: number;
}

export interface PDFExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  metadata: PDFExtractionMetadata;
}

export interface PDFExtractionError {
  type: 'parsing' | 'file' | 'validation' | 'enoent';
  message: string;
  details?: any;
  fileName: string;
  fileSize: number;
  originalError?: Error;
}

export interface FileExtractionOptions {
  minTextLength?: number;
  maxFileSize?: number;
  enableFallback?: boolean;
  logDetails?: boolean;
}

export interface ExtractionStats {
  totalAttempts: number;
  successfulExtractions: number;
  failedExtractions: number;
  averageTextLength: number;
  commonErrors: string[];
}