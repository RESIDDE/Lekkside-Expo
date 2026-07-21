import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Building2, MapPin, Globe, Award, DollarSign, Clock, BookOpen, GraduationCap, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface Program {
  id: string;
  program_name: string;
  degree_level: string;
  duration: string;
  tuition_fee: string;
  scholarships_available: boolean;
  application_deadline: string | null;
  admission_requirements: string;
}

interface University {
  id: string;
  user_id: string;
  university_name: string;
  location: string;
  logo_url: string;
  banner_url: string;
  description: string;
  website_url: string;
}

interface UniversityBoothModalProps {
  universityId: string;
  onClose: () => void;
}

const DEGREE_OPTIONS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'];

export function UniversityBoothModal({ universityId, onClose }: UniversityBoothModalProps) {
  const [university, setUniversity] = useState<University | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state for programs inside the booth
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [requireScholarship, setRequireScholarship] = useState(false);

  useEffect(() => {
    async function fetchBoothData() {
      setLoading(true);
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', universityId)
        .single();
        
      if (profile) {
        setUniversity({
          id: profile.id,
          user_id: profile.user_id,
          university_name: profile.university_name || 'Unnamed University',
          location: profile.location || '',
          logo_url: profile.logo_url || '',
          banner_url: profile.banner_url || '',
          description: profile.description || '',
          website_url: profile.website_url || ''
        });
      }

      // Fetch programs
      const { data: programsData } = await supabase
        .from('university_programs')
        .select('*')
        .eq('university_id', universityId)
        .order('program_name', { ascending: true });
        
      if (programsData) {
        setPrograms(programsData as Program[]);
      }
      
      setLoading(false);
    }
    
    fetchBoothData();
  }, [universityId]);

  const toggleDegreeFilter = (degree: string) => {
    setSelectedDegrees(prev => 
      prev.includes(degree) ? prev.filter(d => d !== degree) : [...prev, degree]
    );
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(prog => {
      if (searchQuery && !prog.program_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedDegrees.length > 0 && !selectedDegrees.includes(prog.degree_level)) {
        return false;
      }
      if (requireScholarship && !prog.scholarships_available) {
        return false;
      }
      return true;
    });
  }, [programs, searchQuery, selectedDegrees, requireScholarship]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!university) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      {/* Booth Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-4xl h-full bg-gray-50 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Banner Header */}
        <div className="relative h-48 md:h-64 bg-primary flex-shrink-0">
          {university.banner_url && (
            <img 
              src={university.banner_url} 
              alt={`${university.university_name} Banner`} 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex items-end gap-6">
            <div className="h-20 w-20 md:h-28 md:w-28 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {university.logo_url ? (
                <img src={university.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                {university.university_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {university.location || 'Location Not Provided'}
                </span>
                {university.website_url && (
                  <a 
                    href={university.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 hover:text-white hover:underline"
                  >
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
          
          {/* About Section */}
          <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> About the University
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {university.description || 'This institution has not provided a description yet.'}
            </p>
          </section>

          {/* Programs Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Academic Programs
            </h2>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search programs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mr-2">
                  <Filter className="w-4 h-4" /> Degree:
                </div>
                {DEGREE_OPTIONS.map(degree => (
                  <button
                    key={degree}
                    onClick={() => toggleDegreeFilter(degree)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selectedDegrees.includes(degree) 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {degree}
                  </button>
                ))}
              </div>

              <div className="flex items-center md:border-l md:border-gray-200 md:pl-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={requireScholarship}
                    onChange={(e) => setRequireScholarship(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">With Scholarships</span>
                </label>
              </div>
            </div>

            {/* Programs List */}
            {programs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No programs have been added by this university yet.</p>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500">No programs match your search/filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrograms.map((program) => (
                  <div key={program.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight pr-4">
                        {program.program_name}
                      </h3>
                      {program.scholarships_available && (
                        <span className="shrink-0 bg-blue-50 text-blue-700 p-1.5 rounded-lg border border-blue-100" title="Scholarships Available">
                          <Award className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mt-4">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span>{program.degree_level}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{program.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>{program.tuition_fee || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                        <span>Deadline: {program.application_deadline ? new Date(program.application_deadline).toLocaleDateString() : 'Ongoing'}</span>
                      </div>
                    </div>

                    {program.admission_requirements && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Admission Requirements:</p>
                        <p className="text-sm text-gray-600 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                          {program.admission_requirements}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
