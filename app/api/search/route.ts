import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import Job from '@/models/Job';

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search across candidates, jobs, and skills
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *         example: "javascript developer"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [candidates, jobs, skills, all]
 *         description: Type of results to return
 *         example: "all"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of results per category
 *         example: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           skills:
 *                             type: array
 *                             items:
 *                               type: string
 *                           experience:
 *                             type: string
 *                           location:
 *                             type: string
 *                           matchScore:
 *                             type: number
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           location:
 *                             type: string
 *                           status:
 *                             type: string
 *                           requirements:
 *                             type: object
 *                           candidateCount:
 *                             type: number
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           candidateCount:
 *                             type: number
 *                           jobCount:
 *                             type: number
 *                     total:
 *                       type: number
 *                 query:
 *                   type: string
 *                 executionTime:
 *                   type: number
 *       400:
 *         description: Bad request - missing or invalid query
 *       500:
 *         description: Internal server error
 */

interface SearchResult {
  candidates: any[];
  jobs: any[];
  skills: any[];
  total: number;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate query
    if (!query || query.trim().length === 0) {
      return Response.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    if (limit < 1 || limit > 50) {
      return Response.json({
        success: false,
        error: 'Limit must be between 1 and 50'
      }, { status: 400 });
    }

    const searchTerm = query.trim();
    const results: SearchResult = {
      candidates: [],
      jobs: [],
      skills: [],
      total: 0
    };

    // Search candidates
    if (type === 'all' || type === 'candidates') {
      const candidateResults = await searchCandidates(searchTerm, limit);
      results.candidates = candidateResults;
      results.total += candidateResults.length;
    }

    // Search jobs
    if (type === 'all' || type === 'jobs') {
      const jobResults = await searchJobs(searchTerm, limit);
      results.jobs = jobResults;
      results.total += jobResults.length;
    }

    // Search skills
    if (type === 'all' || type === 'skills') {
      const skillResults = await searchSkills(searchTerm, limit);
      results.skills = skillResults;
      results.total += skillResults.length;
    }

    const executionTime = Date.now() - startTime;

    return Response.json({
      success: true,
      data: results,
      query: searchTerm,
      executionTime
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({
      success: false,
      error: 'Search failed'
    }, { status: 500 });
  }
}

async function searchCandidates(searchTerm: string, limit: number) {
  try {
    // Create search conditions for multiple fields
    const searchConditions = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { 'aiData.skills': { $regex: searchTerm, $options: 'i' } },
      { 'aiData.summary': { $regex: searchTerm, $options: 'i' } },
      { 'aiData.location': { $regex: searchTerm, $options: 'i' } }
    ];

    const candidates = await Candidate.find({
      $or: searchConditions
    })
    .populate('jobId', 'title')
    .select('name email aiData.skills aiData.summary aiData.location aiData.experience jobId')
    .limit(limit)
    .sort({ createdAt: -1 });

    return candidates.map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      skills: candidate.aiData?.skills || [],
      experience: candidate.aiData?.experience?.[0]?.title || 'Not specified',
      location: candidate.aiData?.location || 'Not specified',
      jobTitle: candidate.jobId?.title || 'Unknown Job',
      matchScore: calculateMatchScore(candidate, searchTerm)
    }));

  } catch (error) {
    console.error('Candidate search error:', error);
    return [];
  }
}

async function searchJobs(searchTerm: string, limit: number) {
  try {
    const searchConditions = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { 'requirements.skills': { $regex: searchTerm, $options: 'i' } },
      { 'requirements.location': { $regex: searchTerm, $options: 'i' } },
      { 'requirements.experience': { $regex: searchTerm, $options: 'i' } }
    ];

    const jobs = await Job.find({
      $or: searchConditions
    })
    .populate('organizationId', 'name')
    .limit(limit)
    .sort({ createdAt: -1 });

    // Get candidate counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const candidateCount = await Candidate.countDocuments({ jobId: job._id });
        return {
          _id: job._id,
          title: job.title,
          description: job.description.substring(0, 150) + (job.description.length > 150 ? '...' : ''),
          location: job.requirements?.location || 'Not specified',
          status: job.status,
          requirements: {
            skills: job.requirements?.skills || [],
            experience: job.requirements?.experience || 'Not specified'
          },
          organizationName: job.organizationId?.name || 'Unknown Organization',
          candidateCount
        };
      })
    );

    return jobsWithCounts;

  } catch (error) {
    console.error('Job search error:', error);
    return [];
  }
}

async function searchSkills(searchTerm: string, limit: number) {
  try {
    // Aggregate skills from candidates and jobs
    const candidateSkills = await Candidate.aggregate([
      { $unwind: '$aiData.skills' },
      { 
        $match: { 
          'aiData.skills': { $regex: searchTerm, $options: 'i' } 
        } 
      },
      {
        $group: {
          _id: { $toLower: '$aiData.skills' },
          originalName: { $first: '$aiData.skills' },
          candidateCount: { $sum: 1 }
        }
      },
      { $sort: { candidateCount: -1 } },
      { $limit: limit }
    ]);

    const jobSkills = await Job.aggregate([
      { $unwind: '$requirements.skills' },
      { 
        $match: { 
          'requirements.skills': { $regex: searchTerm, $options: 'i' } 
        } 
      },
      {
        $group: {
          _id: { $toLower: '$requirements.skills' },
          originalName: { $first: '$requirements.skills' },
          jobCount: { $sum: 1 }
        }
      },
      { $sort: { jobCount: -1 } },
      { $limit: limit }
    ]);

    // Merge and deduplicate skills
    const skillMap = new Map();

    candidateSkills.forEach(skill => {
      const key = skill._id;
      if (!skillMap.has(key)) {
        skillMap.set(key, {
          name: skill.originalName,
          candidateCount: skill.candidateCount,
          jobCount: 0
        });
      } else {
        skillMap.get(key).candidateCount += skill.candidateCount;
      }
    });

    jobSkills.forEach(skill => {
      const key = skill._id;
      if (!skillMap.has(key)) {
        skillMap.set(key, {
          name: skill.originalName,
          candidateCount: 0,
          jobCount: skill.jobCount
        });
      } else {
        skillMap.get(key).jobCount += skill.jobCount;
      }
    });

    return Array.from(skillMap.values())
      .sort((a, b) => (b.candidateCount + b.jobCount) - (a.candidateCount + a.jobCount))
      .slice(0, limit);

  } catch (error) {
    console.error('Skill search error:', error);
    return [];
  }
}

function calculateMatchScore(candidate: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // Name match (highest weight)
  if (candidate.name?.toLowerCase().includes(term)) {
    score += 40;
  }

  // Skills match
  const skills = candidate.aiData?.skills || [];
  const skillMatches = skills.filter((skill: string) => 
    skill.toLowerCase().includes(term)
  ).length;
  score += Math.min(skillMatches * 15, 30);

  // Summary match
  if (candidate.aiData?.summary?.toLowerCase().includes(term)) {
    score += 20;
  }

  // Email match
  if (candidate.email?.toLowerCase().includes(term)) {
    score += 10;
  }

  return Math.min(score, 100);
}