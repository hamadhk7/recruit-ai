import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a specific job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Job retrieved successfully
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
 *         description: Invalid job ID
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
 *   put:
 *     summary: Update a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Job title
 *                 example: "Senior Software Engineer"
 *               description:
 *                 type: string
 *                 description: Detailed job description
 *               requirements:
 *                 type: object
 *                 properties:
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   experience:
 *                     type: string
 *                   location:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, closed]
 *     responses:
 *       200:
 *         description: Job updated successfully
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
 *         description: Invalid job ID
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
 *   delete:
 *     summary: Delete a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *       400:
 *         description: Invalid job ID
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid job ID'
      }, { status: 400 });
    }

    const job = await Job.findById(id).populate('organizationId', 'name slug');
    
    if (!job) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: job
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch job'
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid job ID'
      }, { status: 400 });
    }

    const data = await request.json();
    
    const job = await Job.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).populate('organizationId', 'name slug');

    if (!job) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to update job'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid job ID'
      }, { status: 400 });
    }

    const job = await Job.findByIdAndDelete(id);

    if (!job) {
      return Response.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to delete job'
    }, { status: 500 });
  }
}
