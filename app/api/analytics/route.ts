import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import Job from '@/models/Job';
import Candidate from '@/models/Candidate';
import Match from '@/models/Match';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get comprehensive analytics and dashboard data
 *     description: Returns overview statistics, score distributions, recent activity, and popular jobs
 *     tags: [Analytics]
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalOrganizations:
 *                               type: number
 *                               description: Total number of organizations
 *                             totalJobs:
 *                               type: number
 *                               description: Total number of jobs
 *                             totalCandidates:
 *                               type: number
 *                               description: Total number of candidates
 *                             totalMatches:
 *                               type: number
 *                               description: Total number of matches
 *                         scoreDistribution:
 *                           type: object
 *                           properties:
 *                             excellent:
 *                               type: number
 *                               description: Matches with score >= 90
 *                             good:
 *                               type: number
 *                               description: Matches with score 70-89
 *                             fair:
 *                               type: number
 *                               description: Matches with score 50-69
 *                             poor:
 *                               type: number
 *                               description: Matches with score < 50
 *                         recentActivity:
 *                           type: object
 *                           properties:
 *                             jobs:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Job'
 *                             candidates:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Candidate'
 *                         topMatches:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Match'
 *                           description: Top 10 matches by score
 *                         popularJobs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               candidateCount:
 *                                 type: number
 *                               job:
 *                                 $ref: '#/components/schemas/Job'
 *                           description: Jobs with most candidates
 *                         averageScore:
 *                           type: number
 *                           description: Average match score across all matches
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

    const filter = organizationId ? { organizationId } : {};

    // Get basic counts
    const [organizations, jobs, candidates, matches] = await Promise.all([
      Organization.countDocuments(),
      Job.countDocuments(filter),
      Candidate.countDocuments(filter),
      Match.countDocuments(filter)
    ]);

    // Get recent activity
    const recentJobs = await Job.find(filter)
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCandidates = await Candidate.find(filter)
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get top matches
    const topMatches = await Match.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ score: -1 })
      .limit(10);

    // Get score distribution
    const allMatches = await Match.find(filter);
    const scoreDistribution = {
      excellent: allMatches.filter(m => m.score >= 90).length,
      good: allMatches.filter(m => m.score >= 70 && m.score < 90).length,
      fair: allMatches.filter(m => m.score >= 50 && m.score < 70).length,
      poor: allMatches.filter(m => m.score < 50).length
    };

    // Get jobs with most candidates
    const jobStats = await Candidate.aggregate([
      ...(organizationId ? [{ $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } }] : []),
      {
        $group: {
          _id: '$jobId',
          candidateCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: '$job'
      },
      {
        $sort: { candidateCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return Response.json({
      success: true,
      data: {
        overview: {
          totalOrganizations: organizations,
          totalJobs: jobs,
          totalCandidates: candidates,
          totalMatches: matches
        },
        scoreDistribution,
        recentActivity: {
          jobs: recentJobs,
          candidates: recentCandidates
        },
        topMatches,
        popularJobs: jobStats,
        averageScore: allMatches.length > 0 
          ? Math.round(allMatches.reduce((sum, match) => sum + match.score, 0) / allMatches.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
