import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Plus, Upload, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

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
    // Fetch user's applications
    const { data: apps } = await supabase
      .from('university_applications')
      .select('*, profiles!university_id(full_name, university_name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    
    setApplications(apps || []);

    // Fetch universities
    const { data: unis } = await supabase
      .from('profiles')
      .select('user_id, full_name, university_name, role');
    
    // Display all for demo purposes, filtering out current user
    setUniversities((unis || []).filter(u => u.user_id !== user.id));

    // Fetch screening status
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
    // Mock payment by updating status to paid
    await supabase
      .from('university_applications')
      .update({ payment_status: 'paid', status: 'submitted' })
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

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">University Applications</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage your university applications</p>
          {screeningStatus !== 'approved' && (
            <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border border-yellow-200 leading-relaxed">
              <span className="font-semibold">Attention:</span> You must complete your screening and have it approved by an administrator before you can submit applications. Current status: <span className="font-bold capitalize">{screeningStatus || 'Not Submitted'}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          disabled={screeningStatus !== 'approved'}
          className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
            screeningStatus === 'approved' 
              ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          <Plus className="h-5 w-5" />
          Start New Application
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Start New Application</h3>
          <form onSubmit={handleStartApplication} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select University</label>
              <select
                required
                value={formData.university_id}
                onChange={(e) => setFormData({...formData, university_id: e.target.value})}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">Choose a university...</option>
                {universities.map(uni => (
                  <option key={uni.user_id} value={uni.user_id}>
                    {uni.university_name || uni.full_name || 'Unnamed University'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
              <input
                required
                type="text"
                placeholder="e.g. B.Sc Computer Science"
                value={formData.program_name}
                onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Create Application
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No applications yet</h3>
            <p className="text-gray-500 mb-6">You haven't started any university applications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getStatusIcon(app.status)}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{app.profiles?.university_name || app.profiles?.full_name || 'Unknown University'}</h4>
                      <p className="text-gray-600 font-medium">{app.program_name}</p>
                      <p className="text-sm text-gray-400 mt-1">Started on {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      app.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      app.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {app.payment_status === 'paid' ? 'Fee Paid' : 'Payment Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </button>
                  {app.payment_status === 'pending' && (
                    <button 
                      onClick={() => handlePayFee(app.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Application Fee
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
