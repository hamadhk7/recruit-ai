import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import Job from '@/models/Job';
import Candidate from '@/models/Candidate';

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get all matches with optional filtering
 *     tags: [Matches]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - $ref: '#/components/parameters/MinScore'
 *     responses:
 *       200:
 *         description: List of matches retrieved successfully
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
 *                         $ref: '#/components/schemas/Match'
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
    const jobId = searchParams.get('jobId');
    const organizationId = searchParams.get('organizationId');
    const minScore = searchParams.get('minScore');

    const filter: any = {};
    if (jobId) filter.jobId = jobId;
    if (organizationId) filter.organizationId = organizationId;
    if (minScore) filter.score = { $gte: parseInt(minScore) };

    const matches = await Match.find(filter)
      .populate('candidateId', 'name email aiData fileName')
      .populate('jobId', 'title')
      .populate('organizationId', 'name')
      .sort({ score: -1, createdAt: -1 });

    return Response.json({
      success: true,
      data: matches,
      count: matches.length
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch matches'
    }, { status: 500 });
  }
}
