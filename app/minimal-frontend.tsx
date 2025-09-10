"use client";
import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Target, Briefcase, Building2 } from 'lucide-react';

const MinimalFrontend = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setMessage('');
      setSuccess(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMessage('');
      setSuccess(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    if (!jobId || !organizationId) {
      setMessage('Please provide jobId and organizationId.');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('organizationId', organizationId);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const fileName = result.data?.fileName || 'unknown';
        setMessage(`File uploaded successfully: ${fileName}`);
        setSuccess(true);
        // Reset form
        setFile(null);
        setJobId('');
        setOrganizationId('');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to upload file.');
        setSuccess(false);
      }
    } catch (error) {
      setMessage('An error occurred while uploading the file.');
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8 group">
            <div className="relative">
              <Target className="h-16 w-16 text-green-400 mr-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            </div>
            <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              Recruitment AI
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Upload CVs and let AI automatically extract candidate information and match them to job requirements with 
            <span className="text-green-400 font-semibold"> lightning-fast processing</span>.
          </p>
        </div>

        {/* Main Upload Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 relative overflow-hidden">
          {/* Form Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <Upload className="h-20 w-20 text-green-400 mx-auto transition-all duration-500 hover:scale-110 hover:rotate-12" />
                <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Upload CV
              </h2>
              <p className="text-gray-300 text-lg mb-2">Ready to upload a CV?</p>
              <p className="text-gray-400">Click the button below to open the upload form and process a new candidate's CV.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-lg">
                  Upload CV File *
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-500 relative overflow-hidden group ${
                    dragActive
                      ? 'border-green-400 bg-green-400/20 scale-105'
                      : file
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* Upload Area Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {file ? (
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <File className="h-16 w-16 text-green-400 transition-all duration-300 hover:scale-110" />
                          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-white mb-2">{file.name}</p>
                        <p className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full inline-block">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-400 hover:text-red-300 text-sm transition-all duration-300 hover:scale-105 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-center">
                        <div className="relative group/icon">
                          <Upload className="h-16 w-16 text-gray-400 transition-all duration-500 group-hover/icon:text-green-400 group-hover/icon:scale-110" />
                          <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-xl group-hover/icon:bg-green-400/20 transition-all duration-500"></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-white mb-2">
                          Drag and drop your CV here
                        </p>
                        <p className="text-gray-400 mb-3">or</p>
                        <label className="text-green-400 hover:text-green-300 font-semibold cursor-pointer transition-all duration-300 hover:scale-105 bg-green-500/10 hover:bg-green-500/20 px-6 py-3 rounded-lg border border-green-500/30 inline-block">
                          Browse files
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-500 bg-gray-800/30 px-4 py-2 rounded-lg">
                        Supports PDF, DOC, DOCX, TXT (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Job ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 text-lg">
                  Job ID *
                </label>
                <div className="relative group">
                  <Briefcase className="h-6 w-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-400 transition-colors duration-300" />
                  <input
                    type="text"
                    required
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                    placeholder="e.g., 507f1f77bcf86cd799439012"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              {/* Organization ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 text-lg">
                  Organization ID *
                </label>
                <div className="relative group">
                  <Building2 className="h-6 w-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-400 transition-colors duration-300" />
                  <input
                    type="text"
                    required
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/15 text-lg"
                    placeholder="e.g., 507f1f77bcf86cd799439011"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              {/* Status Messages */}
              {message && (
                <div className={`p-6 rounded-2xl flex items-center border-2 backdrop-blur-sm ${
                  success 
                    ? 'bg-green-500/20 border-green-500/40 text-green-300' 
                    : 'bg-red-500/20 border-red-500/40 text-red-300'
                }`}>
                  <div className="relative mr-4">
                    {success ? (
                      <CheckCircle className="h-8 w-8" />
                    ) : (
                      <AlertCircle className="h-8 w-8" />
                    )}
                    <div className={`absolute inset-0 rounded-full blur-xl ${
                      success ? 'bg-green-400/30' : 'bg-red-400/30'
                    }`}></div>
                  </div>
                  <span className="text-lg font-medium">{message}</span>
                </div>
              )}

              {/* Upload Button */}
              <button
                type="submit"
                disabled={!file || !jobId || !organizationId || uploading}
                className="w-full bg-gradient-to-r from-green-500 via-green-600 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-green-600 hover:via-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      <span className="text-xl">Processing CV...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Upload className="h-6 w-6 mr-3" />
                      <span className="text-xl">Upload & Process CV</span>
                    </div>
                  )}
                </div>
              </button>
            </form>

            {/* Info Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="font-bold text-blue-300 mb-6 text-xl flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                What happens next?
              </h3>
              <ul className="text-blue-200 space-y-4">
                <li className="flex items-center group">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-lg">Your CV will be processed and text extracted automatically</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-purple-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-lg">AI will analyze and structure your information</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-lg">You'll be automatically matched against job requirements</span>
                </li>
                <li className="flex items-center group">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mr-4 group-hover:scale-125 transition-transform duration-300"></div>
                  <span className="text-lg">Recruiters will see your profile with match scores</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-500"></div>
              <span className="text-sm font-medium">Secure</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse delay-1000"></div>
              <span className="text-sm font-medium">Fast Processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalFrontend;
