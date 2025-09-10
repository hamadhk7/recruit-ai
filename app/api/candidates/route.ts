import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { parseResumeWithAI } from '@/lib/openai';

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates with optional filtering
 *     tags: [Candidates]
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: List of candidates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Candidate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new candidate and process resume with AI
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - jobId
 *               - name
 *             properties:
 *               organizationId:
 *                 type: string
 *                 description: ID of the organization
 *                 example: "507f1f77bcf86cd799439011"
 *               jobId:
 *                 type: string
 *                 description: ID of the job the candidate is applying for
 *                 example: "507f1f77bcf86cd799439012"
 *               name:
 *                 type: string
 *                 description: Candidate full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Candidate email address
 *                 example: "john.doe@email.com"
 *               resumeText:
 *                 type: string
 *                 description: Resume text content (will be processed by AI if provided)
 *                 example: "John Doe\nSoftware Engineer\n5+ years experience..."
 *               fileName:
 *                 type: string
 *                 description: Original uploaded file name
 *                 example: "john_doe_resume.pdf"
 *     responses:
 *       201:
 *         description: Candidate created and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Bad request - missing required fields
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

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const jobId = searchParams.get('jobId');

    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    if (jobId) filter.jobId = jobId;

    const candidates = await Candidate.find(filter)
      .populate('jobId', 'title')
      .populate('organizationId', 'name')
      .select('-resumeText') // Exclude full resume text for list view
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: candidates,
      count: candidates.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch candidates'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate required fields
    if (!data.organizationId || !data.jobId || !data.name) {
      return Response.json({
        success: false,
        error: 'organizationId, jobId, and name are required'
      }, { status: 400 });
    }

    // Process resume with AI if text is provided
    let aiData: any = {};
    if (data.resumeText && data.resumeText.trim().length > 50) {
      console.log('🤖 Processing resume with AI...');
      aiData = await parseResumeWithAI(data.resumeText);
      console.log('✅ AI processing completed:', aiData);
    }

    // Use AI-parsed name if available and valid, otherwise fall back to provided name
    const candidateName = (aiData.name && aiData.name !== "Unknown Candidate" && aiData.name !== "Failed to parse") 
      ? aiData.name 
      : data.name;

    const candidate = new Candidate({
      organizationId: data.organizationId,
      jobId: data.jobId,
      name: candidateName,
      email: data.email || aiData.email || null,
      resumeText: data.resumeText,
      aiData,
      fileName: data.fileName,
      processingStatus: 'completed'
    });

    await candidate.save();

    // Populate references for response
    await candidate.populate('jobId', 'title');
    await candidate.populate('organizationId', 'name');

    return Response.json({
      success: true,
      data: candidate,
      message: 'Candidate created and processed successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Candidate creation error:', error);
    return Response.json({
      success: false,
      error: 'Failed to create candidate'
    }, { status: 500 });
  }
}
