import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: {
    skills: [String],
    experience: String,
    location: String
  },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
