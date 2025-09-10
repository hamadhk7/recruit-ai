# 🎯 Recruitment AI Backend

An AI-powered recruitment platform built with Next.js that helps organizations manage jobs, candidates, and automatically match candidates to job positions using AI.

## Features

- **Organization Management**: Create and manage organizations
- **Job Posting**: Create, update, and manage job postings
- **Candidate Management**: Upload and process candidate resumes with AI
- **AI-Powered Matching**: Automatically match candidates to jobs using AI analysis
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **File Upload**: Support for PDF, DOC, DOCX, and TXT resume files
- **Interactive API Documentation**: Complete Swagger/OpenAPI documentation

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- OpenAI API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application

## API Documentation

The API includes comprehensive Swagger documentation with interactive testing capabilities:

- **Interactive Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Swagger JSON Spec**: [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)

### API Endpoints

- `GET/POST /api/organizations` - Organization management
- `GET/POST /api/jobs` - Job posting management  
- `GET/PUT/DELETE /api/jobs/{id}` - Individual job operations
- `GET/POST /api/candidates` - Candidate management
- `GET /api/matches` - View all matches
- `GET /api/matches/{jobId}` - Get matches for specific job
- `POST /api/matches/generate` - Generate AI matches for a job
- `GET /api/analytics` - Analytics and dashboard data
- `POST /api/upload` - File upload and processing
- `GET /api/test` - Health check

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT for resume parsing and job matching
- **File Processing**: Support for PDF, DOC, DOCX, TXT files
- **Documentation**: Swagger/OpenAPI 3.0 with Swagger UI
- **Language**: TypeScript

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
