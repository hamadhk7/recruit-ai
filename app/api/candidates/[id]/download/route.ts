import connectDB from '@/lib/mongodb';
import Candidate from '@/models/Candidate';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * @swagger
 * /api/candidates/{id}/download:
 *   get:
 *     summary: Download candidate's CV file
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: CV file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/msword:
 *             schema:
 *               type: string
 *               format: binary
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Candidate or file not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return Response.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    if (!candidate.filePath) {
      return Response.json({
        success: false,
        error: 'No CV file found for this candidate'
      }, { status: 404 });
    }

    const fileName = candidate.originalFileName || candidate.fileName || 'CV.pdf';

    try {
      // Construct the full file path
      const fullPath = path.join(process.cwd(), candidate.filePath);
      
      // Read the file
      const fileBuffer = await readFile(fullPath);
      
      // Determine content type based on file extension
      const fileExtension = fileName.toLowerCase().split('.').pop();
      let contentType = 'application/octet-stream';
      
      switch (fileExtension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'doc':
          contentType = 'application/msword';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
      }

      // Return the file with appropriate headers
      return new Response(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });

    } catch (fileError) {
      console.error('File read error:', fileError);
      return Response.json({
        success: false,
        error: 'File not found or could not be read'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Download error:', error);
    return Response.json({
      success: false,
      error: 'Failed to download file'
    }, { status: 500 });
  }
}