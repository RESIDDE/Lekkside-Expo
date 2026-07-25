import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Plus, Upload, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';
import { motion, AnimatePresence } from 'framer-motion';

export function StudentApplications({ user }: { user: any }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    university_id: '',
    program_name: ''
  });
  const [screeningStatus, setScreeningStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: apps } = await supabase
      .from('university_applications')
      .select('*, profiles!university_id(full_name, university_name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    
    setApplications(apps || []);

    const { data: unis } = await supabase
      .from('profiles')
      .select('user_id, full_name, university_name, role');
    
    setUniversities((unis || []).filter(u => u.user_id !== user.id));

    const { data: screening } = await supabase
      .from('student_screenings')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    if (screening) {
      setScreeningStatus(screening.status || 'pending');
    }
    setLoading(false);
  }

  const handleStartApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.university_id || !formData.program_name) return;

    const { error } = await supabase
      .from('university_applications')
      .insert({
        student_id: user.id,
        university_id: formData.university_id,
        program_name: formData.program_name,
        status: 'draft',
        payment_status: 'pending'
      });

    if (!error) {
      setIsFormOpen(false);
      setFormData({ university_id: '', program_name: '' });
      fetchData();
    }
  };

  const handlePayFee = async (id: string) => {
    await supabase
      .from('university_applications')
      .update({ payment_status: 'paid', status: 'submitted' })
      .eq('id', id);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected': return <XCircle className="h-6 w-6 text-red-500" />;
      case 'submitted':
      case 'under_review': return <Clock className="h-6 w-6 text-blue-500" />;
      default: return <FileText className="h-6 w-6 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-900 shadow-2xl p-8 md:p-10 rounded-[2.5rem] border border-gray-800">
        <div className="flex-1">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2 leading-tight">University Applications</h2>
          <p className="text-gray-400 text-lg font-medium">Track and manage your university applications seamlessly.</p>
          {screeningStatus !== 'approved' && (
            <div className="mt-6 p-5 bg-amber-500/10 text-amber-100 text-sm rounded-3xl border border-amber-500/20 leading-relaxed font-medium">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block mb-1">Attention Required</span>
              You must complete your screening and have it approved by an administrator before you can submit applications. Current status: <span className="font-bold text-amber-300 capitalize">{screeningStatus || 'Not Submitted'}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          disabled={screeningStatus !== 'approved'}
          className={`flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 ${
            screeningStatus === 'approved' 
              ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5' 
              : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'
          }`}
        >
          <Plus className={`h-5 w-5 transition-transform duration-500 ${isFormOpen ? 'rotate-45' : ''}`} />
          New Application
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-black p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-8">Start New Application</h3>
              <form onSubmit={handleStartApplication} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Select University</label>
                  <select
                    required
                    value={formData.university_id}
                    onChange={(e) => setFormData({...formData, university_id: e.target.value})}
                    className="w-full rounded-2xl bg-gray-900 border border-gray-800 px-5 py-4 focus:ring-4 focus:ring-white/10 focus:border-white focus:bg-gray-900 text-white outline-none transition-all font-medium"
                  >
                    <option value="" className="text-gray-500">Choose a university...</option>
                    {universities.map(uni => (
                      <option key={uni.user_id} value={uni.user_id}>
                        {uni.university_name || uni.full_name || 'Unnamed University'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Program Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. B.Sc Computer Science"
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    className="w-full rounded-2xl bg-gray-900 border border-gray-800 px-5 py-4 focus:ring-4 focus:ring-white/10 focus:border-white focus:bg-gray-900 text-white outline-none transition-all font-medium placeholder-gray-600"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all shadow-md hover:-translate-y-0.5 flex-1 md:flex-none"
                  >
                    Create Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-8 py-4 text-gray-400 bg-gray-900 hover:bg-gray-800 hover:text-white rounded-full font-bold transition-colors flex-1 md:flex-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-transparent">
        {applications.length === 0 ? (
          <div className="p-16 text-center bg-gray-900 rounded-[3rem] border border-gray-800 shadow-xl">
            <div className="h-24 w-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-6 border border-gray-700">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">No applications yet</h3>
            <p className="text-gray-400 font-medium text-lg max-w-sm mx-auto">You haven't started any university applications. Your journey begins here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications.map((app, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={app.id} 
                className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-xl hover:border-gray-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 p-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 shadow-sm">
                      {getStatusIcon(app.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <PresenceIndicator userId={app.university_id} />
                        <h4 className="text-2xl font-bold tracking-tight text-white">{app.profiles?.university_name || app.profiles?.full_name || 'Unknown University'}</h4>
                      </div>
                      <p className="text-gray-400 font-semibold">{app.program_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                      app.status === 'accepted' ? 'bg-green-900/40 text-green-400 border border-green-800' :
                      app.status === 'rejected' ? 'bg-red-900/40 text-red-400 border border-red-800' :
                      app.status === 'under_review' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' :
                      app.status === 'submitted' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' :
                      'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${
                      app.payment_status === 'paid' ? 'text-green-500' : 'text-orange-400'
                    }`}>
                      {app.payment_status === 'paid' ? 'Fee Paid' : 'Payment Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-800">
                  <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Started on {new Date(app.created_at).toLocaleDateString()}</p>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 bg-gray-900 border border-gray-700 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all flex shadow-sm">
                      <Upload className="h-4 w-4" />
                      Documents
                    </button>
                    {app.payment_status === 'pending' && (
                      <button 
                        onClick={() => handlePayFee(app.id)}
                        className="flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-all flex"
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Fee
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
