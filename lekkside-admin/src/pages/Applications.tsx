import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileText, CheckCircle, XCircle, Clock, Search, ChevronDown, Building2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const { data: apps } = await supabase
      .from('university_applications')
      .select('*, student:profiles!university_applications_student_id_fkey(full_name), university:profiles!university_applications_university_id_fkey(full_name, university_name)')
      .order('created_at', { ascending: false });
    
    setApplications(apps || []);
    setLoading(false);
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase
      .from('university_applications')
      .update({ status: newStatus })
      .eq('id', id);
    
    fetchData();
  };

  const handleEditRequest = async (id: string, action: 'approve' | 'deny' | 'delete') => {
    let updates: any = {};
    if (action === 'approve') {
      updates = { edit_request_status: null, edit_request_message: null, status: 'draft' };
    } else if (action === 'deny') {
      updates = { edit_request_status: 'denied' };
    } else if (action === 'delete') {
      updates = { edit_request_status: null, edit_request_message: null };
    }

    await supabase
      .from('university_applications')
      .update(updates)
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

  const filteredApps = applications.filter(app => {
    const studentName = app.student?.full_name || '';
    const uniName = app.university?.university_name || app.university?.full_name || '';
    const program = app.program_name || '';
    const term = searchTerm.toLowerCase();
    
    return studentName.toLowerCase().includes(term) || 
           uniName.toLowerCase().includes(term) ||
           program.toLowerCase().includes(term);
  });

  return (
    <AppLayout>
      <div className="space-y-10 sm:space-y-14">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Platform Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground tracking-tight">
              Applications
            </h1>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg font-medium leading-relaxed">
              View and manage student applications across all universities.
            </p>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/40 shadow-sm">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student, university, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2 rounded-xl border border-border/60 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No applications found</h3>
                <p className="text-muted-foreground mb-6">No applications match your search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredApps.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getStatusIcon(app.status)}</div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{app.student?.full_name || 'Unknown Applicant'}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{app.university?.university_name || app.university?.full_name || 'Unknown University'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Program: <span className="font-medium text-foreground">{app.program_name}</span></p>
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
                            className="appearance-none cursor-pointer pl-4 pr-10 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border outline-none bg-background border-border/60 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {app.edit_request_status === 'pending' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                                Update Access Request
                              </p>
                              <p className="text-sm text-foreground/80 italic">"{app.edit_request_message}"</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditRequest(app.id, 'approve')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <Check className="w-4 h-4" /> Approve
                              </button>
                              <button 
                                onClick={() => handleEditRequest(app.id, 'deny')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <X className="w-4 h-4" /> Deny
                              </button>
                              <button 
                                onClick={() => handleEditRequest(app.id, 'delete')}
                                className="flex items-center gap-1.5 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
