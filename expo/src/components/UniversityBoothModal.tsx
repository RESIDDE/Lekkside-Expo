import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Building2, MapPin, Globe, Award, DollarSign, Clock, BookOpen, GraduationCap, Search, Filter, MessageSquare, Calendar, Download, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from './ChatWindow';

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
  brochure_url?: string;
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
  

  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Appointment state
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

  // Application state
  const [isApplying, setIsApplying] = useState(false);
  const [applicationProgram, setApplicationProgram] = useState('');
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  useEffect(() => {
    async function fetchBoothData() {
      setLoading(true);
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', universityId)
        .maybeSingle();
        
      if (profile) {
        setUniversity({
          id: profile.id,
          user_id: profile.user_id,
          university_name: profile.university_name || 'Unnamed University',
          location: profile.location || '',
          logo_url: profile.logo_url || '',
          banner_url: profile.banner_url || '',
          description: profile.description || '',
          website_url: profile.website_url || '',
          brochure_url: profile.brochure_url || ''
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

  const handleInteractionRequest = async () => {
    setIsChatOpen(true);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate) return;
    
    setIsSubmittingAppointment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Please log in to request a meeting.'); return; }

      const { error } = await supabase.from('meeting_requests').insert({
        university_id: universityId,
        student_id: user.id,
        requested_time: new Date(appointmentDate).toISOString(),
        message: appointmentMessage
      });

      if (error) throw error;
      
      // Notify the university
      await supabase.from('notifications').insert({
        user_id: universityId,
        title: 'New Meeting Request',
        message: `${user.user_metadata?.full_name || 'A student'} requested a meeting for ${new Date(appointmentDate).toLocaleString()}`,
        type: 'meeting',
        read: false
      });

      alert('Meeting request sent successfully!');
      setIsBookingAppointment(false);
      setAppointmentDate('');
      setAppointmentMessage('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to send request: ' + err.message);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationProgram) return;

    setIsSubmittingApplication(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Please log in to apply.'); return; }

      const selectedProgram = programs.find(p => p.id === applicationProgram);
      const programName = selectedProgram?.program_name || 'Unknown Program';

      const { error } = await supabase.from('university_applications').insert({
        university_id: universityId,
        student_id: user.id,
        program_id: applicationProgram,
        program_name: programName,
        status: 'pending'
      });

      if (error) throw error;
      
      // Notify the university
      await supabase.from('notifications').insert({
        user_id: universityId,
        title: 'New Student Application',
        message: `${user.user_metadata?.full_name || 'A student'} has submitted a new application.`,
        type: 'application',
        read: false
      });

      alert('Application submitted successfully!');
      setIsApplying(false);
      setApplicationProgram('');
      setApplicationMessage('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit application: ' + err.message);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

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
          
          {/* Communication Options */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <button 
              onClick={handleInteractionRequest}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center leading-tight">
                Live<br/>Chat
              </span>
            </button>

            <button 
              onClick={() => setIsBookingAppointment(true)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center leading-tight">Book<br/>Appointment</span>
            </button>

            <button 
              onClick={() => {
                if (university.brochure_url) {
                  window.open(university.brochure_url, '_blank', 'noopener,noreferrer');
                } else {
                  alert('No brochure available for this university.');
                }
              }}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center leading-tight">Download<br/>Brochure</span>
            </button>

            <button 
              onClick={() => setIsApplying(true)}
              className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-2xl border border-primary shadow-sm hover:shadow-md hover:bg-primary/90 transition-all gap-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">Apply<br/>Now</span>
            </button>
          </section>

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

      {/* Chat Window - renders over the modal */}
      <AnimatePresence>
        {isChatOpen && university && (
          <ChatWindow
            universityId={universityId}
            universityName={university.university_name}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Appointment Booking Modal */}
      <AnimatePresence>
        {isBookingAppointment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingAppointment(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Book Appointment
                </h3>
                <button
                  onClick={() => setIsBookingAppointment(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={appointmentMessage}
                    onChange={(e) => setAppointmentMessage(e.target.value)}
                    placeholder="Briefly describe what you'd like to discuss..."
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none h-24 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingAppointment(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAppointment || !appointmentDate}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingAppointment ? 'Sending...' : 'Request Meeting'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Apply Now Modal */}
      <AnimatePresence>
        {isApplying && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplying(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> Begin Application
                </h3>
                <button
                  onClick={() => setIsApplying(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleApply} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Program
                  </label>
                  <select
                    required
                    value={applicationProgram}
                    onChange={(e) => setApplicationProgram(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  >
                    <option value="">-- Choose a Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.program_name} ({p.degree_level})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Statement / Message (Optional)
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Tell the admissions team why you'd be a great fit..."
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none h-32 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsApplying(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApplication || !applicationProgram}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingApplication ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
