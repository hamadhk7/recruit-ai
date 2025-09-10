'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Upload,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Eye,
  Plus,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import JobForm from '../components/JobForm';
import CVUpload from '../components/CVUpload';

// Types
interface Organization {
  _id: string;
  name: string;
  slug: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: {
    skills: string[];
    experience: string;
    location: string;
  };
  status: string;
  createdAt: string;
  organizationId: string;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  aiData: {
    summary: string;
    skills: string[];
    experience: any[];
    education: any[];
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  fileName: string;
  originalFileName: string;
  processingStatus: string;
  createdAt: string;
  jobId: string;
  organizationId: string;
}

interface Match {
  _id: string;
  score: number;
  explanation: string;
  strengths: string[];
  concerns: string[];
  candidateId: Candidate;
  jobId: Job;
  createdAt: string;
}

interface Analytics {
  overview: {
    totalOrganizations: number;
    totalJobs: number;
    totalCandidates: number;
    totalMatches: number;
  };
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topMatches: Match[];
  popularJobs: any[];
  averageScore: number;
}

export default function RecruitmentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState<number | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCVUpload, setShowCVUpload] = useState(false);

  // Fetch data functions
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchMatches = async (jobId?: string) => {
    try {
      const url = jobId ? `/api/matches/${jobId}` : '/api/matches';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setMatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateMatches = async (jobId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchMatches(jobId);
        await fetchAnalytics();
      }
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCV = async (candidateId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download CV. Please try again.');
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchJobs();
    fetchCandidates();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchMatches(selectedJob);
    }
  }, [selectedJob]);

  // Filter functions
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJob = !selectedJob || candidate.jobId === selectedJob;
    return matchesSearch && matchesJob;
  });

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.candidateId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesScore = !minScore || match.score >= minScore;
    return matchesSearch && matchesScore;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 80) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    if (score >= 60) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect Match';
    if (score >= 80) return 'Strong Fit';
    if (score >= 70) return 'Good Fit';
    if (score >= 60) return 'Potential Fit';
    if (score >= 50) return 'Weak Fit';
    return 'Not Recommended';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto">
          <div className="flex justify-between items-center py-lg">
            <div className="flex items-center group">
              <div className="relative mr-lg">
                <Target className="h-10 w-10 text-accent transition-all duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Recruitment AI
              </h1>
            </div>

            <div className="flex items-center space-x-lg">
              <div className="relative group hidden md:block">
                <Search className="h-5 w-5 absolute left-md top-1/2 transform -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search candidates, jobs, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-xl pr-lg py-md bg-background border border-border rounded-lg text-foreground placeholder-muted focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 w-80"
                />
              </div>

              <button
                onClick={() => setShowJobForm(true)}
                className="btn-primary px-lg py-md rounded-lg font-medium flex items-center gap-sm hover-lift transition"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">New Job</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-xl">
        {/* Navigation Tabs */}
        <nav className="mb-2xl">
          <div className="flex flex-wrap gap-sm bg-card rounded-xl p-sm border border-border">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
              { id: 'candidates', label: 'Candidates', icon: Users },
              { id: 'matches', label: 'Matches', icon: Target },
              { id: 'upload', label: 'Upload CV', icon: Upload },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-sm px-lg py-md text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === id
                  ? 'bg-accent text-accent-foreground shadow-lg'
                  : 'text-muted hover:text-foreground hover:bg-background'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-2xl">
            {/* Overview Cards */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-xl">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
                <div className="card hover-lift transition group">
                  <div className="flex items-center gap-lg">
                    <div className="p-md bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                      <Briefcase className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-xs">Total Jobs</p>
                      <p className="text-3xl font-bold text-foreground">{analytics.overview.totalJobs}</p>
                    </div>
                  </div>
                </div>

                <div className="card hover-lift transition group">
                  <div className="flex items-center gap-lg">
                    <div className="p-md bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors duration-300">
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-xs">Total Candidates</p>
                      <p className="text-3xl font-bold text-foreground">{analytics.overview.totalCandidates}</p>
                    </div>
                  </div>
                </div>

                <div className="card hover-lift transition group">
                  <div className="flex items-center gap-lg">
                    <div className="p-md bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-xs">Total Matches</p>
                      <p className="text-3xl font-bold text-foreground">{analytics.overview.totalMatches}</p>
                    </div>
                  </div>
                </div>

                <div className="card hover-lift transition group">
                  <div className="flex items-center gap-lg">
                    <div className="p-md bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors duration-300">
                      <TrendingUp className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted mb-xs">Average Score</p>
                      <p className="text-3xl font-bold text-foreground">{analytics.averageScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Score Distribution */}
            <section>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Score Distribution</h3>
                  <p className="card-description">Distribution of candidate match scores across all positions</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-xl">
                  <div className="text-center group">
                    <div className="text-4xl font-bold text-green-500 mb-sm group-hover:scale-110 transition-transform duration-300">
                      {analytics.scoreDistribution.excellent}
                    </div>
                    <div className="text-sm text-muted font-medium">Excellent (90%+)</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-4xl font-bold text-blue-500 mb-sm group-hover:scale-110 transition-transform duration-300">
                      {analytics.scoreDistribution.good}
                    </div>
                    <div className="text-sm text-muted font-medium">Good (70-89%)</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-4xl font-bold text-yellow-500 mb-sm group-hover:scale-110 transition-transform duration-300">
                      {analytics.scoreDistribution.fair}
                    </div>
                    <div className="text-sm text-muted font-medium">Fair (50-69%)</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-4xl font-bold text-red-500 mb-sm group-hover:scale-110 transition-transform duration-300">
                      {analytics.scoreDistribution.poor}
                    </div>
                    <div className="text-sm text-muted font-medium">Poor (&lt;50%)</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Top Matches */}
            <section>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Top Matches</h3>
                  <p className="card-description">Highest scoring candidate-job matches</p>
                </div>
                <div className="space-y-md">
                  {analytics.topMatches.slice(0, 5).map((match) => (
                    <div key={match._id} className="flex items-center justify-between p-lg bg-background rounded-lg border border-border hover:bg-card/50 transition-all duration-300 group">
                      <div className="flex items-center gap-lg">
                        <div className={`px-lg py-sm rounded-lg text-lg font-bold ${getScoreColor(match.score)} group-hover:scale-105 transition-transform duration-300`}>
                          {match.score}%
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-lg">{match.candidateId?.name || 'Unknown Candidate'}</p>
                          <p className="text-sm text-muted">{match.jobId?.title || 'Unknown Job'}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted font-medium bg-card px-md py-sm rounded-lg border border-border">
                        {getScoreLabel(match.score)}
                      </div>
                    </div>
                  ))}
                  {analytics.topMatches.length === 0 && (
                    <div className="text-center py-2xl">
                      <Target className="h-12 w-12 text-muted mx-auto mb-lg" />
                      <p className="text-muted">No matches found. Generate matches for jobs to see results here.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-lg">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Jobs</h2>
                <p className="text-muted mt-sm">Manage job postings and requirements</p>
              </div>
              <button
                onClick={() => setShowJobForm(true)}
                className="btn-primary px-lg py-md rounded-lg font-medium flex items-center gap-sm hover-lift transition"
              >
                <Plus className="h-4 w-4" />
                Create Job
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
              {jobs.map((job) => (
                <div key={job._id} className="card hover-lift transition group">
                  <div className="space-y-lg">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-sm group-hover:text-accent transition-colors duration-300">
                        {job.title}
                      </h3>
                      <p className="text-muted text-sm leading-relaxed line-clamp-3">
                        {job.description}
                      </p>
                    </div>

                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm text-sm text-muted">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{job.requirements.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-sm text-sm text-muted">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{job.requirements.experience || 'Experience not specified'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-xs">
                      {job.requirements.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-sm py-xs bg-accent/10 text-accent text-xs rounded-md font-medium">
                          {skill}
                        </span>
                      ))}
                      {job.requirements.skills.length > 3 && (
                        <span className="px-sm py-xs bg-muted/20 text-muted text-xs rounded-md font-medium">
                          +{job.requirements.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex gap-sm pt-lg border-t border-border">
                      <button
                        onClick={() => {
                          setSelectedJob(job._id);
                          setActiveTab('matches');
                        }}
                        className="flex-1 btn-secondary px-md py-sm rounded-lg text-sm font-medium hover-lift transition"
                      >
                        View Matches
                      </button>
                      <button
                        onClick={() => generateMatches(job._id)}
                        disabled={loading}
                        className="flex-1 btn-primary px-md py-sm rounded-lg text-sm font-medium hover-lift transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Generating...' : 'Generate Matches'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="col-span-full">
                  <div className="card text-center py-3xl">
                    <Briefcase className="h-16 w-16 text-muted mx-auto mb-lg" />
                    <h3 className="text-xl font-semibold text-foreground mb-sm">No jobs yet</h3>
                    <p className="text-muted mb-xl">Create your first job posting to get started with candidate matching.</p>
                    <button
                      onClick={() => setShowJobForm(true)}
                      className="btn-primary px-xl py-lg rounded-lg font-medium inline-flex items-center gap-sm"
                    >
                      <Plus className="h-5 w-5" />
                      Create Your First Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-lg">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Candidates</h2>
                <p className="text-muted mt-sm">Manage candidate profiles and applications</p>
              </div>
              <div className="flex items-center gap-md">
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="px-lg py-md border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-background text-foreground"
                >
                  <option value="">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/api/candidates/reprocess', {
                        method: 'POST',
                      });
                      const data = await response.json();
                      if (data.success) {
                        await fetchCandidates();
                        await fetchAnalytics();
                      }
                    } catch (error) {
                      console.error('Reprocessing error:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="btn-secondary px-lg py-md rounded-lg font-medium hover-lift transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reprocess candidates with generic names to extract proper names from CVs"
                >
                  {loading ? 'Processing...' : 'Fix Names'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
              {filteredCandidates.map((candidate) => (
                <div key={candidate._id} className="card hover-lift transition group">
                  <div className="space-y-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
                          {candidate.name}
                        </h3>
                        <p className="text-muted text-sm mt-xs">{candidate.email}</p>
                      </div>
                      <div className={`px-sm py-xs rounded-md text-xs font-medium border ${candidate.processingStatus === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : candidate.processingStatus === 'processing'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                        {candidate.processingStatus}
                      </div>
                    </div>

                    <p className="text-muted text-sm leading-relaxed line-clamp-3">
                      {candidate.aiData.summary || 'No summary available'}
                    </p>

                    <div className="flex flex-wrap gap-xs">
                      {candidate.aiData.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="px-sm py-xs bg-muted/20 text-foreground text-xs rounded-md font-medium">
                          {skill}
                        </span>
                      ))}
                      {candidate.aiData.skills.length > 4 && (
                        <span className="px-sm py-xs bg-muted/10 text-muted text-xs rounded-md font-medium">
                          +{candidate.aiData.skills.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="flex gap-sm pt-lg border-t border-border">
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="flex-1 btn-primary px-md py-sm rounded-lg text-sm font-medium hover-lift transition"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => downloadCV(candidate._id, candidate.originalFileName || candidate.fileName || 'CV.pdf')}
                        className="btn-secondary px-md py-sm rounded-lg text-sm font-medium hover-lift transition"
                        title="Download CV"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCandidates.length === 0 && (
                <div className="col-span-full">
                  <div className="card text-center py-3xl">
                    <Users className="h-16 w-16 text-muted mx-auto mb-lg" />
                    <h3 className="text-xl font-semibold text-foreground mb-sm">No candidates found</h3>
                    <p className="text-muted mb-xl">
                      {selectedJob ? 'No candidates for the selected job.' : 'Upload CVs to start building your candidate database.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="btn-primary px-xl py-lg rounded-lg font-medium inline-flex items-center gap-sm"
                    >
                      <Upload className="h-5 w-5" />
                      Upload CV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-lg">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Matches</h2>
                <p className="text-muted mt-sm">AI-powered candidate-job matching results</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-md">
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="px-lg py-md border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-background text-foreground"
                >
                  <option value="">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
                <select
                  value={minScore || ''}
                  onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : null)}
                  className="px-lg py-md border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-background text-foreground"
                >
                  <option value="">All Scores</option>
                  <option value="90">90%+ (Excellent)</option>
                  <option value="80">80%+ (Strong Fit)</option>
                  <option value="70">70%+ (Good Fit)</option>
                  <option value="60">60%+ (Potential Fit)</option>
                </select>
              </div>
            </div>

            <div className="space-y-lg">
              {filteredMatches.map((match) => (
                <div key={match._id} className="card hover-lift transition group">
                  <div className="space-y-lg">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-lg">
                      <div className="flex items-center gap-lg">
                        <div className={`px-lg py-md rounded-xl text-lg font-bold border ${getScoreColor(match.score)} group-hover:scale-105 transition-transform duration-300`}>
                          {match.score}%
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
                            {match.candidateId?.name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-muted mt-xs">{match.jobId?.title || 'Unknown Job'}</p>
                          <p className="text-sm text-muted font-medium mt-xs">{getScoreLabel(match.score)}</p>
                        </div>
                      </div>
                      <div className="flex gap-sm">
                        <button className="btn-primary p-md rounded-lg hover-lift transition" title="Send Email">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="btn-secondary p-md rounded-lg hover-lift transition" title="Call">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => downloadCV(match.candidateId._id, match.candidateId.originalFileName || match.candidateId.fileName || 'CV.pdf')}
                          className="btn-secondary p-md rounded-lg hover-lift transition" 
                          title="Download CV"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-muted leading-relaxed">{match.explanation}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl pt-lg border-t border-border">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-md flex items-center gap-sm">
                          <CheckCircle className="h-4 w-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-sm">
                          {match.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-muted flex items-start gap-sm">
                              <span className="text-green-500 mt-xs">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-md flex items-center gap-sm">
                          <AlertCircle className="h-4 w-4" />
                          Concerns
                        </h4>
                        <ul className="space-y-sm">
                          {match.concerns.map((concern, index) => (
                            <li key={index} className="text-sm text-muted flex items-start gap-sm">
                              <span className="text-red-500 mt-xs">•</span>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMatches.length === 0 && (
                <div className="card text-center py-3xl">
                  <Target className="h-16 w-16 text-muted mx-auto mb-lg" />
                  <h3 className="text-xl font-semibold text-foreground mb-sm">No matches found</h3>
                  <p className="text-muted mb-xl">
                    {selectedJob
                      ? 'No matches for the selected job and filters. Try adjusting your criteria or generate matches first.'
                      : 'Generate matches for jobs to see AI-powered candidate recommendations here.'}
                  </p>
                  {selectedJob && (
                    <button
                      onClick={() => generateMatches(selectedJob)}
                      disabled={loading}
                      className="btn-primary px-xl py-lg rounded-lg font-medium inline-flex items-center gap-sm disabled:opacity-50"
                    >
                      <Target className="h-5 w-5" />
                      {loading ? 'Generating Matches...' : 'Generate Matches'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-3xl">
              <div className="space-y-xl">
                <div>
                  <Upload className="h-20 w-20 text-accent mx-auto mb-lg" />
                  <h2 className="text-2xl font-bold text-foreground mb-sm">Upload CV</h2>
                  <p className="text-muted leading-relaxed max-w-md mx-auto">
                    Upload candidate CVs to automatically extract information and enable AI-powered job matching.
                  </p>
                </div>

                <div className="space-y-lg">
                  <button
                    onClick={() => setShowCVUpload(true)}
                    className="btn-primary px-2xl py-xl rounded-xl font-semibold text-lg inline-flex items-center gap-lg hover-lift transition"
                  >
                    <Upload className="h-6 w-6" />
                    Choose CV File
                  </button>

                  <div className="text-sm text-muted">
                    <p className="mb-sm">Supported formats: PDF, DOC, DOCX, TXT</p>
                    <p>Maximum file size: 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showJobForm && (
        <JobForm
          onClose={() => setShowJobForm(false)}
          onSuccess={() => {
            fetchJobs();
            setShowJobForm(false);
          }}
        />
      )}

      {showCVUpload && (
        <CVUpload
          onClose={() => setShowCVUpload(false)}
          onSuccess={() => {
            fetchCandidates();
            fetchAnalytics();
            setShowCVUpload(false);
          }}
          jobs={jobs}
        />
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-lg z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-xl">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{selectedCandidate?.name || 'Unknown Candidate'}</h3>
                <p className="text-muted mt-sm">{selectedCandidate.email}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn-secondary p-md rounded-lg hover-lift transition"
              >
                ×
              </button>
            </div>

            <div className="space-y-xl">
              <div>
                <h4 className="font-semibold text-foreground mb-md">Summary</h4>
                <p className="text-muted leading-relaxed">{selectedCandidate.aiData.summary}</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-md">Skills</h4>
                <div className="flex flex-wrap gap-sm">
                  {selectedCandidate.aiData.skills.map((skill) => (
                    <span key={skill} className="px-md py-sm bg-accent/10 text-accent text-sm rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.aiData.experience.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-md">Experience</h4>
                  <div className="space-y-md">
                    {selectedCandidate.aiData.experience.map((exp: any, index: number) => (
                      <div key={index} className="p-lg bg-background rounded-lg border border-border">
                        <h5 className="font-medium text-foreground">{exp.role} at {exp.company}</h5>
                        <p className="text-sm text-muted mt-xs">{exp.duration}</p>
                        <p className="text-sm text-muted mt-sm">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.aiData.education.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-md">Education</h4>
                  <div className="space-y-md">
                    {selectedCandidate.aiData.education.map((edu: any, index: number) => (
                      <div key={index} className="p-lg bg-background rounded-lg border border-border">
                        <h5 className="font-medium text-foreground">{edu.degree} in {edu.field}</h5>
                        <p className="text-sm text-muted mt-xs">{edu.institution}</p>
                        {edu.year && <p className="text-sm text-muted mt-xs">{edu.year}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
