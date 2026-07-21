import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatePresence } from 'framer-motion';
import { UniversityBoothModal } from './UniversityBoothModal';
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
  X
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
  online: boolean;
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

          // Online status can remain mocked for demo purposes (usually handled via websockets)
          const isOnline = Math.random() > 0.4; 

          return {
            id: profile.id,
            user_id: profile.user_id,
            university_name: profile.university_name || 'Unnamed University',
            full_name: profile.full_name || '',
            location: profile.location || '',
            logo_url: profile.logo_url || '',
            country,
            online: isOnline,
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
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 text-xs font-semibold">
                      <span className={`h-2 w-2 rounded-full ${uni.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className={uni.online ? 'text-green-700' : 'text-gray-600'}>
                        {uni.online ? 'Online Now' : 'Offline'}
                      </span>
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
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button 
                      onClick={() => setSelectedBoothId(uni.user_id)}
                      className="w-full py-2.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                    >
                      View Profile
                      <CheckCircle2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
