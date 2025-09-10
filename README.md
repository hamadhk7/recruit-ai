# 🎯 Recruitment AI Platform

A comprehensive AI-powered recruitment platform that automates CV screening and candidate matching for recruitment companies. Built to handle 500+ CVs per job posting with intelligent AI analysis and scoring.

## 🚀 Problem Solved

**Challenge**: Recruitment companies receive 500+ CVs per job posting, making manual screening time-consuming and inefficient for recruitment teams.

**Solution**: AI-powered platform that automatically processes CVs, matches candidates to job descriptions, and provides scored rankings with detailed AI-generated recommendations.

## ✨ Key Features

### 🤖 AI-Powered Core
- **Intelligent CV Processing**: Advanced PDF/DOC/TXT extraction with AI parsing
- **Smart Job Matching**: AI-driven candidate scoring (0-100) with detailed reasoning
- **Automated Screening**: Process hundreds of CVs automatically
- **Quality Assessment**: Content validation and extraction quality scoring

### 💼 Recruitment Management
- **Multi-Organization Support**: SaaS-ready multi-tenant architecture
- **Job Posting Management**: Complete job lifecycle management
- **Candidate Database**: Comprehensive candidate profiles with AI summaries
- **Bulk Operations**: Mass CV upload and processing capabilities

### 📊 Analytics & Insights
- **Interactive Dashboard**: Real-time recruitment analytics
- **Match Scoring**: Detailed compatibility analysis with strengths/concerns
- **Performance Metrics**: Processing statistics and success rates
- **Recruiter Tools**: Advanced search, filtering, and candidate management

### 🔧 Enterprise Features
- **Robust File Processing**: Multi-format support with error recovery
- **RESTful API**: Complete API with Swagger documentation
- **Scalable Architecture**: Designed for high-volume processing
- **Security & Validation**: Comprehensive input validation and error handling

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
