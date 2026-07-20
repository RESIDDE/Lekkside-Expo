import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserCheck, CheckCircle, XCircle, Clock, Search, ChevronDown, FileText, Link } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Screenings() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // We join with profiles to get the student's name
    const { data: screeningData } = await supabase
      .from('student_screenings')
      .select('*, student:profiles!fk_student_screenings_profiles(full_name)')
      .order('created_at', { ascending: false });
    
    setScreenings(screeningData || []);
    setLoading(false);
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase
      .from('student_screenings')
      .update({ status: newStatus })
      .eq('id', id);
    
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': 
      default: return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending':
      default: return 'Pending';
    }
  };

  const filteredScreenings = screenings.filter(s => {
    const searchString = `${s.student?.full_name || ''} ${s.intended_course || ''} ${s.preferred_destination || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Screenings</h1>
              <p className="text-muted-foreground mt-2">
                Review and approve student screenings before they can submit applications.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by student, course, or destination..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              <ChevronDown className="h-4 w-4" />
              Filter Status
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredScreenings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No screenings found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredScreenings.map((screening, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={screening.id} 
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                          screening.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          screening.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {getStatusIcon(screening.status)}
                          {getStatusText(screening.status)}
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(screening.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {screening.student?.full_name || 'Unknown Student'}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="font-medium">Intended Course:</span> {screening.intended_course || 'N/A'}
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="font-medium">Destination:</span> {screening.preferred_destination || 'N/A'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs">Budget</span>
                          <span className="font-medium">{screening.budget || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs">English Score</span>
                          <span className="font-medium">{screening.english_test ? `${screening.english_test} (${screening.english_score})` : 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs">Highest Qualification</span>
                          <span className="font-medium">{screening.highest_qualification || 'N/A'} (GPA: {screening.gpa || 'N/A'})</span>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="flex gap-4 pt-2">
                         {screening.cv_url && (
                           <a href={screening.cv_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                             <FileText className="h-4 w-4" /> CV
                           </a>
                         )}
                         {screening.transcripts_url && (
                           <a href={screening.transcripts_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                             <FileText className="h-4 w-4" /> Transcripts
                           </a>
                         )}
                         {screening.passport_url && (
                           <a href={screening.passport_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                             <FileText className="h-4 w-4" /> Passport
                           </a>
                         )}
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                      {(screening.status === 'pending' || screening.status === 'rejected' || !screening.status) && (
                        <button 
                          onClick={() => handleStatusChange(screening.id, 'approved')}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                      )}
                      {(screening.status === 'pending' || screening.status === 'approved' || !screening.status) && (
                        <button 
                          onClick={() => handleStatusChange(screening.id, 'rejected')}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" /> Reject
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
    </AppLayout>
  );
}
