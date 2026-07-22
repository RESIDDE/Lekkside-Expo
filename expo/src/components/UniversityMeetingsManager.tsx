import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  User,
  MoreVertical,
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 bg-gray-50/50 p-4 gap-2 overflow-x-auto">
        {(['pending', 'accepted', 'rescheduled', 'declined'] as const).map(tab => {
          const isActive = activeTab === tab;
          const count = requests.filter(r => r.status === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                isActive 
                  ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} meetings</h3>
            <p className="text-gray-500 text-sm">You have no meeting requests in this status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRequests.map(req => {
              const studentName = req.student?.full_name || 'A Student';
              const studentEmail = req.student?.contact_email || 'No email provided';
              const reqTime = new Date(req.requested_time);
              
              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:border-primary/30 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{studentName}</h4>
                        <p className="text-xs text-gray-500">{studentEmail}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-primary font-bold mb-2">
                      <Clock className="w-4 h-4" />
                      {reqTime.toLocaleDateString()} at {reqTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {req.message && (
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-700 italic">"{req.message}"</p>
                      </div>
                    )}
                  </div>

                  {activeTab === 'pending' || activeTab === 'rescheduled' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'accepted', req.student_id)}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button 
                        onClick={() => {
                          setRescheduleTarget(req);
                          setIsRescheduling(true);
                        }}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        <Clock className="w-4 h-4" /> Reschedule
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'declined', req.student_id)}
                        disabled={submitting}
                        className="flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  ) : activeTab === 'accepted' ? (
                     <a 
                      href={`http://localhost:8080/meetings/booth-${user.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                    >
                      Join Meeting Now
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
              className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Reschedule Meeting
                </h3>
                <button
                  onClick={() => setIsRescheduling(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleReschedule} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Propose a new time for your meeting with <span className="font-bold text-gray-900">{rescheduleTarget.student?.full_name}</span>.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newDate}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
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
