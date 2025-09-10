import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import Candidate from '@/models/Candidate';
import Match from '@/models/Match';
import { calculateJobMatch } from '@/lib/openai';

/**
 * @swagger
 * /api/matches/generate:
 *   post:
 *     summary: Generate AI-powered matches for a job
 *     description: Analyzes all candidates for a specific job and generates match scores using AI
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job to generate matches for
 *                 example: "507f1f77bcf86cd799439012"
 *               regenerate:
 *                 type: boolean
 *                 description: Whether to regenerate existing matches
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Matches generated successfully
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
 *                         jobId:
 *                           type: string
 *                           description: ID of the job
 *                         jobTitle:
 *                           type: string
 *                           description: Title of the job
 *                         totalCandidates:
 *                           type: number
 *                           description: Total number of candidates processed
 *                         successfulMatches:
 *                           type: number
 *                           description: Number of successful matches generated
 *                         errors:
 *                           type: number
 *                           description: Number of errors encountered
 *                         matches:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Match'
 *                         errorDetails:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               candidateId:
 *                                 type: string
 *                               candidateName:
 *                                 type: string
 *                               error:
 *                                 type: string
 *       400:
 *         description: Bad request - missing jobId or no candidates found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Job not found
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

export async function POST(request: Request) {
  try {
    await connectDB();
    const { jobId, regenerate = false } = await request.json();

    if (!jobId) {
      return Response.json({
        success: false,
        error: 'jobId is required'
      }, { status: 400 });
    }

    // Get job details
    const job = await Job.findById(jobId).populate('organizationId', 'name');
    if (!job) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Check if job has organizationId, if not, try to get the first available organization
    let organizationId = job.organizationId;
    if (!organizationId) {
      const Organization = (await import('@/models/Organization')).default;
      const defaultOrg = await Organization.findOne();
      if (!defaultOrg) {
        return Response.json({
          success: false,
          error: 'No organization found. Please create an organization first.'
        }, { status: 400 });
      }
      organizationId = defaultOrg._id;
      
      // Update the job with the default organization
      await Job.findByIdAndUpdate(jobId, { organizationId: organizationId });
      console.log(`⚠️  Job ${job.title} was missing organizationId, assigned to default organization: ${defaultOrg.name}`);
    }

    // Get all candidates for this job
    const candidates = await Candidate.find({ 
      jobId: jobId,
      processingStatus: 'completed'
    });

    if (candidates.length === 0) {
      return Response.json({
        success: false,
        error: 'No candidates found for this job'
      }, { status: 400 });
    }

    console.log(`🚀 Generating matches for ${candidates.length} candidates...`);

    const matches = [];
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        console.log(`🤖 Processing candidate ${i + 1}/${candidates.length}: ${candidate.name}`);

        // Check if match already exists
        if (!regenerate) {
          const existingMatch = await Match.findOne({
            jobId: jobId,
            candidateId: candidate._id
          });

          if (existingMatch) {
            console.log(`⏭️  Skipping ${candidate.name} - match already exists`);
            matches.push(existingMatch);
            continue;
          }
        }

        // Generate AI match analysis
        const matchResult = await calculateJobMatch(job, candidate);

        // Delete existing match if regenerating
        if (regenerate) {
          await Match.deleteOne({
            jobId: jobId,
            candidateId: candidate._id
          });
        }

        // Create new match
        const match = new Match({
          organizationId: organizationId,
          jobId: job._id,
          candidateId: candidate._id,
          score: matchResult.score,
          explanation: matchResult.explanation,
          strengths: matchResult.strengths || [],
          concerns: matchResult.concerns || [],
        });

        await match.save();
        matches.push(match);

        console.log(`✅ ${candidate.name}: ${matchResult.score}% match`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Error processing ${candidate.name}:`, error.message);
        errors.push({
          candidateId: candidate._id,
          candidateName: candidate.name,
          error: error.message
        });
      }
    }

    // Sort matches by score
    matches.sort((a, b) => b.score - a.score);

    return Response.json({
      success: true,
      data: {
        jobId: jobId,
        jobTitle: job.title,
        totalCandidates: candidates.length,
        successfulMatches: matches.length,
        errors: errors.length,
        matches: matches,
        errorDetails: errors.length > 0 ? errors : undefined
      },
      message: `Generated ${matches.length} matches successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error: any) {
    console.error('Generate matches error:', error);
    return Response.json({
      success: false,
      error: 'Failed to generate matches'
    }, { status: 500 });
  }
}
