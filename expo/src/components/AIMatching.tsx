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
      // Fetch available universities to restrict AI recommendations
      const { data: unisData } = await supabase
        .from('profiles')
        .select('university_name, country, programs, has_scholarship, tuition_category')
        .eq('role', 'university');

      const { data, error: functionError } = await supabase.functions.invoke('ai-student-matching', {
        body: { profile, universities: unisData || [] }
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
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-12 text-center max-w-2xl mx-auto mt-12">
        <div className="h-24 w-24 mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] flex items-center justify-center text-blue-500 mb-8 shadow-inner border border-white">
          <BookOpen className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Complete Your Profile First</h2>
        <p className="text-lg text-gray-500 max-w-md mx-auto mb-8 leading-relaxed font-medium">
          We need to know more about your academic background and preferences before our AI can find your perfect university matches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <div className="bg-black rounded-[2.5rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 text-xs font-bold uppercase tracking-widest mb-6">
              <Handshake className="w-4 h-4 text-white" />
              AI Powered Matchmaking
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Discover Your <br/>Perfect Match.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
              Our advanced AI analyzes your academic profile, budget, and preferences to find global institutions perfectly suited to your goals.
            </p>
          </div>

          <button
            onClick={generateMatches}
            disabled={isGenerating}
            className="group relative px-8 py-5 bg-white text-black rounded-3xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-500 hover:scale-105 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 overflow-hidden shrink-0"
          >
            <span className="relative z-10 flex items-center gap-3">
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                  Analyzing Profile...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6 text-black" />
                  Find My Matches
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-xl text-red-600 p-6 rounded-[2rem] border border-red-100/50 shadow-sm font-medium">
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
                  className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 md:p-10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 flex justify-end items-start pointer-events-none">
                    <div className="flex flex-col items-end">
                      <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-600">
                        {match.matchScore}%
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50 shadow-sm">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div className="pr-16">
                      <h3 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                        {match.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-500 mt-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold">{match.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 mb-8">
                    <div className="bg-gray-50/80 backdrop-blur-md rounded-3xl p-5 border border-gray-100/50 shadow-inner">
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

                  <div className="mt-8 flex gap-4">
                    <button className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 px-4 rounded-2xl transition-all duration-300 text-sm text-center shadow-sm hover:shadow">
                      Save Match
                    </button>
                    <button className="flex-1 bg-gray-900 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-2 group/btn shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">
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
