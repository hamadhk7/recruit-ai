import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: List of organizations retrieved successfully
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
 *                         $ref: '#/components/schemas/Organization'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Organization name
 *                 example: "TechCorp Inc."
 *               slug:
 *                 type: string
 *                 description: URL-friendly organization identifier (auto-generated if not provided)
 *                 example: "techcorp-inc"
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Bad request - missing required fields or duplicate slug
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

export async function GET() {
  try {
    await connectDB();
    const organizations = await Organization.find({}).sort({ createdAt: -1 });
    return Response.json({
      success: true,
      data: organizations,
      count: organizations.length
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'Failed to fetch organizations' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return Response.json({
        success: false,
        error: 'Organization name is required'
      }, { status: 400 });
    }

    // Create slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const organization = new Organization({
      name: data.name,
      slug: slug
    });

    await organization.save();
    
    return Response.json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return Response.json({
        success: false,
        error: 'Organization with this slug already exists'
      }, { status: 400 });
    }
    
    return Response.json({
      success: false,
      error: 'Failed to create organization'
    }, { status: 500 });
  }
}
