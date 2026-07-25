import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar,
  Clock,
  MessageSquare,
  Building2,
  Video
} from 'lucide-react';

interface StudentMeetingsManagerProps {
  user: any;
}

export function StudentMeetingsManager({ user }: StudentMeetingsManagerProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'declined' | 'rescheduled'>('pending');

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('meeting_requests')
      .select(`
        id,
        status,
        requested_time,
        message,
        created_at,
        university_id,
        university:profiles!meeting_requests_university_id_fkey (
          full_name,
          university_name,
          logo_url
        )
      `)
      .eq('student_id', user.id)
      .order('requested_time', { ascending: true });

    if (error) {
      console.error("Error fetching meetings:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredRequests = requests.filter(r => r.status === activeTab);

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
              <span>{tab === 'declined' ? 'rejected' : tab}</span>
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
              const uniName = req.university?.university_name || req.university?.full_name || 'A University';
              const reqTime = new Date(req.requested_time);
              const logoUrl = req.university?.logo_url;
              
              return (
                <div key={req.id} className="bg-black rounded-[1.5rem] p-6 border border-gray-800 shadow-inner hover:border-gray-600 transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold border border-gray-800 overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt={uniName} className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white tracking-wide">{uniName}</h4>
                        <p className="text-xs text-gray-500 font-medium">University</p>
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
                  
                  {activeTab === 'accepted' && (
                    <div className="mt-auto">
                      <a 
                        href={`${import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080'}/meetings/booth-${req.university_id}?returnUrl=${encodeURIComponent(window.location.origin + '/student-dashboard')}`}
                        target="_blank"
                        className="flex w-full items-center justify-center gap-2 py-3.5 bg-blue-600 text-white hover:bg-blue-500 rounded-xl text-sm font-bold tracking-wide transition-colors"
                      >
                        <Video className="w-4 h-4" /> Join Video Meeting
                      </a>
                    </div>
                  )}
                  {activeTab === 'rescheduled' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-xs font-medium mt-auto">
                      The university has proposed a new time for your meeting. If this works, simply join at the new time!
                    </div>
                  )}
                  {activeTab === 'pending' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-xs font-medium mt-auto">
                      Waiting for that particular university to accept the meeting request.
                    </div>
                  )}
                  {activeTab === 'declined' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-medium mt-auto">
                      The university was unable to accept your meeting request for this time.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
