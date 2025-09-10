'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Briefcase, AlertCircle } from 'lucide-react';

interface JobFormProps {
  onClose: () => void;
  onSuccess: () => void;
  organizationId?: string;
}

export default function JobForm({ onClose, onSuccess, organizationId }: JobFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: {
      skills: [''],
      experience: '',
      location: ''
    },
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.requirements.skills];
    newSkills[index] = value;
    setFormData({
      ...formData,
      requirements: {
        ...formData.requirements,
        skills: newSkills
      }
    });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      requirements: {
        ...formData.requirements,
        skills: [...formData.requirements.skills, '']
      }
    });
  };

  const removeSkill = (index: number) => {
    const newSkills = formData.requirements.skills.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      requirements: {
        ...formData.requirements,
        skills: newSkills
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter out empty skills
      const filteredSkills = formData.requirements.skills.filter(skill => skill.trim() !== '');
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          requirements: {
            ...formData.requirements,
            skills: filteredSkills
          },
          organizationId: organizationId || '507f1f77bcf86cd799439011' // Default org ID
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to create job');
      }
    } catch (err) {
      setError('An error occurred while creating the job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl mr-4">
                <Briefcase className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Create New Job
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-300 p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-6 bg-red-500/20 border border-red-500/40 text-red-300 rounded-2xl backdrop-blur-sm flex items-center">
              <AlertCircle className="h-6 w-6 mr-3" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-medium text-gray-300 mb-3">
                Job Title *
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                  placeholder="e.g., Senior React Developer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-300 mb-3">
                Job Description *
              </label>
              <div className="relative group">
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg resize-none"
                  placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-300 mb-3">
                  Experience Required
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.requirements.experience}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, experience: e.target.value }
                    })}
                    className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                    placeholder="e.g., 5+ years"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-300 mb-3">
                  Location
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.requirements.location}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: { ...formData.requirements, location: e.target.value }
                    })}
                    className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                    placeholder="e.g., Remote, New York, NY"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-300 mb-3">
                Required Skills
              </label>
              <div className="space-y-4">
                {formData.requirements.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="relative group flex-1">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                        placeholder="e.g., React, TypeScript, Node.js"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    {formData.requirements.skills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="flex items-center text-green-400 hover:text-green-300 text-lg font-medium bg-green-500/10 hover:bg-green-500/20 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 border border-green-500/30"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Skill
                </button>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-300 mb-3">
                Status
              </label>
              <div className="relative group">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg appearance-none"
                >
                  <option value="active" className="bg-gray-800 text-white">Active</option>
                  <option value="paused" className="bg-gray-800 text-white">Paused</option>
                  <option value="closed" className="bg-gray-800 text-white">Closed</option>
                </select>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="flex justify-end space-x-6 pt-8 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 border border-gray-600 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-blue-600 text-white rounded-xl hover:from-green-600 hover:via-green-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl font-bold text-lg relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Job'
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
