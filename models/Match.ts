import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  score: { type: Number, min: 0, max: 100 },
  explanation: String,
  strengths: [String],
  concerns: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Match || mongoose.model('Match', matchSchema);
