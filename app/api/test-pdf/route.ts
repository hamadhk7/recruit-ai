import { readFile } from 'fs/promises';
import path from 'path';
import { PDFExtractionResult } from '@/types/pdf-extraction';

export async function GET(request: Request) {
  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🧪 [${testId}] Starting PDF extraction test...`);
  
  try {
    const { searchParams } = new URL(request.url);
    const specificFile = searchParams.get('file');
    
    // List available PDF files for testing
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let availableFiles: string[] = [];
    
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(uploadsDir);
      availableFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      console.log(`📁 [${testId}] Found ${availableFiles.length} PDF files in uploads directory`);
    } catch (dirError) {
      console.warn(`⚠️ [${testId}] Could not read uploads directory:`, dirError);
    }
    
    // Determine which file to test
    let testFile: string;
    if (specificFile && availableFiles.includes(specificFile)) {
      testFile = `uploads/${specificFile}`;
    } else if (availableFiles.length > 0) {
      // Use the most recent file
      testFile = `uploads/${availableFiles[availableFiles.length - 1]}`;
    } else {
      console.warn(`⚠️ [${testId}] No PDF files available for testing`);
      return Response.json({
        success: false,
        error: 'No PDF files available for testing',
        suggestion: 'Upload a PDF file first, then try this endpoint again',
        availableFiles: [],
        testEndpoints: {
          testSpecificFile: '/api/test-pdf?file=filename.pdf',
          listFiles: '/api/test-pdf'
        }
      }, { status: 404 });
    }
    
    const fullPath = path.join(process.cwd(), testFile);
    console.log(`🎯 [${testId}] Testing PDF extraction: ${testFile}`);
    
    // Check if file exists and get file stats
    let fileStats: any = {};
    try {
      const { stat } = await import('fs/promises');
      const stats = await stat(fullPath);
      fileStats = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
      console.log(`📊 [${testId}] File stats:`, fileStats);
    } catch (statError) {
      console.error(`❌ [${testId}] Could not get file stats:`, statError);
    }
    
    // Read and test the file
    try {
      const fileBuffer = await readFile(fullPath);
      console.log(`📖 [${testId}] File read successfully: ${fileBuffer.length} bytes`);
      
      // Create a mock File object for testing
      const mockFile = new File([new Uint8Array(fileBuffer)], path.basename(testFile), {
        type: 'application/pdf'
      });
      
      // Import the enhanced extraction function
      const { extractTextFromPDF, validateExtractionQuality } = await import('@/lib/fileUtils');
      
      // Test with different configurations
      const testConfigs = [
        { name: 'Standard', minTextLength: 50, enableFallback: true },
        { name: 'Lenient', minTextLength: 10, enableFallback: true },
        { name: 'Strict', minTextLength: 100, enableFallback: false }
      ];
      
      const testResults = [];
      
      for (const config of testConfigs) {
        console.log(`🔬 [${testId}] Testing with ${config.name} configuration...`);
        
        try {
          const extractionResult: PDFExtractionResult = await extractTextFromPDF(mockFile, {
            ...config,
            logDetails: true
          });
          
          // Validate extraction quality
          const qualityCheck = extractionResult.text ? 
            validateExtractionQuality(extractionResult.text, mockFile.name, config.minTextLength) :
            { isValid: false, issues: ['No text extracted'], score: 0 };
          
          testResults.push({
            config: config.name,
            success: extractionResult.success,
            textLength: extractionResult.text?.length || 0,
            error: extractionResult.error,
            metadata: extractionResult.metadata,
            qualityCheck,
            preview: extractionResult.text?.substring(0, 200) || 'No text'
          });
          
          console.log(`📊 [${testId}] ${config.name} result:`, {
            success: extractionResult.success,
            textLength: extractionResult.text?.length || 0,
            qualityScore: qualityCheck.score
          });
          
        } catch (configError) {
          console.error(`❌ [${testId}] ${config.name} configuration failed:`, configError);
          testResults.push({
            config: config.name,
            success: false,
            error: configError instanceof Error ? configError.message : 'Unknown error',
            textLength: 0
          });
        }
      }
      
      // Get the best result for main response
      const bestResult = testResults.find(r => r.success && r.textLength > 50) || testResults[0];
      
      console.log(`✅ [${testId}] PDF extraction test completed`);
      
      return Response.json({
        success: true,
        testId,
        data: {
          fileName: testFile,
          fileStats,
          availableFiles,
          testResults,
          bestResult,
          recommendations: generateRecommendations(testResults),
          fullText: bestResult?.preview ? 
            testResults.find(r => r.success)?.preview?.substring(0, 2000) : 
            'No text available'
        },
        message: `PDF extraction test completed with ${testResults.filter(r => r.success).length}/${testResults.length} successful configurations`
      });
      
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        console.error(`❌ [${testId}] Test file not found: ${testFile}`);
        return Response.json({
          success: false,
          testId,
          error: `Test file not found: ${testFile}`,
          availableFiles,
          suggestion: availableFiles.length > 0 ? 
            `Try: /api/test-pdf?file=${availableFiles[0]}` : 
            'Upload a PDF file first to test extraction'
        }, { status: 404 });
      }
      throw fileError;
    }
  } catch (error: any) {
    console.error(`❌ [${testId}] Test PDF error:`, error);
    return Response.json({
      success: false,
      testId,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      troubleshooting: {
        commonIssues: [
          'No PDF files in uploads directory',
          'PDF file is corrupted or password-protected',
          'pdf-parse library ENOENT issue',
          'Insufficient memory for large PDFs'
        ],
        solutions: [
          'Upload a valid PDF file first',
          'Try with a different PDF file',
          'Check server logs for detailed error information',
          'Ensure uploads directory exists and is writable'
        ]
      }
    }, { status: 500 });
  }
}

function generateRecommendations(testResults: any[]): string[] {
  const recommendations: string[] = [];
  
  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);
  
  if (successfulTests.length === 0) {
    recommendations.push('❌ All extraction methods failed - PDF may be image-based or corrupted');
    recommendations.push('💡 Try converting the PDF to text format or using OCR');
  } else if (successfulTests.length < testResults.length) {
    recommendations.push('⚠️ Some extraction methods failed - PDF has extraction challenges');
    recommendations.push('💡 Use lenient settings for better compatibility');
  } else {
    recommendations.push('✅ All extraction methods succeeded - PDF is well-formatted');
  }
  
  const bestQuality = Math.max(...testResults.map(r => r.qualityCheck?.score || 0));
  if (bestQuality < 50) {
    recommendations.push('📊 Low quality extraction detected - consider manual review');
  } else if (bestQuality > 80) {
    recommendations.push('📊 High quality extraction - text is reliable');
  }
  
  return recommendations;
}