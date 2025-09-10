import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with optional filtering and pagination
 *     tags: [Jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - $ref: '#/components/parameters/Status'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
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
 *                         $ref: '#/components/schemas/Job'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 *                         pages:
 *                           type: number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - title
 *               - description
 *             properties:
 *               organizationId:
 *                 type: string
 *                 description: ID of the organization posting the job
 *                 example: "507f1f77bcf86cd799439011"
 *               title:
 *                 type: string
 *                 description: Job title
 *                 example: "Senior Software Engineer"
 *               description:
 *                 type: string
 *                 description: Detailed job description
 *                 example: "We are looking for a senior software engineer to join our team..."
 *               requirements:
 *                 type: object
 *                 properties:
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["JavaScript", "React", "Node.js", "MongoDB"]
 *                   experience:
 *                     type: string
 *                     example: "5+ years"
 *                   location:
 *                     type: string
 *                     example: "Remote"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, closed]
 *                 default: active
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Job'
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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    if (status) filter.status = status;

    // Get jobs with pagination
    const jobs = await Job.find(filter)
      .populate('organizationId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    return Response.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch jobs'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate required fields
    if (!data.organizationId || !data.title || !data.description) {
      return Response.json({
        success: false,
        error: 'organizationId, title, and description are required'
      }, { status: 400 });
    }

    const job = new Job({
      organizationId: data.organizationId,
      title: data.title,
      description: data.description,
      requirements: data.requirements || {},
      status: data.status || 'active'
    });

    await job.save();

    // Populate organization data for response
    await job.populate('organizationId', 'name slug');

    return Response.json({
      success: true,
      data: job,
      message: 'Job created successfully'
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to create job'
    }, { status: 500 });
  }
}
