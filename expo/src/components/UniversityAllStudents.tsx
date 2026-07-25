import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, Phone, MapPin, BookOpen, GraduationCap, DollarSign, Calendar, X, User, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function UniversityAllStudents({ }: { user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            student_screenings (*)
          `)
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  return (
    <div className="w-full relative min-h-screen pb-20">


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-[2rem] bg-gray-100 animate-pulse border border-gray-200"></div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500 font-medium">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          <AnimatePresence>
            {students.map((student, idx) => {
              const screening = Array.isArray(student.student_screenings) ? student.student_screenings[0] : student.student_screenings;
              const photoUrl = student.logo_url || screening?.passport_url;
              const country = screening?.preferred_destination || 'Not specified';
              const studyLevel = screening?.highest_qualification || 'Not specified';

              return (
                <motion.div
                  key={student.id}
                  layoutId={`card-${student.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: (idx % 12) * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => setSelectedStudent(student)}
                  className="group cursor-pointer bg-white rounded-[2rem] p-6 border border-gray-100 hover:border-blue-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-bl-[100px] -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm relative group-hover:border-blue-200 transition-colors duration-500">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <UserCircle2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                        {student.full_name || 'Student'}
                      </h3>
                      {student.contact_email && (
                        <p className="text-sm text-gray-500 truncate font-medium mt-0.5">{student.contact_email}</p>
                      )}
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{country}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 uppercase tracking-widest group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-100 transition-colors">
                          <BookOpen className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{studyLevel}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Expanded Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100]"
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 md:p-8 pointer-events-none">
              <motion.div
                layoutId={`card-${selectedStudent.id}`}
                className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto border border-gray-100 relative"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-[80px] pointer-events-none"></div>
                
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-gray-100 relative bg-white/80 backdrop-blur-md">
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-8 right-8 p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all hover:scale-105 active:scale-95 z-20"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                    <div className="w-28 h-28 rounded-[2rem] bg-gray-100 border-2 border-white shadow-xl overflow-hidden flex-shrink-0 relative group">
                      {(() => {
                        const s = Array.isArray(selectedStudent.student_screenings) ? selectedStudent.student_screenings[0] : selectedStudent.student_screenings;
                        const pUrl = selectedStudent.logo_url || s?.passport_url;
                        return pUrl ? (
                          <img src={pUrl} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <UserCircle2 className="w-12 h-12 text-gray-400" />
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
                        <User className="w-3.5 h-3.5" />
                        Student Profile
                      </div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-2">
                        {selectedStudent.full_name || 'Student'}
                      </h2>
                      
                      <div className="flex flex-wrap gap-4 mt-4">
                        {selectedStudent.contact_email && (
                          <a href={`mailto:${selectedStudent.contact_email}`} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md">
                            <Mail className="w-4 h-4 text-blue-500" />
                            {selectedStudent.contact_email}
                          </a>
                        )}
                        {selectedStudent.contact_phone && (
                          <a href={`tel:${selectedStudent.contact_phone}`} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md">
                            <Phone className="w-4 h-4 text-green-500" />
                            {selectedStudent.contact_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 md:p-10 overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Key Details Card */}
                    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Key Information</h4>
                      <div className="space-y-6">
                        {(() => {
                          const s = Array.isArray(selectedStudent.student_screenings) ? selectedStudent.student_screenings[0] : selectedStudent.student_screenings;
                          return (
                            <>
                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-500 border border-purple-100">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Intended Course</p>
                                  <p className="font-bold text-gray-900">{s?.intended_course || 'Not specified'}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 border border-blue-100">
                                  <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Preferred Destination</p>
                                  <p className="font-bold text-gray-900">{s?.preferred_destination || 'Not specified'}</p>
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 border border-emerald-100">
                                  <GraduationCap className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Highest Education Level</p>
                                  <p className="font-bold text-gray-900">
                                    {s?.highest_qualification || 'Not specified'} 
                                    {s?.gpa && <span className="text-gray-500 font-medium ml-2">(GPA: {s.gpa})</span>}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-100">
                                  <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Budget / Scholarship</p>
                                  <p className="font-bold text-gray-900">
                                    {s?.budget || 'Not specified'}
                                    {s?.scholarship && (
                                      <span className="text-gray-500 font-medium text-sm ml-2">({s.scholarship})</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Registration Meta & Additional Fields */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Registration Details</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registered On</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <p className="font-bold text-gray-900">{format(new Date(selectedStudent.created_at), 'PPP')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Other Details</h4>
                        <div className="space-y-4">
                          {(() => {
                            const s = Array.isArray(selectedStudent.student_screenings) ? selectedStudent.student_screenings[0] : selectedStudent.student_screenings;
                            return (
                              <>
                                <div className="border-b border-gray-50 pb-3">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">English Test</p>
                                  <p className="font-medium text-gray-900">{s?.english_test || 'Not specified'} {s?.english_score ? `(${s.english_score})` : ''}</p>
                                </div>
                                <div className="pb-3">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Documents</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {s?.cv_url && <a href={s.cv_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View CV</a>}
                                    {s?.transcripts_url && <a href={s.transcripts_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline ml-4">View Transcripts</a>}
                                    {!s?.cv_url && !s?.transcripts_url && <p className="text-sm text-gray-400 italic">No documents uploaded</p>}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
