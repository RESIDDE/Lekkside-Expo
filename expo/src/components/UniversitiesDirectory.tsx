import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { UniversityBoothModal } from './UniversityBoothModal';
import { PresenceIndicator } from './PresenceIndicator';
import { 
  Search, 
  MapPin, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  Award,
  Filter,
  CheckCircle2,
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
  // Mock augmented fields
  country: string;
  hasScholarship: boolean;
  programs: string[];
  degreeLevels: string[];
  tuitionCategory: string;
}

const PROGRAM_OPTIONS = ['Engineering', 'Business', 'Arts & Humanities', 'Computer Science', 'Medicine', 'Law', 'Sciences'];
const DEGREE_OPTIONS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'];
const TUITION_OPTIONS = ['< $10,000', '$10,000 - $20,000', '$20,000 - $30,000', '> $30,000'];
const COUNTRY_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Nigeria', 'Germany'];

export function UniversitiesDirectory() {
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedTuitions, setSelectedTuitions] = useState<string[]>([]);
  const [requireScholarship, setRequireScholarship] = useState(false);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [compareList, setCompareList] = useState<University[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'university');

      if (!error && data) {
        // Use real data from profiles
        const augmentedData: University[] = data.map((profile, idx) => {
          // Extract country from location or pick random
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
            tuitionCategory: profile.tuition_category || 'Contact for details'
          };
        });

        setUniversities(augmentedData);
      }
      setLoading(false);
    }
    fetchUniversities();
  }, []);

  const filteredUniversities = useMemo(() => {
    return universities.filter(uni => {
      // Search
      if (searchQuery && !uni.university_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Country Filter
      if (selectedCountries.length > 0 && !selectedCountries.includes(uni.country)) {
        return false;
      }
      // Program Filter
      if (selectedPrograms.length > 0 && !uni.programs.some(p => selectedPrograms.includes(p))) {
        return false;
      }
      // Degree Filter
      if (selectedDegrees.length > 0 && !uni.degreeLevels.some(d => selectedDegrees.includes(d))) {
        return false;
      }
      // Tuition Filter
      if (selectedTuitions.length > 0 && !selectedTuitions.includes(uni.tuitionCategory)) {
        return false;
      }
      // Scholarship Filter
      if (requireScholarship && !uni.hasScholarship) {
        return false;
      }

      return true;
    });
  }, [universities, searchQuery, selectedCountries, selectedPrograms, selectedDegrees, selectedTuitions, requireScholarship]);

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    setState(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Country
        </h3>
        <div className="space-y-2">
          {COUNTRY_OPTIONS.map(country => (
            <label key={country} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedCountries.includes(country)}
                onChange={() => toggleFilter(setSelectedCountries, country)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">{country}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Programs
        </h3>
        <div className="space-y-2">
          {PROGRAM_OPTIONS.map(program => (
            <label key={program} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedPrograms.includes(program)}
                onChange={() => toggleFilter(setSelectedPrograms, program)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">{program}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" /> Degree Level
        </h3>
        <div className="space-y-2">
          {DEGREE_OPTIONS.map(degree => (
            <label key={degree} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedDegrees.includes(degree)}
                onChange={() => toggleFilter(setSelectedDegrees, degree)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">{degree}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Tuition Fee
        </h3>
        <div className="space-y-2">
          {TUITION_OPTIONS.map(tuition => (
            <label key={tuition} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedTuitions.includes(tuition)}
                onChange={() => toggleFilter(setSelectedTuitions, tuition)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">{tuition}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer p-3 bg-blue-50/50 rounded-xl border border-blue-100 transition-colors hover:bg-blue-50">
          <input 
            type="checkbox" 
            checked={requireScholarship}
            onChange={(e) => setRequireScholarship(e.target.checked)}
            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
          <Award className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Scholarship Available</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Search */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Participating Institutions</h2>
          <p className="text-sm text-gray-500 mt-1">Browse and filter universities to find your perfect match</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search universities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit sticky top-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">Filters</h2>
            {(selectedCountries.length > 0 || selectedPrograms.length > 0 || selectedDegrees.length > 0 || selectedTuitions.length > 0 || requireScholarship) && (
              <button 
                onClick={() => {
                  setSelectedCountries([]);
                  setSelectedPrograms([]);
                  setSelectedDegrees([]);
                  setSelectedTuitions([]);
                  setRequireScholarship(false);
                }}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
          <FilterSection />
        </aside>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-xl overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSection />
              <div className="mt-8">
                <button 
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Show Results ({filteredUniversities.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : filteredUniversities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No universities found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredUniversities.map((uni) => (
                <div key={uni.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col group relative">
                  
                  {/* Card Header Background */}
                  <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-100 relative">
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 rounded-full px-2.5 py-1">
                      <PresenceIndicator userId={uni.user_id} showText={true} />
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex-1 flex flex-col">
                    {/* Logo (Overlapping Header) */}
                    <div className="-mt-10 mb-3 h-20 w-20 bg-white rounded-2xl border-4 border-white shadow-sm flex items-center justify-center overflow-hidden relative z-10">
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={`${uni.university_name} logo`} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                      {uni.university_name}
                    </h3>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {uni.country}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {uni.hasScholarship && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                          <Award className="w-3 h-3" /> Featured Scholarship
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                        <DollarSign className="w-3 h-3" /> {uni.tuitionCategory}
                      </span>
                    </div>

                    <div className="mt-auto space-y-3 pt-4 border-t border-gray-100 text-sm">
                      <div className="flex items-start gap-2 text-gray-600">
                        <BookOpen className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                        <span className="line-clamp-2">{uni.programs.join(', ')}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <GraduationCap className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                        <span>{uni.degreeLevels.join(', ')}</span>
                      </div>
                    </div>

                  </div>

                  {/* Action Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <button 
                      onClick={() => toggleCompare(uni)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                        compareList.find(p => p.id === uni.id)
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title="Compare"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedBoothId(uni.user_id)}
                      className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                    >
                      Visit Booth
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Button */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 md:right-10 z-40"
          >
            <button
              onClick={() => setShowCompareModal(true)}
              className="bg-primary text-white shadow-xl shadow-primary/30 px-6 py-3 rounded-full font-bold flex items-center gap-3 hover:bg-primary/90 transition-all hover:scale-105"
            >
              <Scale className="w-5 h-5" />
              Compare ({compareList.length})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCompareModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Compare Institutions</h2>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-x-auto p-6 bg-white custom-scrollbar">
                <div className="min-w-max flex gap-6">
                  {compareList.map(uni => (
                    <div key={uni.id} className="w-72 flex flex-col border border-gray-200 rounded-2xl overflow-hidden relative">
                      <button 
                        onClick={() => toggleCompare(uni)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="h-24 bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100">
                        {uni.logo_url ? (
                          <img src={uni.logo_url} alt="" className="h-16 object-contain" />
                        ) : (
                          <Building2 className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight mb-1">{uni.university_name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {uni.country}</p>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tuition</p>
                            <p className="text-sm font-medium text-gray-900">{uni.tuitionCategory}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Scholarships</p>
                            <p className="text-sm font-medium text-gray-900">{uni.hasScholarship ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Programs</p>
                            <div className="flex flex-wrap gap-1">
                              {uni.programs.map((p, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Degrees</p>
                            <p className="text-sm text-gray-700">{uni.degreeLevels.join(', ')}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setShowCompareModal(false);
                            setSelectedBoothId(uni.user_id);
                          }}
                          className="w-full py-2 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          Visit Booth <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {compareList.length < 3 && (
                    <div className="w-72 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50/50">
                      <Scale className="w-8 h-8 mb-3 text-gray-300" />
                      <p className="text-sm font-medium">Add another institution</p>
                      <p className="text-xs mt-1">Up to 3 allowed</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
