import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  name: { type: String, required: true },
  email: String,
  resumeText: String,
  aiData: {
    summary: String,
    skills: [String],
    experience: [Object],
    education: [Object],
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    portfolio: String
  },
  fileName: String,
  originalFileName: String,
  fileSize: Number,
  fileType: String,
  filePath: String, // Path to the uploaded file
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending' 
  },
  processingError: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
