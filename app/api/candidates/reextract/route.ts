import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * @swagger
 * /api/candidates/reextract:
 *   post:
 *     summary: Re-extract text from PDF files and reprocess with AI
 *     description: Re-reads PDF files from disk, extracts text, and reprocesses with AI
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: PDFs re-extracted and reprocessed successfully
 */

export async function POST() {
  try {
    await connectDB();
    
    // Find candidates with PDF files that need re-extraction
    const candidatesToReextract = await Candidate.find({
      $and: [
        { filePath: { $exists: true } },
        { originalFileName: { $regex: /\.pdf$/i } },
        {
          $or: [
            { resumeText: { $regex: /PDF Document:/ } },
            { resumeText: { $regex: /PDF_PLACEHOLDER/ } },
            { resumeText: { $regex: /Note: PDF text extraction/ } }
          ]
        }
      ]
    });

    let processed = 0;
    let updated = 0;

    for (const candidate of candidatesToReextract) {
      processed++;
      
      try {
        console.log(`📄 Re-extracting PDF for candidate ${candidate._id}: ${candidate.originalFileName}`);
        
        // Read the PDF file from disk
        const fullPath = path.join(process.cwd(), candidate.filePath);
        const fileBuffer = await readFile(fullPath);
        
        // Import pdf-parse for PDF text extraction
        const pdfParse = (await import('pdf-parse')).default;
        
        console.log(`🔍 Extracting text from PDF buffer (${fileBuffer.length} bytes)...`);
        
        // Parse the PDF
        const pdfData = await pdfParse(fileBuffer);
        
        console.log(`📄 PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);
        
        const extractedText = pdfData.text.trim();
        console.log(`📊 PDF extraction result: ${extractedText?.length || 0} characters`);
        
        console.log(`📊 Extracted text length: ${extractedText?.length || 0}`);
        console.log(`📝 First 100 chars: "${extractedText?.substring(0, 100) || 'NO TEXT'}"`);
        
        if (extractedText && extractedText.trim().length > 10) { // Lower threshold for testing
          console.log(`✅ Successfully extracted ${extractedText.length} characters from ${candidate.originalFileName}`);
          
          // Update resume text
          candidate.resumeText = extractedText;
          
          // Reprocess with AI
          console.log(`🤖 Processing with AI...`);
          const aiData = await parseResumeWithAI(extractedText);
          
          console.log(`🔍 AI parsing result:`, {
            name: aiData.name,
            email: aiData.email,
            skillsCount: aiData.skills?.length || 0,
            experienceCount: aiData.experience?.length || 0
          });
          
          // Update candidate data
          if (aiData.name && aiData.name !== "Unknown Candidate" && aiData.name !== "Failed to parse") {
            candidate.name = aiData.name;
          }
          if (aiData.email && aiData.email !== "null" && aiData.email !== null) {
            candidate.email = aiData.email;
          }
          
          candidate.aiData = aiData;
          await candidate.save();
          updated++;
          
          console.log(`✅ Updated candidate ${candidate._id} with extracted data`);
        } else {
          console.log(`⚠️ PDF ${candidate.originalFileName} returned minimal text content (${extractedText?.length || 0} chars)`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to re-extract PDF for candidate ${candidate._id}:`, error);
      }
    }

    return Response.json({
      success: true,
      data: {
        processed,
        updated
      },
      message: `Re-extracted ${processed} PDFs, updated ${updated} candidates with real data`
    });
  } catch (error: any) {
    console.error('PDF re-extraction error:', error);
    return Response.json({
      success: false,
      error: 'Failed to re-extract PDFs'
    }, { status: 500 });
  }
}