import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/matches/{jobId}:
 *   get:
 *     summary: Get matches for a specific job with statistics
 *     tags: [Matches]
 *     parameters:
 *       - name: jobId
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *       - name: limit
 *         in: query
 *         description: Maximum number of matches to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - $ref: '#/components/parameters/MinScore'
 *     responses:
 *       200:
 *         description: Job matches retrieved successfully with statistics
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalMatches:
 *                           type: number
 *                           description: Total number of matches for this job
 *                         averageScore:
 *                           type: number
 *                           description: Average match score
 *                         highestScore:
 *                           type: number
 *                           description: Highest match score
 *                         lowestScore:
 *                           type: number
 *                           description: Lowest match score
 *                         strongFits:
 *                           type: number
 *                           description: Number of matches with score >= 80
 *                         goodFits:
 *                           type: number
 *                           description: Number of matches with score 60-79
 *                         poorFits:
 *                           type: number
 *                           description: Number of matches with score < 60
 *       400:
 *         description: Invalid job ID
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

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await connectDB();
    
    const { jobId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return Response.json({
        success: false,
        error: 'Invalid job ID'
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = searchParams.get('minScore');

    const filter: any = { jobId };
    if (minScore) filter.score = { $gte: parseInt(minScore) };

    const matches = await Match.find(filter)
      .populate('candidateId', 'name email aiData fileName createdAt')
      .populate('jobId', 'title description requirements')
      .sort({ score: -1 })
      .limit(limit);

    // Calculate summary statistics
    const allMatches = await Match.find({ jobId });
    const scores = allMatches.map(m => m.score);
    const stats = {
      totalMatches: allMatches.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      strongFits: scores.filter(s => s >= 80).length,
      goodFits: scores.filter(s => s >= 60 && s < 80).length,
      poorFits: scores.filter(s => s < 60).length
    };

    return Response.json({
      success: true,
      data: matches,
      stats: stats,
      count: matches.length
    });
  } catch (error) {
    console.error('Get job matches error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch job matches'
    }, { status: 500 });
  }
}
