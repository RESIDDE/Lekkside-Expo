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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Applicant Tracking</h2>
          <p className="text-gray-500 text-sm mt-1">Review incoming student applications</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No applications found</h3>
            <p className="text-gray-500 mb-6">You don't have any incoming applications matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredApps.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getStatusIcon(app.status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <PresenceIndicator userId={app.student_id} />
                        <h4 className="text-lg font-bold text-gray-900">{app.profiles?.full_name || 'Unknown Applicant'}</h4>
                      </div>
                      <p className="text-gray-700 font-medium mt-1">Program: {app.program_name}</p>
                      <p className="text-xs text-gray-400 mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      app.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {app.payment_status === 'paid' ? 'Fee Paid' : 'Payment Pending'}
                    </span>
                    <div className="relative group">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`appearance-none cursor-pointer pl-4 pr-10 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border outline-none ${
                          app.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          app.status === 'under_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'submitted' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-current opacity-70" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button className="text-sm font-medium text-primary hover:underline">
                    View Documents ({app.documents?.length || 0})
                  </button>
                  <span className="text-gray-300">•</span>
                  <button className="text-sm font-medium text-primary hover:underline">
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
