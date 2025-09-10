import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { 
  PDFExtractionResult, 
  PDFExtractionError, 
  PDFExtractionMetadata,
  FileExtractionOptions 
} from '@/types/pdf-extraction';

export async function saveUploadedFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);
    
    return fileName; // Return just the filename for storage
  } catch (error) {
    console.error('File save error:', error);
    throw new Error('Failed to save file');
  }
}

export async function extractTextFromPDF(
  file: File, 
  options: FileExtractionOptions = {}
): Promise<PDFExtractionResult> {
  const startTime = Date.now();
  const {
    minTextLength = 50,
    enableFallback = true,
    logDetails = true
  } = options;

  const metadata: PDFExtractionMetadata = {
    fileName: file.name,
    fileSize: file.size,
    extractionMethod: 'pdf-parse',
    processingTime: 0
  };

  if (logDetails) {
    console.log(`📄 PDF file received: ${file.name} (${file.size} bytes)`);
  }

  try {
    // Convert File to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (logDetails) {
      console.log('🔍 Extracting text from PDF using pdf-parse...');
    }
    
    // Import pdf-parse dynamically
    const pdfParse = (await import('pdf-parse')).default;
    
    // Parse the PDF with error handling for ENOENT issue
    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (parseError: unknown) {
      // Handle the known ENOENT issue with pdf-parse
      if (parseError instanceof Error && 'code' in parseError && parseError.code === 'ENOENT' && 'path' in parseError && typeof parseError.path === 'string' && parseError.path.includes('test/data')) {
        console.warn('⚠️ pdf-parse ENOENT test file issue detected, retrying...');
        // Try again - sometimes it works on retry
        pdfData = await pdfParse(buffer);
      } else {
        throw parseError;
      }
    }
    
    metadata.numPages = pdfData.numpages;
    metadata.textLength = pdfData.text?.length || 0;
    metadata.processingTime = Date.now() - startTime;
    
    if (logDetails) {
      console.log(`📄 PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);
    }
    
    if (pdfData.text && pdfData.text.trim().length >= minTextLength) {
      if (logDetails) {
        console.log(`✅ Successfully extracted ${pdfData.text.length} characters from PDF`);
        console.log(`📝 First 200 chars: ${pdfData.text.substring(0, 200)}...`);
      }
      
      return {
        success: true,
        text: pdfData.text.trim(),
        metadata
      };
    } else {
      if (logDetails) {
        console.log(`⚠️ PDF text extraction returned minimal content (${pdfData.text?.length || 0} chars)`);
      }
      
      if (enableFallback) {
        metadata.extractionMethod = 'fallback';
        const fallbackText = `PDF Document: ${file.name}
File Size: ${file.size} bytes
Pages: ${pdfData.numpages || 'Unknown'}
Note: PDF text extraction returned minimal content. The PDF might be image-based, encrypted, or have formatting issues.`;
        
        return {
          success: false,
          text: fallbackText,
          error: 'Minimal text content extracted',
          metadata
        };
      } else {
        return {
          success: false,
          error: 'PDF text extraction returned insufficient content',
          metadata
        };
      }
    }
  } catch (pdfError: unknown) {
    metadata.processingTime = Date.now() - startTime;
    
    const extractionError: PDFExtractionError = {
      type: (pdfError instanceof Error && 'code' in pdfError && pdfError.code === 'ENOENT') ? 'enoent' : 'parsing',
      message: pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error',
      details: pdfError,
      fileName: file.name,
      fileSize: file.size,
      originalError: pdfError instanceof Error ? pdfError : undefined
    };
    
    if (logDetails) {
      console.error('PDF parsing error:', extractionError);
    }
    
    if (enableFallback) {
      metadata.extractionMethod = 'fallback';
      const fallbackText = `PDF Document: ${file.name}
File Size: ${file.size} bytes
Note: PDF text extraction failed. Error: ${extractionError.message}`;
      
      return {
        success: false,
        text: fallbackText,
        error: extractionError.message,
        metadata
      };
    } else {
      return {
        success: false,
        error: extractionError.message,
        metadata
      };
    }
  }
}

export async function extractTextFromFile(
  file: File, 
  options: FileExtractionOptions = {}
): Promise<string> {
  const { logDetails = true } = options;
  
  if (logDetails) {
    console.log(`🔍 Starting text extraction for: ${file.name} (${file.size} bytes, ${file.type})`);
  }
  
  try {
    // Validate file size
    if (options.maxFileSize && file.size > options.maxFileSize) {
      throw new Error(`File size (${file.size} bytes) exceeds maximum allowed size (${options.maxFileSize} bytes)`);
    }
    
    if (file.type === 'text/plain') {
      if (logDetails) {
        console.log('📝 Processing plain text file...');
      }
      const text = await file.text();
      
      if (logDetails) {
        console.log(`✅ Plain text extracted: ${text.length} characters`);
      }
      
      return text;
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      if (logDetails) {
        console.log('📄 Processing PDF file...');
      }
      
      const result = await extractTextFromPDF(file, options);
      
      if (result.success && result.text) {
        if (logDetails) {
          console.log(`✅ PDF extraction successful: ${result.text.length} characters`);
        }
        return result.text;
      } else if (result.text) {
        if (logDetails) {
          console.warn(`⚠️ PDF extraction partial success with fallback: ${result.error}`);
        }
        // Return fallback text even if extraction wasn't fully successful
        return result.text;
      } else {
        const errorMsg = result.error || 'PDF text extraction failed';
        if (logDetails) {
          console.error(`❌ PDF extraction failed: ${errorMsg}`);
        }
        throw new Error(errorMsg);
      }
    } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      if (logDetails) {
        console.warn('⚠️ Word document detected - not supported');
      }
      throw new Error('Word documents not yet supported. Please convert to PDF or paste text manually.');
    } else {
      if (logDetails) {
        console.error(`❌ Unsupported file type: ${file.type}`);
      }
      throw new Error(`Unsupported file type: ${file.type}. Please use TXT or PDF files.`);
    }
  } catch (error) {
    if (logDetails) {
      console.error(`❌ File extraction error for ${file.name}:`, error);
    }
    
    // Enhance error message with file context
    if (error instanceof Error) {
      error.message = `Failed to extract text from ${file.name}: ${error.message}`;
    }
    
    throw error;
  }
}

// Utility function to validate extraction quality
export function validateExtractionQuality(
  text: string, 
  fileName: string, 
  minLength: number = 50
): { isValid: boolean; issues: string[]; score: number } {
  const issues: string[] = [];
  let score = 100;
  
  // Check text length
  if (text.length < minLength) {
    issues.push(`Text too short (${text.length} chars, minimum ${minLength})`);
    score -= 40;
  }
  
  // Check for placeholder patterns
  const placeholderPatterns = [
    /PDF Document:/,
    /Note: PDF text extraction/,
    /PDF_PLACEHOLDER/,
    /Failed to parse PDF/
  ];
  
  for (const pattern of placeholderPatterns) {
    if (pattern.test(text)) {
      issues.push('Contains placeholder text indicating extraction failure');
      score -= 30;
      break;
    }
  }
  
  // Check for reasonable text content (not just whitespace/special chars)
  const meaningfulChars = text.replace(/[\s\n\r\t]/g, '').length;
  const meaningfulRatio = meaningfulChars / text.length;
  
  if (meaningfulRatio < 0.1) {
    issues.push('Text appears to be mostly whitespace or special characters');
    score -= 20;
  }
  
  // Check for common extraction artifacts
  const artifactPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /\s{5,}/, // Excessive whitespace
  ];
  
  for (const pattern of artifactPatterns) {
    if (pattern.test(text)) {
      issues.push('Contains extraction artifacts (repeated chars/excessive whitespace)');
      score -= 10;
      break;
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
}
