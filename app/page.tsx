'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Users, Briefcase, TrendingUp, ArrowRight, Upload } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/recruitment-dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-lg sm:px-xl lg:px-2xl py-2xl">
        {/* Header Section */}
        <header className="text-center section-spacing">
          <div className="flex items-center justify-center mb-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Recruitment AI
            </h1>
          </div>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Intelligent recruitment platform powered by AI. Automatically process CVs,
            extract candidate information, and match candidates to job requirements with
            <span className="text-green-400 font-semibold"> advanced scoring and analysis</span>.
          </p>
        </header>

        {/* Features Grid */}
        <section className="section-spacing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg xl:gap-xl">
            <div className="card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-500 group hover-lift">
              <div className="relative mb-lg">
                <div className="p-md bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                  <Upload className="h-10 w-10 text-blue-400" />
                </div>
                <div className="absolute inset-0 bg-blue-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-md group-hover:text-blue-300 transition-colors duration-300">
                Smart CV Processing
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Upload CVs in any format and let AI extract structured information automatically with
                <span className="text-blue-400 font-semibold"> lightning-fast processing</span>.
              </p>
            </div>

            <div className="card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-500 group hover-lift">
              <div className="relative mb-lg">
                <div className="p-md bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                  <Target className="h-10 w-10 text-green-400" />
                </div>
                <div className="absolute inset-0 bg-green-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-md group-hover:text-green-300 transition-colors duration-300">
                AI-Powered Matching
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Get objective match scores and detailed analysis for each candidate-job pairing with
                <span className="text-green-400 font-semibold"> advanced algorithms</span>.
              </p>
            </div>

            <div className="card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-500 group hover-lift">
              <div className="relative mb-lg">
                <div className="p-md bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                  <Users className="h-10 w-10 text-purple-400" />
                </div>
                <div className="absolute inset-0 bg-purple-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-md group-hover:text-purple-300 transition-colors duration-300">
                Candidate Management
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Organize and track candidates with comprehensive profiles and contact information in a
                <span className="text-purple-400 font-semibold"> unified dashboard</span>.
              </p>
            </div>

            <div className="card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-500 group hover-lift">
              <div className="relative mb-lg">
                <div className="p-md bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="h-10 w-10 text-yellow-400" />
                </div>
                <div className="absolute inset-0 bg-yellow-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-md group-hover:text-yellow-300 transition-colors duration-300">
                Analytics & Insights
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Track recruitment metrics, score distributions, and hiring trends with
                <span className="text-yellow-400 font-semibold"> real-time analytics</span>.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section-spacing">
          <div className="card bg-white/10 backdrop-blur-xl border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                <div className="text-center group">
                  <div className="relative mb-2xl">
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                      <span className="text-3xl font-bold text-blue-400">1</span>
                    </div>
                    <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-lg group-hover:text-blue-300 transition-colors duration-300">
                    Create Jobs
                  </h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                    Define job requirements, skills, and experience needed for each position with
                    <span className="text-blue-400 font-semibold"> intelligent templates</span>.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="relative mb-2xl">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                      <span className="text-3xl font-bold text-green-400">2</span>
                    </div>
                    <div className="absolute inset-0 bg-green-400/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-lg group-hover:text-green-300 transition-colors duration-300">
                    Upload CVs
                  </h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                    Candidates upload their CVs, and AI automatically extracts and structures the information with
                    <span className="text-green-400 font-semibold"> 99% accuracy</span>.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="relative mb-2xl">
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                      <span className="text-3xl font-bold text-purple-400">3</span>
                    </div>
                    <div className="absolute inset-0 bg-purple-400/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-lg group-hover:text-purple-300 transition-colors duration-300">
                    Get Matches
                  </h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                    AI analyzes and scores each candidate against job requirements with detailed insights and
                    <span className="text-purple-400 font-semibold"> actionable recommendations</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 text-white rounded-2xl p-xl lg:p-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative z-10 space-y-lg">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Recruitment?</h2>
              <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
                Start using AI-powered recruitment to find the best candidates faster and more accurately with
                <span className="text-yellow-300 font-semibold"> cutting-edge technology</span>.
              </p>
              <button
                onClick={() => router.push('/recruitment-dashboard')}
                className="btn-primary bg-white text-blue-600 px-2xl py-lg rounded-2xl font-bold text-lg md:text-xl hover:bg-gray-100 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl inline-flex items-center group"
              >
                Go to Dashboard
                <ArrowRight className="h-6 w-6 ml-sm group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="mt-xl flex items-center justify-center space-x-md text-gray-400">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-sm animate-pulse"></div>
              <span className="text-sm font-medium">Redirecting automatically in a few seconds...</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
