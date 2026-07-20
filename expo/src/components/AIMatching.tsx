import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Handshake, MapPin, DollarSign, BookOpen, GraduationCap, ArrowRight, Loader2, Award, Building2, Rocket } from 'lucide-react';

interface UniversityMatch {
  name: string;
  country: string;
  program: string;
  estimatedTuition: string;
  matchReason: string;
  scholarshipOpportunities: string;
  matchScore: number;
}

export function AIMatching() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('student_screenings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const generateMatches = async () => {
    if (!profile) return;

    setIsGenerating(true);
    setError('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-student-matching', {
        body: { profile }
      });

      if (functionError) {
        throw new Error("Failed to fetch recommendations from AI.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      const content = data.choices[0].message.content.trim();

      // Attempt to parse JSON safely (removing any markdown formatting if present)
      const jsonStr = content.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const parsedMatches: UniversityMatch[] = JSON.parse(jsonStr);

      setMatches(parsedMatches.sort((a, b) => b.matchScore - a.matchScore));
    } catch (err: any) {
      console.error(err);
      setError("We encountered an issue finding your matches. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
        <div className="h-20 w-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <BookOpen className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile First</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          We need to know more about your academic background and preferences before our AI can find your perfect university matches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/10 rounded-full blur-3xl mix-blend-overlay"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold uppercase tracking-widest mb-4">
              <Handshake className="w-3.5 h-3.5" />
              AI Powered Matchmaking
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 leading-tight">
              Discover Your Perfect University Match
            </h2>
            <p className="text-primary-100 text-lg md:text-xl font-light">
              Our advanced AI analyzes your academic profile, budget, and preferences to find global institutions perfectly suited to your goals.
            </p>
          </div>

          <button
            onClick={generateMatches}
            disabled={isGenerating}
            className="group relative px-8 py-4 bg-white text-primary rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all hover:scale-105 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 overflow-hidden shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Profile...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Find My Matches
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Generating State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <Handshake className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Scanning Global Universities...</h3>
            <p className="text-gray-500">Matching your profile with thousands of programs worldwide.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {!isGenerating && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="w-12 h-[1px] bg-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
                Your Top Matches
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matches.map((match, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 hover:border-primary/30 transition-all hover:-translate-y-1 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 flex justify-end items-start pointer-events-none">
                    <div className="flex flex-col items-end">
                      <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-600">
                        {match.matchScore}%
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="pr-16">
                      <h3 className="text-xl font-bold font-display text-gray-900 leading-tight">
                        {match.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{match.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        "{match.matchReason}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Program</div>
                          <div className="text-sm font-semibold text-gray-900 leading-tight">{match.program}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 bg-green-50 text-green-600 p-1.5 rounded-lg">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Est. Tuition</div>
                          <div className="text-sm font-semibold text-gray-900 leading-tight">{match.estimatedTuition}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-gray-100 pt-5">
                    <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">Scholarships</h4>
                      <p className="text-sm text-gray-600">{match.scholarshipOpportunities}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm text-center">
                      Save Match
                    </button>
                    <button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 group/btn">
                      Apply Now
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
