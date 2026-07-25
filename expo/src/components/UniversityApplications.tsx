import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, CheckCircle, XCircle, Clock, Search, ChevronDown } from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';

export function UniversityApplications({ user }: { user: any }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchData() {
    setLoading(true);
    
    const { data: apps } = await supabase
      .from('university_applications')
      .select('*, profiles!student_id(full_name)')
      .eq('university_id', user.id)
      .order('created_at', { ascending: false });
    
    setApplications(apps || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase
      .from('university_applications')
      .update({ status: newStatus })
      .eq('id', id);
    
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'submitted':
      case 'under_review': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredApps = applications.filter(app => 
    (app.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.program_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gray-900 shadow-2xl p-8 md:p-10 rounded-[2.5rem] border border-gray-800">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Applicant Tracking</h2>
          <p className="text-gray-400 font-medium text-sm mt-2">Review incoming student applications</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-12 pr-6 py-4 rounded-[1.25rem] bg-black border border-gray-800 focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all text-white placeholder-gray-500 font-medium"
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-20 w-20 mx-auto bg-black rounded-full flex items-center justify-center text-gray-600 mb-6 border border-gray-800 shadow-inner">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No applications found</h3>
            <p className="text-gray-500 font-medium">You don't have any incoming applications matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredApps.map((app) => (
              <div key={app.id} className="p-8 hover:bg-black/40 transition-colors group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-start gap-5">
                    <div className="mt-1 p-2 bg-black rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors shadow-inner">{getStatusIcon(app.status)}</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <PresenceIndicator userId={app.student_id} />
                        <h4 className="text-xl font-bold text-white">{app.profiles?.full_name || 'Unknown Applicant'}</h4>
                      </div>
                      <p className="text-gray-400 font-bold tracking-wide mt-2">PROGRAM: <span className="text-white">{app.program_name}</span></p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2 font-bold">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${
                      app.payment_status === 'paid' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                    }`}>
                      {app.payment_status === 'paid' ? 'Fee Paid' : 'Payment Pending'}
                    </span>
                    <div className="relative group/select">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`appearance-none cursor-pointer pl-5 pr-12 py-2.5 rounded-[1rem] text-[10px] font-bold uppercase tracking-widest border outline-none transition-all shadow-inner ${
                          app.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          app.status === 'under_review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          app.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                          'bg-black text-gray-400 border-gray-800'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-current opacity-70 group-hover/select:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4 ml-[76px]">
                  <button className="text-xs font-bold text-white uppercase tracking-widest hover:text-gray-300 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5">
                    View Documents ({app.documents?.length || 0})
                  </button>
                  <button className="text-xs font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/20">
                    Send Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
