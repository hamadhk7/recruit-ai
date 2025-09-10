
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

// Server-side Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Recruitment AI Backend API',
    version: '1.0.0',
    description: 'AI-powered recruitment platform API for managing organizations, jobs, candidates, and matching',
    contact: {
      name: 'API Support',
      email: 'support@recruitment-ai.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://your-production-domain.com',
      description: 'Production server'
    }
  ],
  components: {
    schemas: {
      Organization: {
        type: 'object',
        required: ['name'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unique identifier for the organization',
            example: '507f1f77bcf86cd799439011'
          },
          name: {
            type: 'string',
            description: 'Organization name',
            example: 'TechCorp Inc.'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly organization identifier',
            example: 'techcorp-inc'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Organization creation timestamp'
          }
        }
      },
      Job: {
        type: 'object',
        required: ['organizationId', 'title', 'description'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unique identifier for the job',
            example: '507f1f77bcf86cd799439012'
          },
          organizationId: {
            type: 'string',
            description: 'Reference to the organization',
            example: '507f1f77bcf86cd799439011'
          },
          title: {
            type: 'string',
            description: 'Job title',
            example: 'Senior Software Engineer'
          },
          description: {
            type: 'string',
            description: 'Detailed job description',
            example: 'We are looking for a senior software engineer to join our team...'
          },
          requirements: {
            type: 'object',
            properties: {
              skills: {
                type: 'array',
                items: { type: 'string' },
                example: ['JavaScript', 'React', 'Node.js', 'MongoDB']
              },
              experience: {
                type: 'string',
                example: '5+ years'
              },
              location: {
                type: 'string',
                example: 'Remote'
              }
            }
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'closed'],
            default: 'active',
            example: 'active'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Job creation timestamp'
          }
        }
      },
      Candidate: {
        type: 'object',
        required: ['organizationId', 'jobId', 'name'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unique identifier for the candidate',
            example: '507f1f77bcf86cd799439013'
          },
          organizationId: {
            type: 'string',
            description: 'Reference to the organization',
            example: '507f1f77bcf86cd799439011'
          },
          jobId: {
            type: 'string',
            description: 'Reference to the job',
            example: '507f1f77bcf86cd799439012'
          },
          name: {
            type: 'string',
            description: 'Candidate full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Candidate email address',
            example: 'john.doe@email.com'
          },
          resumeText: {
            type: 'string',
            description: 'Extracted resume text content'
          },
          aiData: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'AI-generated candidate summary'
              },
              skills: {
                type: 'array',
                items: { type: 'string' },
                description: 'AI-extracted skills'
              },
              experience: {
                type: 'array',
                items: { type: 'object' },
                description: 'AI-extracted work experience'
              },
              education: {
                type: 'array',
                items: { type: 'object' },
                description: 'AI-extracted education history'
              }
            }
          },
          fileName: {
            type: 'string',
            description: 'Original uploaded file name',
            example: 'john_doe_resume.pdf'
          },
          processingStatus: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'completed',
            example: 'completed'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Candidate creation timestamp'
          }
        }
      },
      Match: {
        type: 'object',
        required: ['organizationId', 'jobId', 'candidateId', 'score'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unique identifier for the match',
            example: '507f1f77bcf86cd799439014'
          },
          organizationId: {
            type: 'string',
            description: 'Reference to the organization',
            example: '507f1f77bcf86cd799439011'
          },
          jobId: {
            type: 'string',
            description: 'Reference to the job',
            example: '507f1f77bcf86cd799439012'
          },
          candidateId: {
            type: 'string',
            description: 'Reference to the candidate',
            example: '507f1f77bcf86cd799439013'
          },
          score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'AI-calculated match score (0-100)',
            example: 85
          },
          explanation: {
            type: 'string',
            description: 'AI-generated explanation of the match',
            example: 'Strong technical skills match with relevant experience in React and Node.js'
          },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of candidate strengths for this job',
            example: ['5+ years React experience', 'Strong problem-solving skills']
          },
          concerns: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of potential concerns or gaps',
            example: ['Limited experience with microservices']
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Match creation timestamp'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          message: {
            type: 'string',
            description: 'Success or error message'
          },
          error: {
            type: 'string',
            description: 'Error message (only present when success is false)'
          },
          count: {
            type: 'number',
            description: 'Number of items returned (for list endpoints)'
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              pages: { type: 'number' }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message'
          }
        }
      }
    },
    parameters: {
      OrganizationId: {
        name: 'organizationId',
        in: 'query',
        description: 'Filter by organization ID',
        required: false,
        schema: {
          type: 'string'
        }
      },
      JobId: {
        name: 'jobId',
        in: 'query',
        description: 'Filter by job ID',
        required: false,
        schema: {
          type: 'string'
        }
      },
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      },
      MinScore: {
        name: 'minScore',
        in: 'query',
        description: 'Minimum match score filter',
        required: false,
        schema: {
          type: 'integer',
          minimum: 0,
          maximum: 100
        }
      },
      Status: {
        name: 'status',
        in: 'query',
        description: 'Filter by status',
        required: false,
        schema: {
          type: 'string',
          enum: ['active', 'inactive', 'closed']
        }
      }
    }
  },
  tags: [
    {
      name: 'Organizations',
      description: 'Organization management endpoints'
    },
    {
      name: 'Jobs',
      description: 'Job posting and management endpoints'
    },
    {
      name: 'Candidates',
      description: 'Candidate management and resume processing endpoints'
    },
    {
      name: 'Matches',
      description: 'AI-powered job-candidate matching endpoints'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints'
    },
    {
      name: 'Upload',
      description: 'File upload and processing endpoints'
    },
    {
      name: 'Test',
      description: 'API health check endpoints'
    }
  ]
};

// Only generate swagger spec on server-side
let swaggerSpec: any = null;

const options = {
  definition: swaggerDefinition,
  apis: [path.join(process.cwd(), 'app/api/**/*.ts')], // Absolute path to the API files
};

export function getSwaggerSpec() {
  if (typeof window === 'undefined' && !swaggerSpec) {
    // Only run on server-side
    swaggerSpec = swaggerJSDoc(options);
  }
  return swaggerSpec;
}

// For backward compatibility, but this should only be used server-side
export { swaggerSpec };