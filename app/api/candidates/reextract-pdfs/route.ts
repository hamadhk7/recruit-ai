import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';
import { readFile } from 'fs/promises';
import path from 'path';
// pdf-parse will be imported dynamically

/**
 * @swagger
 * /api/candidates/reextract-pdfs:
 *   post:
 *     summary: Re-extract text from PDF files for existing candidates
 *     description: Re-reads PDF files from disk and extracts actual text content
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: PDFs reprocessed successfully
 *       500:
 *         description: Internal server error
 */

export async function POST() {
  try {
    await connectDB();
    
    // Find candidates with PDF placeholder text
    const candidatesToReprocess = await Candidate.find({
      $or: [
        { resumeText: { $regex: /^PDF Document:/ } },
        { resumeText: { $regex: /PDF text extraction not yet implemented/ } },
        { resumeText: { $regex: /PDF_PLACEHOLDER/ } }
      ]
    });

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const candidate of candidatesToReprocess) {
      processed++;
      
      try {
        console.log(`📄 Re-extracting PDF for candidate ${candidate._id} (${candidate.originalFileName})...`);
        
        if (!candidate.filePath) {
          console.log(`⚠️ No file path for candidate ${candidate._id}`);
          continue;
        }
        
        // Read the PDF file from disk
        const fullPath = path.join(process.cwd(), candidate.filePath);
        const fileBuffer = await readFile(fullPath);
        
        console.log(`🔍 Extracting text from ${candidate.originalFileName}...`);
        
        // Import pdf-parse dynamically
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        
        if (pdfData.text && pdfData.text.trim().length > 50) {
          console.log(`✅ Successfully extracted ${pdfData.text.length} characters`);
          
          // Update resume text with extracted content
          candidate.resumeText = pdfData.text.trim();
          
          // Process with AI
          console.log('🤖 Processing with AI...');
          const aiData = await parseResumeWithAI(pdfData.text.trim());
          
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
          
          console.log(`✅ Updated candidate ${candidate._id} with extracted data:`, {
            name: aiData.name,
            email: aiData.email,
            skillsCount: aiData.skills?.length || 0,
            experienceCount: aiData.experience?.length || 0
          });
        } else {
          console.log(`⚠️ PDF ${candidate.originalFileName} appears to be empty or image-based`);
        }
        
      } catch (error: any) {
        console.error(`❌ Failed to reprocess PDF for candidate ${candidate._id}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      data: {
        processed,
        updated,
        errors
      },
      message: `Reprocessed ${processed} PDFs, updated ${updated} candidates, ${errors} errors`
    });
  } catch (error: any) {
    console.error('PDF reextraction error:', error);
    return Response.json({
      success: false,
      error: 'Failed to reextract PDFs'
    }, { status: 500 });
  }
}