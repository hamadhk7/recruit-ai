import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';

/**
 * @swagger
 * /api/candidates/{id}/update-text:
 *   post:
 *     summary: Manually update candidate's resume text and reprocess with AI
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeText
 *             properties:
 *               resumeText:
 *                 type: string
 *                 description: The full text content of the resume
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Internal server error
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { resumeText } = await request.json();
    
    if (!resumeText || resumeText.trim().length < 50) {
      return Response.json({
        success: false,
        error: 'Resume text is required and must be at least 50 characters'
      }, { status: 400 });
    }
    
    const { id } = await params;
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return Response.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }
    
    console.log(`📝 Updating candidate ${id} with manual text input (${resumeText.length} chars)`);
    
    // Update resume text
    candidate.resumeText = resumeText;
    
    // Process with AI
    console.log('🤖 Processing with AI...');
    const aiData = await parseResumeWithAI(resumeText);
    
    console.log('✅ AI processing completed:', {
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
    
    // Populate references for response
    await candidate.populate('jobId', 'title');
    await candidate.populate('organizationId', 'name');
    
    return Response.json({
      success: true,
      data: candidate,
      message: 'Candidate updated successfully with AI-processed data'
    });
    
  } catch (error: any) {
    console.error('Update text error:', error);
    return Response.json({
      success: false,
      error: 'Failed to update candidate'
    }, { status: 500 });
  }
}