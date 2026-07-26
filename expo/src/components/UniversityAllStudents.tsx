import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, Phone, MapPin, BookOpen, GraduationCap, DollarSign, Calendar, X, User, UserCircle2, MessageSquare, Send, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

export function UniversityAllStudents({ user }: { user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Messaging State
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Bulk Messaging State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

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

  const sendMessageToStudent = async (studentId: string, studentName: string, studentEmail: string, content: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const currentUserId = user?.id || authUser?.id;
      
      if (!currentUserId) throw new Error("Could not find user session.");

      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('university_id', currentUserId)
        .eq('student_id', studentId)
        .maybeSingle();
        
      let convId = convData?.id;
      
      if (!convId) {
         const { data: newConv, error: convError } = await supabase
           .from('chat_conversations')
           .insert({
              university_id: currentUserId,
              student_id: studentId,
              student_name: studentName,
              student_email: studentEmail || '',
              last_message: content,
              last_message_at: new Date().toISOString()
           })
           .select('id')
           .single();
           
         if (convError) throw convError;
         convId = newConv?.id;
      } else {
         const { error: updateError } = await supabase.from('chat_conversations').update({
           last_message: content,
           last_message_at: new Date().toISOString()
         }).eq('id', convId);
         if (updateError) throw updateError;
      }
      
      if (convId) {
        const { error: msgError } = await supabase.from('chat_messages').insert({
          conversation_id: convId,
          sender_id: currentUserId,
          content: content
        });
        if (msgError) throw msgError;
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      throw err;
    }
  };

  const handleSendSingleMessage = async () => {
    if (!messageText.trim() || !selectedStudent) return;
    setSendingMsg(true);
    try {
      await sendMessageToStudent(
        selectedStudent.user_id, 
        selectedStudent.full_name, 
        selectedStudent.contact_email, 
        messageText.trim()
      );
      setMessageText('');
      setShowMessageInput(false);
      alert('Message sent successfully! You can continue the conversation in the Live Chats tab.');
    } catch (err: any) {
      alert(`Failed to send message: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageText.trim() || students.length === 0) return;
    setSendingBulk(true);
    setBulkProgress(0);
    
    try {
      // Process in small batches to not overwhelm the client/network
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        try {
          await sendMessageToStudent(
            student.user_id,
            student.full_name,
            student.contact_email,
            bulkMessageText.trim()
          );
        } catch (e) {
          console.error(`Failed for student ${student.user_id}`, e);
        }
        setBulkProgress(Math.round(((i + 1) / students.length) * 100));
      }
      
      setBulkMessageText('');
      setShowBulkModal(false);
      alert(`Bulk message sent to ${students.length} students successfully!`);
    } catch (err) {
      alert('An error occurred during bulk messaging.');
    } finally {
      setSendingBulk(false);
      setBulkProgress(0);
    }
  };

  return (
    <div className="w-full relative min-h-screen pb-20">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Registered Students</h2>
          <p className="text-gray-500 font-medium">{students.length} students enrolled</p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          disabled={students.length === 0 || loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          <MessageSquare className="w-5 h-5" />
          Bulk Message All
        </button>
      </div>
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
              const photoUrl = student.logo_url || screening?.passport_url || student.custom_fields?.['Attendee Photo'];
              const country = screening?.preferred_destination || student.custom_fields?.['Which country do you want to study in?'] || student.custom_fields?.['Preferred Destination'] || 'Not specified';
              const studyLevel = screening?.highest_qualification || student.custom_fields?.['What is your highest level of education?'] || student.custom_fields?.['Highest Educational Qualification'] || 'Not specified';

              return (
                <motion.div
                  key={student.id}
                  layoutId={`card-${student.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: (idx % 12) * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowMessageInput(false);
                    setMessageText('');
                  }}
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
                <div className="p-6 md:p-10 border-b border-gray-100 relative bg-white/80 backdrop-blur-md">
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all hover:scale-105 active:scale-95 z-20"
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
                        <button 
                          onClick={() => setShowMessageInput(!showMessageInput)}
                          className="flex items-center gap-2 text-sm font-bold text-white transition-colors bg-blue-600 px-5 py-2 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg shadow-blue-500/20"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar relative z-10 flex flex-col gap-6">
                  
                  {/* Inline Message Composer */}
                  <AnimatePresence>
                    {showMessageInput && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white rounded-[1.5rem] border border-blue-100 shadow-md p-5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Send className="w-4 h-4 text-blue-500" />
                            Direct Message
                          </h4>
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder={`Type a message to ${selectedStudent.full_name}...`}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none h-24 mb-3"
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setShowMessageInput(false)}
                              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSendSingleMessage}
                              disabled={sendingMsg || !messageText.trim()}
                              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
                            >
                              {sendingMsg ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                              ) : (
                                <><Send className="w-4 h-4" /> Send</>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                                  <p className="font-bold text-gray-900">{s?.intended_course || selectedStudent.custom_fields?.['Intended Course of Study'] || selectedStudent.custom_fields?.['What level of study are you looking for?'] || 'Not specified'}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 border border-blue-100">
                                  <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Preferred Destination</p>
                                  <p className="font-bold text-gray-900">{s?.preferred_destination || selectedStudent.custom_fields?.['Which country do you want to study in?'] || selectedStudent.custom_fields?.['Preferred Destination'] || 'Not specified'}</p>
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 border border-emerald-100">
                                  <GraduationCap className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Highest Education Level</p>
                                  <p className="font-bold text-gray-900">
                                    {s?.highest_qualification || selectedStudent.custom_fields?.['What is your highest level of education?'] || selectedStudent.custom_fields?.['Highest Educational Qualification'] || 'Not specified'} 
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
                                    {s?.budget || selectedStudent.custom_fields?.['What is your budget for tuition fees?'] || selectedStudent.custom_fields?.['Budget for Studies'] || 'Not specified'}
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

      {/* Bulk Message Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sendingBulk && setShowBulkModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 md:px-8 md:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Broadcast Message</h2>
                    <p className="text-xs md:text-sm font-medium text-gray-500 mt-0.5 md:mt-1">Sending to {students.length} students</p>
                  </div>
                </div>
                {!sendingBulk && (
                  <button 
                    onClick={() => setShowBulkModal(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="p-6 md:p-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Message</label>
                <textarea
                  value={bulkMessageText}
                  onChange={(e) => setBulkMessageText(e.target.value)}
                  disabled={sendingBulk}
                  placeholder="Type your message here. This will be sent as a direct message to all registered students."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none h-40 md:h-48 disabled:opacity-50"
                />
                
                {sendingBulk && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                      <span>Sending messages...</span>
                      <span>{bulkProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${bulkProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 md:px-8 md:py-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={sendingBulk}
                  className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkMessage}
                  disabled={!bulkMessageText.trim() || sendingBulk}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {sendingBulk ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send Broadcast</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
