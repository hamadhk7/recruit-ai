'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface CVUploadProps {
  onClose: () => void;
  onSuccess: () => void;
  jobs: Array<{ _id: string; title: string }>;
}

export default function CVUpload({ onClose, onSuccess, jobs }: CVUploadProps) {
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !selectedJob) {
      setError('Please select a job and upload a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('jobId', selectedJob);
      formData.append('organizationId', '507f1f77bcf86cd799439011'); // Default org ID

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setUploadProgress(100);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('An error occurred during upload');
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
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="space-y-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-lg">
              <div className="p-md bg-accent/10 rounded-xl">
                <Upload className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Upload CV</h2>
                <p className="text-muted mt-xs">Add a new candidate to the system</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-secondary p-md rounded-lg hover-lift transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="p-lg bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-md">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-lg bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-md">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">CV uploaded and processed successfully! AI analysis complete.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-xl">
            <div className="form-group">
              <label className="form-label">
                Select Job *
              </label>
              <select
                required
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-lg py-md border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-background text-foreground transition-all duration-300"
              >
                <option value="">Choose a job...</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>{job.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload CV File *
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-2xl text-center transition-all duration-300 group ${
                  dragActive
                    ? 'border-accent bg-accent/10 scale-[1.02]'
                    : selectedFile
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50 hover:bg-accent/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-lg">
                    <div className="flex items-center justify-center">
                      <div className="p-lg bg-blue-100 rounded-xl">
                        <File className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted mt-xs">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-lg">
                    <div className="flex items-center justify-center">
                      <div className="p-lg bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors duration-300">
                        <Upload className="h-12 w-12 text-accent" />
                      </div>
                    </div>
                    <div className="space-y-md">
                      <p className="text-lg font-semibold text-foreground">
                        Drag and drop your CV here
                      </p>
                      <p className="text-muted">or</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary px-xl py-md rounded-lg font-medium hover-lift transition"
                      >
                        Browse Files
                      </button>
                    </div>
                    <p className="text-sm text-muted">
                      Supports PDF, DOC, DOCX, TXT (max 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>

            {uploading && (
              <div className="space-y-sm">
                <div className="flex justify-between text-sm text-foreground">
                  <span className="font-medium">Uploading and processing...</span>
                  <span className="font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="bg-accent/5 border border-accent/20 p-lg rounded-xl">
              <h3 className="font-semibold text-foreground mb-md flex items-center gap-sm">
                <Upload className="h-5 w-5 text-accent" />
                What happens next?
              </h3>
              <ul className="text-sm text-muted space-y-sm">
                <li className="flex items-start gap-sm">
                  <span className="text-accent mt-xs">•</span>
                  <span>Your CV will be processed and text extracted</span>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="text-accent mt-xs">•</span>
                  <span>AI will analyze and structure your information</span>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="text-accent mt-xs">•</span>
                  <span>You'll be automatically matched against job requirements</span>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="text-accent mt-xs">•</span>
                  <span>Recruiters will see your profile with match scores</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-md pt-xl border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-xl py-md rounded-lg font-medium hover-lift transition"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || !selectedJob || uploading}
                className="btn-primary px-xl py-md rounded-lg font-medium hover-lift transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Upload & Process CV'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
