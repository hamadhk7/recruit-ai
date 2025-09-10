import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
