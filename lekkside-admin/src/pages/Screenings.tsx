import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserCheck, CheckCircle, XCircle, Clock, Search, ChevronDown, FileText, ShieldAlert, ShieldCheck, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Screenings() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const [profilesRes, eventsRes] = await Promise.all([
      supabase.from('profiles').select('*, student_screenings(*)').eq('role', 'student').order('created_at', { ascending: false }),
      supabase.from('events').select('id, name')
    ]);
    
    const profilesData = profilesRes.data || [];
    const eventsData = eventsRes.data || [];
    
    let allGuests: any[] = [];
    const emails = profilesData.map(p => p.contact_email).filter(Boolean);
    
    for (let i = 0; i < emails.length; i += 100) {
      const chunk = emails.slice(i, i + 100);
      const { data } = await supabase.from('guests').select('id, email, event_id, custom_fields').in('email', chunk);
      if (data) allGuests = [...allGuests, ...data];
    }
    
    if (profilesRes.error) console.error("Error fetching profiles:", profilesRes.error);
    setProfiles(profilesData);
    setEvents(eventsData);
    setGuests(allGuests);
    setLoading(false);
  }

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const screening = profile.student_screenings?.[0];
    
    if (screening) {
      // Update existing
      await supabase
        .from('student_screenings')
        .update({ status: newStatus })
        .eq('id', screening.id);
    } else {
      // Create new
      await supabase
        .from('student_screenings')
        .insert({
          user_id: profile.user_id,
          status: newStatus
        });
    }
    
    fetchData();
  };
  
  const handleAccountStatusChange = async (profileId: string, isActive: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId);
      
    fetchData();
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return 'Not Submitted';
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const screening = p.student_screenings?.[0] || {};
    
    const profileGuests = guests.filter(g => g.email?.toLowerCase() === p.contact_email?.toLowerCase());
    const registeredEventIds = profileGuests.map(g => g.event_id);
    
    if (selectedEventFilter !== 'all' && !registeredEventIds.includes(selectedEventFilter)) {
      return false;
    }
    
    const searchString = `${p.full_name || ''} ${screening.intended_course || ''} ${screening.preferred_destination || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const toggleProfileSelection = (id: string) => {
    const newSet = new Set(selectedProfiles);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProfiles(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    setLoading(true);
    const selectedArray = Array.from(selectedProfiles);
    
    for (const profileId of selectedArray) {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) continue;
      
      const screening = profile.student_screenings?.[0];
      if (screening) {
        await supabase.from('student_screenings').update({ status: newStatus }).eq('id', screening.id);
      } else {
        await supabase.from('student_screenings').insert({ user_id: profile.user_id, status: newStatus });
      }
    }
    
    setSelectedProfiles(new Set());
    await fetchData();
  };

  const handleBulkAccountStatusChange = async (isActive: boolean) => {
    setLoading(true);
    const selectedArray = Array.from(selectedProfiles);
    
    for (const profileId of selectedArray) {
      await supabase.from('profiles').update({ is_active: isActive }).eq('id', profileId);
    }
    
    setSelectedProfiles(new Set());
    await fetchData();
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Registration/Screening</h1>
              <p className="text-muted-foreground mt-2">
                Review all registered students, manage their screening status, and suspend/reactivate accounts.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by student, course, or destination..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <select 
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-50 text-gray-600 rounded-lg border-0 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>

          {selectedProfiles.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20 gap-4"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-primary">{selectedProfiles.size} selected</span>
                <div className="hidden sm:block h-4 w-px bg-primary/20"></div>
                <button 
                  onClick={() => handleBulkStatusChange('approved')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-700 hover:bg-green-500/20 rounded-lg text-sm font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Selected
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('rejected')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 rounded-lg text-sm font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject Selected
                </button>
                <button 
                  onClick={() => handleBulkAccountStatusChange(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-700 hover:bg-red-500/20 rounded-lg text-sm font-semibold transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" /> Suspend Selected
                </button>
              </div>
              <button 
                onClick={() => setSelectedProfiles(new Set())}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
              >
                Cancel Selection
              </button>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No students found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <input 
                  type="checkbox" 
                  checked={selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0}
                  onChange={toggleAllSelection}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <span className="font-medium text-gray-700 cursor-pointer" onClick={toggleAllSelection}>Select All {filteredProfiles.length} Students</span>
              </div>

              {filteredProfiles.map((profile, index) => {
                const screening = profile.student_screenings?.[0] || {};
                const isActive = profile.is_active;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={profile.id} 
                    className={`bg-white rounded-2xl p-6 shadow-sm border ${selectedProfiles.has(profile.id) ? 'border-primary shadow-primary/10' : 'border-gray-100'} hover:shadow-md transition-all`}
                  >
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      
                      <div className="flex items-start gap-4 flex-1">
                        <div className="pt-1">
                          <input 
                            type="checkbox" 
                            checked={selectedProfiles.has(profile.id)}
                            onChange={() => toggleProfileSelection(profile.id)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>
                        <div className="space-y-4 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                            screening.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                            screening.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                            screening.status === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {getStatusIcon(screening.status)}
                            {getStatusText(screening.status)}
                          </div>
                          
                          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                            isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {isActive ? 'Active Account' : 'Suspended'}
                          </div>
                          
                          <span className="text-sm text-gray-500 flex items-center gap-1 ml-2">
                            <Clock className="h-4 w-4" />
                            Registered: {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {profile.full_name || 'Unknown Student'}
                            <span className="text-sm font-normal text-gray-500">&lt;{profile.contact_email}&gt;</span>
                          </h3>
                          {screening.id ? (
                            <>
                              <p className="text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Intended Course:</span> {screening.intended_course || 'N/A'}
                              </p>
                              <p className="text-gray-600 flex items-center gap-2">
                                <span className="font-medium">Destination:</span> {screening.preferred_destination || 'N/A'}
                              </p>
                            </>
                          ) : (
                            <p className="text-gray-500 italic">Screening form not submitted yet.</p>
                          )}
                        </div>

                        {screening.id && (
                          <>
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
                          </>
                        )}

                        {/* Event Registrations */}
                        {(() => {
                           const profileGuests = guests.filter(g => g.email?.toLowerCase() === profile.contact_email?.toLowerCase());
                           if (profileGuests.length === 0) return null;
                           
                           return (
                             <div className="mt-4 pt-4 border-t border-gray-100">
                               <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                 <Calendar className="h-4 w-4" /> Event Registrations
                               </h4>
                               <div className="grid gap-3">
                                 {profileGuests.map(guest => {
                                   const event = events.find(e => e.id === guest.event_id);
                                   const customFields = guest.custom_fields || {};
                                   
                                   return (
                                     <div key={guest.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                       <p className="font-semibold text-gray-900 mb-2">{event?.name || 'Unknown Event'}</p>
                                       {Object.keys(customFields).length > 0 && (
                                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                           {Object.entries(customFields).map(([key, value]) => (
                                             <div key={key} className="flex flex-col bg-white p-2 rounded border border-gray-100">
                                               <span className="text-gray-500 font-medium mb-1 truncate" title={key}>{key}</span>
                                               <span className="text-gray-900 font-medium break-words">{String(value)}</span>
                                             </div>
                                           ))}
                                         </div>
                                       )}
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           );
                         })()}
                      </div>
                    </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 min-w-[140px]">
                        {!isActive ? (
                          <div className="flex flex-col">
                            <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                              <ShieldAlert className="h-4 w-4" /> Suspended
                            </div>
                            <button 
                              onClick={() => handleAccountStatusChange(profile.id, true)}
                              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 text-center mt-2 transition-colors"
                            >
                              Revert Decision
                            </button>
                          </div>
                        ) : screening.status === 'approved' ? (
                          <div className="flex flex-col">
                            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                              <CheckCircle className="h-4 w-4" /> Approved
                            </div>
                            <button 
                              onClick={() => handleStatusChange(profile.id, 'pending')}
                              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 text-center mt-2 transition-colors"
                            >
                              Revert Decision
                            </button>
                          </div>
                        ) : screening.status === 'rejected' ? (
                          <div className="flex flex-col">
                            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                              <XCircle className="h-4 w-4" /> Rejected
                            </div>
                            <button 
                              onClick={() => handleStatusChange(profile.id, 'pending')}
                              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 text-center mt-2 transition-colors"
                            >
                              Revert Decision
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStatusChange(profile.id, 'approved')}
                              className="w-full px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </button>
                            <button 
                              onClick={() => handleStatusChange(profile.id, 'rejected')}
                              className="w-full px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                            
                            <div className="w-full h-[1px] bg-gray-100 my-1"></div>
                            
                            <button 
                              onClick={() => handleAccountStatusChange(profile.id, false)}
                              className="w-full px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <ShieldAlert className="h-4 w-4" /> Suspend
                            </button>
                          </>
                        )}
                      </div>
                      
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
