import { NextRequest } from 'next/server';
import { saveUploadedFile, extractTextFromFile } from '@/lib/fileUtils';
import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload and process resume files
 *     description: Uploads resume files (PDF, DOC, DOCX, TXT) and extracts text content
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - jobId
 *               - organizationId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (PDF, DOC, DOCX, or TXT)
 *               jobId:
 *                 type: string
 *                 description: ID of the job the candidate is applying for
 *                 example: "507f1f77bcf86cd799439012"
 *               organizationId:
 *                 type: string
 *                 description: ID of the organization
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: File uploaded, processed, and candidate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         candidateId:
 *                           type: string
 *                           description: ID of the created candidate record
 *                         fileName:
 *                           type: string
 *                           description: Generated file name
 *                         originalName:
 *                           type: string
 *                           description: Original file name
 *                         fileSize:
 *                           type: number
 *                           description: File size in bytes
 *                         fileType:
 *                           type: string
 *                           description: MIME type of the file
 *                         extractedText:
 *                           type: string
 *                           description: First 500 characters of extracted text
 *                         fullTextLength:
 *                           type: number
 *                           description: Total length of extracted text
 *                         jobId:
 *                           type: string
 *                         organizationId:
 *                           type: string
 *                         candidate:
 *                           type: object
 *                           description: Created candidate record with AI-processed data
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             aiData:
 *                               type: object
 *                               description: AI-processed resume data
 *                             processingStatus:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *       400:
 *         description: Bad request - missing file or invalid file type/size
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export async function POST(request: NextRequest) {
  const uploadStartTime = Date.now();
  let uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🚀 [${uploadId}] Starting file upload process...`);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const organizationId = formData.get('organizationId') as string;

    console.log(`📋 [${uploadId}] Upload parameters:`, {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      jobId,
      organizationId
    });

    if (!file) {
      console.error(`❌ [${uploadId}] No file provided in request`);
      return Response.json({
        success: false,
        error: 'No file provided',
        uploadId
      }, { status: 400 });
    }

    if (!jobId || !organizationId) {
      console.error(`❌ [${uploadId}] Missing required parameters:`, { jobId: !!jobId, organizationId: !!organizationId });
      return Response.json({
        success: false,
        error: 'jobId and organizationId are required',
        uploadId
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      console.error(`❌ [${uploadId}] File too large: ${file.size} bytes (max: ${maxFileSize})`);
      return Response.json({
        success: false,
        error: `File size must be less than 5MB (current: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB)`,
        uploadId
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      console.error(`❌ [${uploadId}] Invalid file type:`, { 
        type: file.type, 
        extension: fileExtension,
        allowedTypes,
        allowedExtensions
      });
      return Response.json({
        success: false,
        error: `Only TXT, PDF, DOC, and DOCX files are allowed. Received: ${file.type || 'unknown type'}`,
        uploadId
      }, { status: 400 });
    }

    console.log(`✅ [${uploadId}] File validation passed`);

    // Save file
    console.log(`💾 [${uploadId}] Saving file to disk...`);
    let fileName: string;
    try {
      fileName = await saveUploadedFile(file);
      console.log(`✅ [${uploadId}] File saved successfully: ${fileName}`);
    } catch (saveError: any) {
      console.error(`❌ [${uploadId}] File save failed:`, saveError);
      return Response.json({
        success: false,
        error: `Failed to save file: ${saveError.message}`,
        uploadId
      }, { status: 500 });
    }

    // Extract text with enhanced error handling
    console.log(`🔍 [${uploadId}] Starting text extraction...`);
    let extractedText: string;
    let extractionMetadata: any = {};
    
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        console.log(`📄 [${uploadId}] Processing PDF file with enhanced extraction...`);
        // Use enhanced PDF extraction for better error handling
        const { extractTextFromPDF } = await import('@/lib/fileUtils');
        const extractionResult = await extractTextFromPDF(file, {
          minTextLength: 50,
          enableFallback: true,
          logDetails: true
        });
        
        extractedText = extractionResult.text || '';
        extractionMetadata = {
          extractionSuccess: extractionResult.success,
          extractionMethod: extractionResult.metadata.extractionMethod,
          processingTime: extractionResult.metadata.processingTime,
          numPages: extractionResult.metadata.numPages,
          extractionError: extractionResult.error
        };
        
        console.log(`📊 [${uploadId}] PDF extraction result:`, {
          success: extractionResult.success,
          textLength: extractedText.length,
          method: extractionResult.metadata.extractionMethod,
          processingTime: extractionResult.metadata.processingTime
        });
        
        if (!extractionResult.success) {
          console.warn(`⚠️ [${uploadId}] PDF extraction not fully successful: ${extractionResult.error}`);
        }
      } else {
        console.log(`📝 [${uploadId}] Processing non-PDF file...`);
        // Use regular extraction for non-PDF files
        const { extractTextFromFile } = await import('@/lib/fileUtils');
        extractedText = await extractTextFromFile(file, { logDetails: true });
        extractionMetadata = {
          extractionSuccess: true,
          extractionMethod: 'direct'
        };
      }
      
      console.log(`✅ [${uploadId}] Text extraction completed: ${extractedText.length} characters`);
      
    } catch (extractionError: any) {
      console.error(`❌ [${uploadId}] Text extraction failed:`, extractionError);
      // Provide a meaningful fallback
      extractedText = `File: ${file.name}
Size: ${file.size} bytes
Type: ${file.type}
Note: Text extraction failed. Error: ${extractionError.message}`;
      
      extractionMetadata = {
        extractionSuccess: false,
        extractionError: extractionError.message
      };
      
      console.warn(`⚠️ [${uploadId}] Using fallback text due to extraction failure`);
    }

    // Connect to database and create candidate record
    console.log(`🗄️ [${uploadId}] Connecting to database...`);
    try {
      await connectDB();
      console.log(`✅ [${uploadId}] Database connected successfully`);
    } catch (dbError: any) {
      console.error(`❌ [${uploadId}] Database connection failed:`, dbError);
      return Response.json({
        success: false,
        error: 'Database connection failed',
        uploadId
      }, { status: 500 });
    }
    
    // Process resume with AI if text is substantial
    let aiData: any = {};
    let aiProcessingSuccess = false;
    
    if (extractedText && extractedText.trim().length > 50) {
      console.log(`🤖 [${uploadId}] Processing resume with AI... (${extractedText.length} chars)`);
      try {
        aiData = await parseResumeWithAI(extractedText);
        aiProcessingSuccess = true;
        console.log(`✅ [${uploadId}] AI processing completed successfully:`, {
          name: aiData.name,
          email: aiData.email,
          skillsCount: aiData.skills?.length || 0,
          hasProcessingNote: !!aiData.processingNote
        });
      } catch (aiError: any) {
        console.error(`❌ [${uploadId}] AI processing failed:`, aiError);
        // AI failure shouldn't block the upload, use fallback
        aiData = {
          name: `Candidate_${Date.now()}`,
          email: null,
          skills: ['General'],
          experience: [],
          education: [],
          summary: 'AI processing unavailable - see resume text for details',
          processingNote: `AI processing failed: ${aiError.message}`
        };
        console.warn(`⚠️ [${uploadId}] Using fallback AI data due to processing failure`);
      }
    } else {
      console.warn(`⚠️ [${uploadId}] Skipping AI processing - insufficient text content (${extractedText?.length || 0} chars)`);
      aiData = {
        name: `Candidate_${Date.now()}`,
        email: null,
        skills: ['General'],
        experience: [],
        education: [],
        summary: 'Insufficient text content for AI processing',
        processingNote: 'Skipped AI processing due to minimal text content'
      };
    }

    // Use AI-parsed name if available and valid, otherwise use a more descriptive fallback
    const candidateName = (aiData.name && aiData.name !== "Unknown Candidate" && aiData.name !== "Failed to parse") 
      ? aiData.name 
      : `Candidate_${Date.now()}`; // Use timestamp-based name as fallback

    console.log(`👤 [${uploadId}] Creating candidate record: ${candidateName}`);

    // Create candidate record in database
    let candidate;
    try {
      candidate = new Candidate({
        organizationId,
        jobId,
        name: candidateName,
        email: aiData.email || null,
        resumeText: extractedText,
        aiData,
        fileName: fileName, // Generated filename
        originalFileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `uploads/${fileName}`,
        processingStatus: 'completed'
      });

      await candidate.save();
      console.log(`✅ [${uploadId}] Candidate record created successfully: ${candidate._id}`);
    } catch (saveError: any) {
      console.error(`❌ [${uploadId}] Failed to save candidate record:`, saveError);
      return Response.json({
        success: false,
        error: `Failed to create candidate record: ${saveError.message}`,
        uploadId
      }, { status: 500 });
    }

    // Populate references for response
    try {
      await candidate.populate('jobId', 'title');
      await candidate.populate('organizationId', 'name');
      console.log(`🔗 [${uploadId}] References populated successfully`);
    } catch (populateError: any) {
      console.warn(`⚠️ [${uploadId}] Failed to populate references:`, populateError);
      // Continue without populated references
    }

    const processingTime = Date.now() - uploadStartTime;
    console.log(`🎉 [${uploadId}] Upload process completed successfully in ${processingTime}ms`);

    return Response.json({
      success: true,
      data: {
        uploadId,
        candidateId: candidate._id,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        fullTextLength: extractedText.length,
        jobId,
        organizationId,
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          aiData: candidate.aiData,
          processingStatus: candidate.processingStatus,
          createdAt: candidate.createdAt
        },
        extractionMetadata: {
          ...extractionMetadata,
          aiProcessingSuccess
        },
        processingTime
      },
      message: 'File uploaded, processed, and candidate created successfully'
    });
  } catch (error: any) {
    const processingTime = Date.now() - uploadStartTime;
    console.error(`❌ [${uploadId}] Upload process failed after ${processingTime}ms:`, error);
    
    // Categorize the error for better user feedback
    let errorMessage = 'File upload failed';
    let statusCode = 500;
    
    if (error.message?.includes('File size')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message?.includes('file type') || error.message?.includes('Unsupported')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message?.includes('Database')) {
      errorMessage = 'Database error occurred during upload';
      statusCode = 500;
    } else if (error.message?.includes('extraction')) {
      errorMessage = 'Text extraction failed - please try a different file format';
      statusCode = 422;
    } else {
      errorMessage = error.message || 'An unexpected error occurred during upload';
    }
    
    return Response.json({
      success: false,
      error: errorMessage,
      uploadId,
      processingTime,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }
}
