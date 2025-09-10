import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';

/**
 * @swagger
 * /api/candidates/reprocess:
 *   post:
 *     summary: Reprocess candidates with "Unknown Candidate" names
 *     description: Re-runs AI parsing on candidates with generic names to extract proper names
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: Candidates reprocessed successfully
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
 *                         processed:
 *                           type: number
 *                           description: Number of candidates processed
 *                         updated:
 *                           type: number
 *                           description: Number of candidates with updated names
 *       500:
 *         description: Internal server error
 */

export async function POST() {
  try {
    await connectDB();

    // Find candidates with generic names, hardcoded test data, or hardcoded skills
    const candidatesToReprocess = await Candidate.find({
      $or: [
        { name: "Unknown Candidate" },
        { name: "Failed to parse" },
        { name: "Ahad Raza" }, // Remove hardcoded test data
        { name: { $regex: /^Candidate_\d+$/ } },
        { email: "ahadraza30@gmail.com" }, // Remove hardcoded email
        { "aiData.skills": { $in: ["Python", "TensorFlow", "PyTorch"] } }, // Remove hardcoded skills pattern
        { "aiData.experience.company": "AI Lab" }, // Remove hardcoded experience
        { "aiData.education.institution": "FAST NUCES Islamabad" } // Remove hardcoded education
      ]
    });

    let processed = 0;
    let updated = 0;

    for (const candidate of candidatesToReprocess) {
      processed++;

      if (candidate.resumeText && candidate.resumeText.trim().length > 50) {
        try {
          console.log(`🤖 Reprocessing candidate ${candidate._id}...`);

          // Check if this is a PDF placeholder (no real text extracted) or needs reprocessing
          if (candidate.resumeText.includes("PDF Document:") || candidate.resumeText.includes("PDF_PLACEHOLDER") || candidate.resumeText.includes("Note: PDF text extraction")) {
            // For PDF placeholders, create clean data based on filename only
            const filename = candidate.originalFileName || candidate.fileName || 'Unknown';
            let nameFromFile = filename
              .replace(/\.(pdf|doc|docx|txt)$/i, '') // Remove extension
              .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
              .replace(/\b(cv|resume|curriculum|vitae)\b/gi, '') // Remove common resume words
              .replace(/\d+/g, '') // Remove numbers
              .trim();

            // Capitalize each word
            if (nameFromFile && nameFromFile.length > 2) {
              nameFromFile = nameFromFile
                .split(' ')
                .filter((word: string) => word.length > 0)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            } else {
              nameFromFile = "Unknown Candidate";
            }

            // Create clean, non-hardcoded data
            const cleanAiData = {
              name: nameFromFile,
              email: null,
              phone: null,
              location: null,
              summary: `Resume uploaded as ${filename}. PDF text extraction not yet implemented - manual review recommended.`,
              skills: [], // No hardcoded skills
              experience: [], // No hardcoded experience
              education: [], // No hardcoded education
              linkedin: null,
              github: null,
              portfolio: null
            };

            candidate.name = nameFromFile;
            candidate.email = null; // Clear hardcoded email
            candidate.aiData = cleanAiData;
            await candidate.save();
            updated++;
            console.log(`✅ Cleaned candidate ${candidate._id} with name: ${nameFromFile}`);
          } else {
            // For real text content, use AI parsing
            const aiData = await parseResumeWithAI(candidate.resumeText);

            // Update if we got a valid name
            if (aiData.name && aiData.name !== "Unknown Candidate" && aiData.name !== "Failed to parse") {
              candidate.name = aiData.name;
              candidate.aiData = { ...candidate.aiData, ...aiData };
              await candidate.save();
              updated++;
              console.log(`✅ Updated candidate ${candidate._id} with name: ${aiData.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to reprocess candidate ${candidate._id}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      data: {
        processed,
        updated
      },
      message: `Reprocessed ${processed} candidates, updated ${updated} names`
    });
  } catch (error: any) {
    console.error('Reprocessing error:', error);
    return Response.json({
      success: false,
      error: 'Failed to reprocess candidates'
    }, { status: 500 });
  }
}