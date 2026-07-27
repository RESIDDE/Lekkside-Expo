import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Search, Filter, Star, X, Loader2, Save, Download, Building2, Users, TrendingUp, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  ticket_type: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  custom_fields?: any;
}

interface BoothLead {
  id: string;
  booth_id: string;
  guest_id: string;
  is_relevant: boolean;
  lead_score: number;
  tags: string[];
  status?: string;
  notes?: string;
  created_at: string;
}

export function UniversityStudentManager({ user, boothId: passedBoothId }: { user: any, boothId?: string }) {
  const [resolvedBoothId, setResolvedBoothId] = useState<string | null>(passedBoothId || null);
  const [boothInfo, setBoothInfo] = useState<any>(null);
  
  const [attendees, setAttendees] = useState<Guest[]>([]);
  const [leads, setLeads] = useState<BoothLead[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'relevant' | 'not-relevant'>('all');
  const [loading, setLoading] = useState(true);

  // Edit State
  const [selectedLead, setSelectedLead] = useState<{lead: BoothLead, guest: Guest} | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editScore, setEditScore] = useState(3);
  const [saving, setSaving] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  // Resolve boothId by querying exhibition_booths directly
  useEffect(() => {
    if (!user?.id) return;

    const resolveBoothId = async () => {
      const { data: boothData } = await supabase
        .from('exhibition_booths')
        .select('id, booth_name, booth_number, event_id, events(name)')
        .eq('university_id', user.id)
        .order('created_at', { ascending: false });

      if (boothData && boothData.length > 0) {
        const first = boothData[0];
        setResolvedBoothId(first.id);
        setBoothInfo(first);
      } else if (passedBoothId) {
        setResolvedBoothId(passedBoothId);
      } else {
        setLoading(false);
      }
    };
    resolveBoothId();
  }, [user?.id, passedBoothId]);

  useEffect(() => {
    if (resolvedBoothId && boothInfo?.event_id) {
      loadBoothData();
    }
  }, [resolvedBoothId, boothInfo?.event_id]);

  const loadBoothData = async () => {
    try {
      setLoading(true);

      // First get all approved student emails
      const { data: approvedProfiles } = await supabase
        .from('profiles')
        .select('contact_email, student_screenings!inner(status)')
        .eq('role', 'student')
        .eq('student_screenings.status', 'approved');
        
      const approvedEmails = (approvedProfiles || [])
        .map(p => p.contact_email)
        .filter(Boolean);

      // Fetch all event attendees (guests) who are approved
      let guestsQuery = supabase
        .from('guests')
        .select('*')
        .eq('event_id', boothInfo.event_id)
        .order('last_name');
        
      if (approvedEmails.length > 0) {
        guestsQuery = guestsQuery.in('email', approvedEmails);
      } else {
        guestsQuery = guestsQuery.in('email', ['__nonexistent__']);
      }

      const { data: guests, error: guestsError } = await guestsQuery;

      if (guestsError) throw guestsError;
      setAttendees(guests || []);

      // Fetch booth leads
      const { data: boothLeads, error: leadsError } = await supabase
        .from('booth_leads')
        .select('*')
        .eq('booth_id', resolvedBoothId);

      if (leadsError) throw leadsError;
      setLeads(boothLeads || []);
    } catch (error) {
      console.error('Error loading booth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLeadRelevance = async (guestId: string, currentStatus: boolean) => {
    if (!resolvedBoothId) return;
    try {
      const existingLead = leads.find((l) => l.guest_id === guestId);

      if (existingLead) {
        const { error } = await supabase
          .from("booth_leads")
          .update({ is_relevant: !currentStatus })
          .eq("id", existingLead.id);
        if (error) throw error;
        
        setLeads(leads.map(l => l.id === existingLead.id ? { ...l, is_relevant: !currentStatus } : l));
      } else {
        const { data: newLead, error } = await supabase.from("booth_leads").insert({
          booth_id: resolvedBoothId,
          guest_id: guestId,
          is_relevant: true,
          lead_score: 3,
        }).select().single();
        if (error) throw error;
        
        setLeads([...leads, newLead]);
      }
    } catch (error) {
      console.error('Error updating relevance:', error);
    }
  };

  const handleOpenNotes = async (guest: Guest) => {
    if (!resolvedBoothId) return;
    let existingLead = leads.find((l) => l.guest_id === guest.id);
    
    if (!existingLead) {
      try {
        const { data: newLead, error } = await supabase.from("booth_leads").insert({
          booth_id: resolvedBoothId,
          guest_id: guest.id,
          is_relevant: false,
          lead_score: 3
        }).select().single();
        if (error) throw error;
        existingLead = newLead;
        setLeads([...leads, newLead]);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    if (existingLead) {
      setSelectedLead({ lead: existingLead, guest });
      setEditNotes(existingLead.notes || '');
      setEditStatus(existingLead.status || 'New');
      setEditScore(existingLead.lead_score || 3);
      setNotesDialogOpen(true);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('booth_leads')
        .update({
          notes: editNotes,
          status: editStatus,
          lead_score: editScore
        })
        .eq('id', selectedLead.lead.id);

      if (error) throw error;

      setLeads(leads.map(l => l.id === selectedLead.lead.id ? {
        ...l, notes: editNotes, status: editStatus, lead_score: editScore
      } : l));
      setNotesDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (filterType: "all" | "relevant" | "not-relevant") => {
    let dataToExport: Guest[] = [];

    if (filterType === "all") {
      dataToExport = attendees;
    } else if (filterType === "relevant") {
      const relevantGuestIds = leads.filter((l) => l.is_relevant).map((l) => l.guest_id);
      dataToExport = attendees.filter((a) => relevantGuestIds.includes(a.id));
    } else {
      const notRelevantGuestIds = leads.filter((l) => !l.is_relevant).map((l) => l.guest_id);
      dataToExport = attendees.filter((a) => notRelevantGuestIds.includes(a.id));
    }

    if (dataToExport.length === 0) return;

    const headers = ["First Name", "Last Name", "Email", "Phone", "Ticket Type", "Checked In", "Score", "Notes"];
    
    const rows = dataToExport.map((guest) => {
      const lead = leads.find(l => l.guest_id === guest.id);
      return [
        `"${guest.first_name || ''}"`,
        `"${guest.last_name || ''}"`,
        `"${guest.email || ''}"`,
        `"${guest.phone || ''}"`,
        `"${guest.ticket_type || 'Standard'}"`,
        guest.checked_in ? "Yes" : "No",
        lead?.lead_score || '',
        `"${(lead?.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      (attendee.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attendee.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attendee.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;

    const lead = leads.find((l) => l.guest_id === attendee.id);
    if (filterStatus === "relevant") {
      return matchesSearch && lead?.is_relevant === true;
    }
    if (filterStatus === "not-relevant") {
      return matchesSearch && lead?.is_relevant === false;
    }
    return matchesSearch;
  });

  const relevantCount = leads.filter((l) => l.is_relevant).length;
  const notRelevantCount = leads.filter((l) => !l.is_relevant).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!resolvedBoothId) {
    return (
      <div className="bg-gray-900 p-16 text-center rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="w-20 h-20 bg-black rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-gray-500 border border-gray-800 shadow-inner">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">No Booth Assigned</h2>
        <p className="text-gray-400 font-medium max-w-md mx-auto">You must be assigned to an exhibition booth to manage student leads.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booth Info Banner */}
      {boothInfo && (
        <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-black flex items-center justify-center shadow-inner border border-gray-800">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Assigned Booth</p>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {boothInfo.booth_name} <span className="text-gray-500 font-medium">| Booth {boothInfo.booth_number}</span>
              </h1>
              {boothInfo.events?.name && <p className="text-sm font-bold text-gray-400 mt-1">{boothInfo.events.name}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-[2rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:bg-white/10"></div>
          <div className="flex flex-col gap-3 relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <div className="p-1.5 bg-black rounded-lg border border-gray-800"><Users className="w-4 h-4 text-white" /></div> TOTAL ATTENDEES
            </p>
            <p className="text-5xl font-bold text-white tracking-tighter">{attendees.length}</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-[2rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:bg-emerald-500/20"></div>
          <div className="flex flex-col gap-3 relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Star className="w-4 h-4 text-emerald-400" /></div> RELEVANT LEADS
            </p>
            <p className="text-5xl font-bold text-white tracking-tighter">{relevantCount}</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-[2rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:bg-orange-500/20"></div>
          <div className="flex flex-col gap-3 relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20"><TrendingUp className="w-4 h-4 text-orange-400" /></div> NOT RELEVANT
            </p>
            <p className="text-5xl font-bold text-white tracking-tighter">{notRelevantCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Event Attendees</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search attendees..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-black border border-gray-800 rounded-[1.25rem] focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none text-white placeholder-gray-600 font-medium transition-all"
              />
            </div>
            
            <button 
              onClick={() => handleExport("all")}
              className="flex items-center gap-3 px-6 py-3.5 bg-white text-black rounded-[1.25rem] font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0"
            >
              <Download className="w-4 h-4" /> EXPORT
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Custom Tabs */}
          <div className="flex p-1.5 bg-black border border-gray-800 rounded-[1.5rem] mb-8 shadow-inner">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filterStatus === 'all' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
            >
              All ({attendees.length})
            </button>
            <button
              onClick={() => setFilterStatus('relevant')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filterStatus === 'relevant' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
            >
              Relevant ({relevantCount})
            </button>
            <button
              onClick={() => setFilterStatus('not-relevant')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filterStatus === 'not-relevant' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
            >
              Not Relevant ({notRelevantCount})
            </button>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-gray-800 bg-black shadow-inner">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-800">
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name</th>
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</th>
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone</th>
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ticket Type</th>
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-transparent text-sm">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-500 font-medium">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-900 rounded-full border border-gray-800"><Filter className="w-6 h-6" /></div>
                        No attendees found matching your criteria.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((attendee) => {
                    const lead = leads.find((l) => l.guest_id === attendee.id);
                    return (
                      <tr key={attendee.id} className="hover:bg-gray-900/50 transition-colors group">
                        <td className="p-5">
                          <div className="font-bold text-white text-base tracking-wide">{attendee.first_name} {attendee.last_name}</div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {lead?.is_relevant && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest">
                                <Star className="w-3 h-3 fill-current" /> RELEVANT
                              </span>
                            )}
                            {lead?.notes && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest">
                                <StickyNote className="w-3 h-3" /> NOTE ADDED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-gray-400 font-medium">{attendee.email}</td>
                        <td className="p-5 text-gray-400 font-medium">{attendee.phone || '-'}</td>
                        <td className="p-5">
                          <span className="inline-block px-3 py-1.5 rounded-full border border-gray-700 bg-gray-800 text-[10px] font-bold text-white uppercase tracking-widest shadow-inner">
                            {attendee.ticket_type || 'STANDARD'}
                          </span>
                        </td>
                        <td className="p-5">
                          {attendee.checked_in ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-inner">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> CHECKED IN
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-full border border-gray-800 bg-black text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-inner">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleLeadRelevance(attendee.id, lead?.is_relevant || false)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-inner ${
                                lead?.is_relevant 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-black border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${lead?.is_relevant ? 'fill-current' : ''}`} />
                              {lead?.is_relevant ? 'RELEVANT' : 'MARK RELEVANT'}
                            </button>
                            
                            <button
                              onClick={() => handleOpenNotes(attendee)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-700 transition-colors shadow-inner"
                            >
                              <StickyNote className="w-3.5 h-3.5" /> NOTES
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes Dialog */}
      <AnimatePresence>
        {notesDialogOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotesDialogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-8 border-b border-gray-800 bg-black">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">LEAD DETAILS</h3>
                  <p className="text-sm text-gray-400 font-bold tracking-wide mt-1">{selectedLead.guest.first_name} {selectedLead.guest.last_name}</p>
                </div>
                <button 
                  onClick={() => setNotesDialogOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors border border-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Lead Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-4 bg-black border border-gray-800 rounded-[1.25rem] focus:ring-2 focus:ring-white/20 outline-none text-white font-medium appearance-none cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                    <option value="Enrolled">Enrolled</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Lead Score</label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditScore(star)}
                        className={`p-3 rounded-[1rem] transition-all border ${
                          star <= editScore 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-inner' 
                            : 'bg-black text-gray-700 border-gray-800 hover:bg-gray-900 hover:text-gray-500'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${star <= editScore ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Internal Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add details about student interests, budgets, etc..."
                    className="w-full p-5 bg-black border border-gray-800 rounded-[1.25rem] focus:ring-2 focus:ring-white/20 outline-none text-white placeholder-gray-600 min-h-[160px] resize-y custom-scrollbar"
                  />
                </div>
              </div>

              <div className="p-8 border-t border-gray-800 bg-black">
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-[1.25rem] font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
