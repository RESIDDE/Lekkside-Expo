import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversityMeetingsManagerProps {
  user: any;
}

export function UniversityMeetingsManager({ user }: UniversityMeetingsManagerProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'declined' | 'rescheduled'>('pending');
  
  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    
    // We join with profiles twice if we need university, but we only need student info here.
    const { data, error } = await supabase
      .from('meeting_requests')
      .select(`
        id,
        status,
        requested_time,
        message,
        created_at,
        student_id,
        student:profiles!meeting_requests_student_id_fkey (
          full_name,
          contact_email
        )
      `)
      .eq('university_id', user.id)
      .order('requested_time', { ascending: true });

    if (error) {
      console.error("Error fetching meetings:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string, studentId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Send notification to student
      let message = '';
      if (newStatus === 'accepted') {
        message = `Your meeting request was accepted! Join here when it's time: http://localhost:8080/meetings/booth-${user.id}`;
      } else if (newStatus === 'declined') {
        message = `Your meeting request was declined. Please try another time.`;
      }

      if (message) {
        await supabase.from('notifications').insert({
          user_id: studentId,
          title: 'Meeting Request Update',
          message: message,
          type: 'meeting',
          read: false
        });
      }

      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err: any) {
      console.error(err);
      alert('Failed to update meeting status: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({ 
          status: 'rescheduled', 
          requested_time: new Date(newDate).toISOString() 
        })
        .eq('id', rescheduleTarget.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: rescheduleTarget.student_id,
        title: 'Meeting Rescheduled',
        message: `The university proposed a new time for your meeting: ${new Date(newDate).toLocaleString()}.`,
        type: 'meeting',
        read: false
      });

      setRequests(prev => prev.map(r => 
        r.id === rescheduleTarget.id 
          ? { ...r, status: 'rescheduled', requested_time: new Date(newDate).toISOString() } 
          : r
      ));
      setIsRescheduling(false);
      setRescheduleTarget(null);
      setNewDate('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to reschedule: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-800 bg-black p-5 gap-3 overflow-x-auto">
        {(['pending', 'accepted', 'rescheduled', 'declined'] as const).map(tab => {
          const isActive = activeTab === tab;
          const count = requests.filter(r => r.status === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-[1rem] text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 border ${
                isActive 
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'bg-black text-gray-500 border-gray-800 hover:text-white hover:border-gray-600'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                isActive ? 'bg-black/10 text-black' : 'bg-gray-800 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 bg-black rounded-[1.5rem] flex items-center justify-center mb-6 text-gray-500 border border-gray-800 shadow-inner">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">NO {activeTab.toUpperCase()} MEETINGS</h3>
            <p className="text-gray-400 font-medium">You have no meeting requests in this status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map(req => {
              const studentName = req.student?.full_name || 'A Student';
              const studentEmail = req.student?.contact_email || 'No email provided';
              const reqTime = new Date(req.requested_time);
              
              return (
                <div key={req.id} className="bg-black rounded-[1.5rem] p-6 border border-gray-800 shadow-inner hover:border-gray-600 transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold border border-gray-800">
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white tracking-wide">{studentName}</h4>
                        <p className="text-xs text-gray-500 font-medium">{studentEmail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-5 mb-6 flex-1 border border-gray-800 group-hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-3 text-white font-bold mb-3 text-sm tracking-wide">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {reqTime.toLocaleDateString()} at {reqTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {req.message && (
                      <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-800">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-400 font-medium">"{req.message}"</p>
                      </div>
                    )}
                  </div>

                  {activeTab === 'pending' || activeTab === 'rescheduled' ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'accepted', req.student_id)}
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> ACCEPT
                      </button>
                      <button 
                        onClick={() => {
                          setRescheduleTarget(req);
                          setIsRescheduling(true);
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 py-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        <Clock className="w-4 h-4" /> RESCHEDULE
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'declined', req.student_id)}
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> DECLINE
                      </button>
                    </div>
                  ) : activeTab === 'accepted' ? (
                     <a 
                      href={`http://localhost:8080/meetings/booth-${user.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-black rounded-[1.25rem] font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      JOIN MEETING NOW
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {isRescheduling && rescheduleTarget && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRescheduling(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black">
                <h3 className="font-bold text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-gray-900 rounded-lg border border-gray-800"><Clock className="w-5 h-5 text-white" /></div> RESCHEDULE
                </h3>
                <button
                  onClick={() => setIsRescheduling(false)}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleReschedule} className="p-8 space-y-6">
                <div>
                  <p className="text-sm text-gray-400 mb-6 font-medium">
                    Propose a new time for your meeting with <span className="font-bold text-white">{rescheduleTarget.student?.full_name}</span>.
                  </p>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    New Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-5 py-3 bg-black border border-gray-800 rounded-[1.25rem] focus:ring-2 focus:ring-white/20 outline-none text-white font-medium [color-scheme:dark]"
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-6 py-3.5 text-[10px] font-bold text-white uppercase tracking-widest bg-black border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newDate}
                    className="px-6 py-3.5 text-[10px] font-bold text-black uppercase tracking-widest bg-white rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'SENDING...' : 'SEND REQUEST'}
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
