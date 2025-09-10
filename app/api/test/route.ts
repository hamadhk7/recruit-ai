import connectDB from '@/lib/mongodb';

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: API health check
 *     description: Test endpoint to verify API and database connectivity
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: API is working and database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "✅ API is working!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Current timestamp
 *                 database:
 *                   type: string
 *                   example: "Connected successfully"
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 details:
 *                   type: object
 *                   description: Error details
 */

export async function GET() {
  try {
    await connectDB();
    return Response.json({ 
      message: '✅ API is working!', 
      timestamp: new Date(),
      database: 'Connected successfully'
    });
  } catch (error) {
    return Response.json({ 
      error: 'Database connection failed',
      details: error
    }, { status: 500 });
  }
}
