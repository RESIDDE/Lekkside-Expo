import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { UniversityBoothModal } from './UniversityBoothModal';
import { PresenceIndicator } from './PresenceIndicator';
import { 
  Search, 
  MapPin, 
  Award,
  Building2,
  X,
  Scale,
  ArrowRight
} from 'lucide-react';

interface University {
  id: string;
  user_id: string;
  university_name: string;
  full_name: string;
  location: string;
  logo_url: string;
  country: string;
  hasScholarship: boolean;
  programs: string[];
  degreeLevels: string[];
  tuitionCategory: string;
  isLive: boolean;
  meetingRoomId: string | null;
  institution_type: string;
}

const PROGRAM_OPTIONS = ['Engineering', 'Business', 'Arts & Humanities', 'Computer Science', 'Medicine', 'Law', 'Sciences'];
const COUNTRY_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Nigeria', 'Germany'];
const INSTITUTION_TYPES = ['University', 'High School', 'College', 'Language School', 'Pathway Provider', 'Education Organisation'];

export function UniversitiesDirectory({ eventId }: { eventId?: string | null }) {
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [requireScholarship, setRequireScholarship] = useState(false);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<University[]>([]);
  const [activeFilterCategory, setActiveFilterCategory] = useState<'all' | 'programs' | 'countries' | 'types'>('all');

  const toggleCompare = (uni: University) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === uni.id)) {
        return prev.filter(p => p.id !== uni.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 universities at a time.");
        return prev;
      }
      return [...prev, uni];
    });
  };

  useEffect(() => {
    async function fetchUniversities() {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'university')
        .eq('is_active', true);

      if (eventId) {
        // Find exhibition booths for this event
        const { data: boothData } = await supabase
          .from('exhibition_booths')
          .select('id')
          .eq('event_id', eventId);
        
        if (boothData && boothData.length > 0) {
          const boothIds = boothData.map(b => b.id);
          const { data: exhibitorData } = await supabase
            .from('exhibitors')
            .select('user_id')
            .in('booth_id', boothIds);
            
          if (exhibitorData && exhibitorData.length > 0) {
            const userIds = exhibitorData.map(e => e.user_id);
            query = query.in('user_id', userIds);
          } else {
            // No exhibitors found
            setUniversities([]);
            setLoading(false);
            return;
          }
        } else {
          // No booths found
          setUniversities([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (!error && data) {
        const augmentedData: University[] = data.map((profile, idx) => {
          let country = 'Unknown';
          if (profile.location) {
            const parts = profile.location.split(',');
            country = parts[parts.length - 1].trim();
          }
          if (country === 'Unknown' || country === '') {
             country = COUNTRY_OPTIONS[idx % COUNTRY_OPTIONS.length];
          }

          return {
            id: profile.id,
            user_id: profile.user_id,
            university_name: profile.university_name || 'Unnamed University',
            full_name: profile.full_name || '',
            location: profile.location || '',
            logo_url: profile.logo_url || '',
            country,
            hasScholarship: profile.has_scholarship || false,
            programs: Array.isArray(profile.programs) ? profile.programs : [],
            degreeLevels: Array.isArray(profile.degree_levels) ? profile.degree_levels : [],
            tuitionCategory: profile.tuition_category || 'Contact for details',
            isLive: profile.is_live || false,
            meetingRoomId: profile.meeting_room_id || null,
            institution_type: profile.institution_type || 'University'
          };
        });
        setUniversities(augmentedData);
      }
      setLoading(false);
    }
    fetchUniversities();

    // Subscribe to realtime profile changes for live meetings
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new;
          if (updatedProfile.role === 'university') {
            setUniversities(prev => prev.map(uni => 
              uni.user_id === updatedProfile.user_id 
                ? { 
                    ...uni, 
                    isLive: updatedProfile.is_live || false,
                    meetingRoomId: updatedProfile.meeting_room_id || null 
                  }
                : uni
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const filteredUniversities = useMemo(() => {
    return universities.filter(uni => {
      if (searchQuery && !uni.university_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCountries.length > 0 && !selectedCountries.includes(uni.country)) return false;
      if (selectedPrograms.length > 0 && !uni.programs.some(p => selectedPrograms.includes(p))) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(uni.institution_type)) return false;
      if (requireScholarship && !uni.hasScholarship) return false;
      return true;
    });
  }, [universities, searchQuery, selectedCountries, selectedPrograms, selectedTypes, requireScholarship]);

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    setState(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
  };

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedPrograms([]);
    setSelectedTypes([]);
    setRequireScholarship(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Hero Typography */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl text-center mt-12 mb-16 px-4"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
          Find your <br className="md:hidden" />
          <span className="text-gray-900">perfect match.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Explore world-class universities, discover programs tailored to your ambitions, and connect directly with admission teams.
        </p>

        {/* Global Search Bar (Mac Spotlight Style) */}
        <div className="mt-10 max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-2 shadow-xl shadow-black/[0.03]">
            <Search className="w-6 h-6 text-gray-400 ml-4" />
            <input 
              type="text" 
              placeholder="Search universities by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-lg py-3 px-4 text-gray-800 placeholder-gray-400 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Pill-based Filters (Apple Store Style) */}
      <div className="w-full max-w-7xl px-4 mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex gap-2 p-1 bg-gray-100/50 backdrop-blur-md rounded-full border border-gray-200/50">
            <button 
              onClick={() => setActiveFilterCategory('all')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilterCategory === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilterCategory('programs')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilterCategory === 'programs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Programs
            </button>
            <button 
              onClick={() => setActiveFilterCategory('countries')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilterCategory === 'countries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Countries
            </button>
            <button 
              onClick={() => setActiveFilterCategory('types')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilterCategory === 'types' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Institution Type
            </button>
          </div>
          
          <button 
            onClick={() => setRequireScholarship(!requireScholarship)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${requireScholarship ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-white'}`}
          >
            <Award className="w-4 h-4" />
            Scholarships Only
          </button>
        </div>

        {/* Scrollable filter pills based on category */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeFilterCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 overflow-x-auto pb-4 pt-2 hide-scrollbar mask-edges"
          >
            {activeFilterCategory === 'programs' && PROGRAM_OPTIONS.map(prog => (
              <button 
                key={prog}
                onClick={() => toggleFilter(setSelectedPrograms, prog)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-300 ${selectedPrograms.includes(prog) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/60 backdrop-blur-sm border-gray-200/80 text-gray-600 hover:bg-white hover:border-gray-300 shadow-sm'}`}
              >
                {prog}
              </button>
            ))}
            {activeFilterCategory === 'countries' && COUNTRY_OPTIONS.map(country => (
              <button 
                key={country}
                onClick={() => toggleFilter(setSelectedCountries, country)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-300 ${selectedCountries.includes(country) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/60 backdrop-blur-sm border-gray-200/80 text-gray-600 hover:bg-white hover:border-gray-300 shadow-sm'}`}
              >
                {country}
              </button>
            ))}
            {activeFilterCategory === 'types' && INSTITUTION_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => toggleFilter(setSelectedTypes, type)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-300 ${selectedTypes.includes(type) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/60 backdrop-blur-sm border-gray-200/80 text-gray-600 hover:bg-white hover:border-gray-300 shadow-sm'}`}
              >
                {type}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grid of Universities */}
      <div className="w-full max-w-7xl px-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white/40 backdrop-blur-xl rounded-[2rem] h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredUniversities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters to find what you're looking for.</p>
            <button onClick={clearFilters} className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-green-600 transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-24">
            {filteredUniversities.map((uni, idx) => {
              const isCompared = compareList.some(c => c.id === uni.id);
              return (
                <motion.div
                  key={uni.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group relative bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:bg-white/90 transition-all duration-500 flex flex-col"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-6 right-6">
                    <PresenceIndicator userId={uni.user_id} />
                  </div>

                  {/* Logo Container */}
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-3 mb-6 transform group-hover:-translate-y-1 transition-transform duration-500">
                    {uni.logo_url ? (
                      <img src={uni.logo_url} alt={uni.university_name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-10 h-10 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {uni.university_name}
                      </h3>
                      {uni.isLive && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100/50 shadow-sm shadow-red-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Live
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-5">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="mr-2">{uni.institution_type}</span>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {uni.country}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {uni.programs.slice(0, 2).map(prog => (
                        <span key={prog} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          {prog}
                        </span>
                      ))}
                      {uni.programs.length > 2 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          +{uni.programs.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-6 border-t border-gray-100 mt-auto">
                    {uni.isLive && uni.meetingRoomId && (
                      <button 
                        onClick={() => {
                          const meetingsUrl = import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080';
                          window.open(`${meetingsUrl}/meetings/${uni.meetingRoomId}`, "_blank");
                        }}
                        className="w-full py-3.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-red-100"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Join Live Meeting
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedBoothId(uni.user_id)}
                        className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        Visit Booth
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleCompare(uni)}
                        className={`p-3.5 rounded-2xl border transition-all ${isCompared ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
                        title={isCompared ? "Remove from compare" : "Compare"}
                      >
                        <Scale className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Compare Action Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-gray-800 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-sm">Comparing {compareList.length}/3</span>
            </div>
            
            <div className="flex items-center gap-2">
              {compareList.map(uni => (
                <div key={uni.id} className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-gray-800 relative group">
                  {uni.logo_url ? <img src={uni.logo_url} className="w-full h-full object-contain p-1" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                  <button onClick={() => toggleCompare(uni)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>

            <div className="h-8 w-px bg-gray-700 mx-2" />

            <button 
              disabled={compareList.length < 2}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${compareList.length >= 2 ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              Compare Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedBoothId && (
          <UniversityBoothModal
            universityId={selectedBoothId}
            onClose={() => setSelectedBoothId(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
