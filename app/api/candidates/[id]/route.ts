import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate details by ID
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Candidate details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
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
 *     summary: Update candidate details
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Candidate full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Candidate email address
 *                 example: "john.doe@email.com"
 *               processingStatus:
 *                 type: string
 *                 enum: [pending, processing, completed, failed]
 *                 description: Processing status
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
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
 *     summary: Delete candidate
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Candidate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Candidate not found
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const candidate = await Candidate.findById(id)
      .populate('jobId', 'title description')
      .populate('organizationId', 'name');

    if (!candidate) {
      return Response.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch candidate'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await request.json();

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { 
        ...data,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('jobId', 'title')
      .populate('organizationId', 'name');

    if (!candidate) {
      return Response.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: candidate,
      message: 'Candidate updated successfully'
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    return Response.json({
      success: false,
      error: 'Failed to update candidate'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const candidate = await Candidate.findByIdAndDelete(id);

    if (!candidate) {
      return Response.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    return Response.json({
      success: false,
      error: 'Failed to delete candidate'
    }, { status: 500 });
  }
}
