import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Filter, 
  Download, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Save, 
  X, 
  Video, 
  Star,
  MoreVertical,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversityStudentManagerProps {
  user: any;
  boothId: string | null;
}

export function UniversityStudentManager({ user, boothId }: UniversityStudentManagerProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Edit State
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editScore, setEditScore] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [boothId]);

  const fetchLeads = async () => {
    if (!boothId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const { data, error } = await supabase
      .from('booth_leads')
      .select(`
        id,
        lead_score,
        is_relevant,
        tags,
        status,
        notes,
        created_at,
        guests (
          id,
          first_name,
          last_name,
          email,
          phone,
          custom_fields
        )
      `)
      .eq('booth_id', boothId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status || 'New');
    setEditScore(lead.lead_score || 3);
  };

  const handleSaveLeadDetails = async () => {
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
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === selectedLead.id 
          ? { ...l, notes: editNotes, status: editStatus, lead_score: editScore } 
          : l
      ));
      
      setSelectedLead({ ...selectedLead, notes: editNotes, status: editStatus, lead_score: editScore });
      
    } catch (err) {
      console.error("Error saving lead details:", err);
      alert("Failed to save lead details");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Score', 'Notes', 'Scanned At'];
    
    const rows = leads.map(l => {
      const g = l.guests;
      return [
        `"${g.first_name || ''}"`,
        `"${g.last_name || ''}"`,
        `"${g.email || ''}"`,
        `"${g.phone || ''}"`,
        `"${l.status || 'New'}"`,
        l.lead_score,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(l.created_at).toLocaleString()}"`
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

  const filteredLeads = leads.filter(l => {
    const nameMatch = `${l.guests?.first_name || ''} ${l.guests?.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (l.guests?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'All' || (l.status || 'New') === statusFilter;
    
    return (nameMatch || emailMatch) && statusMatch;
  });

  if (!boothId) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 font-display">No Booth Assigned</h2>
        <p className="text-gray-500">You must be assigned to an exhibition booth to manage student leads.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Main List */}
      <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${selectedLead ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Interested">Interested</option>
                <option value="Qualified">Qualified</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Enrolled">Enrolled</option>
              </select>
            </div>
            
            <button 
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p>Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No leads found</h3>
              <p className="text-gray-500 text-sm">Adjust your filters or scan more badges to see leads here.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const statusColor = 
                  lead.status === 'Qualified' ? 'bg-green-100 text-green-700 border-green-200' :
                  lead.status === 'Interested' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  lead.status === 'Meeting Scheduled' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  'bg-gray-100 text-gray-700 border-gray-200';
                  
                return (
                  <button
                    key={lead.id}
                    onClick={() => handleOpenLead(lead)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group flex items-center gap-4 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                    }`}>
                      {lead.guests.first_name?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 truncate">
                          {lead.guests.first_name} {lead.guests.last_name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor} whitespace-nowrap ml-2`}>
                          {lead.status || 'New'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-3">
                        <span className="truncate">{lead.guests.email}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {lead.lead_score}</span>
                      </div>
                    </div>
                    
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Side Panel for Details */}
      <AnimatePresence mode="wait">
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex-1 lg:max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${!selectedLead ? 'hidden' : 'flex'}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 font-display">Student Details</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              
              {/* Profile Info */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold font-display">
                    {selectedLead.guests.first_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedLead.guests.first_name} {selectedLead.guests.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">Scanned on {new Date(selectedLead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedLead.guests.email}`} className="hover:text-primary hover:underline">
                      {selectedLead.guests.email || 'No email provided'}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedLead.guests.phone}`} className="hover:text-primary hover:underline">
                      {selectedLead.guests.phone || 'No phone provided'}
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Qualification Form */}
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Qualification</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Lead Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
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
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Lead Score</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditScore(star)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          star <= editScore ? 'text-amber-400' : 'text-gray-200 hover:text-gray-300'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${star <= editScore ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Internal Notes</h4>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add details about student interests, budgets, etc..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none text-sm min-h-[120px] resize-y"
                />
              </div>
              
              {/* Custom Fields read-only */}
              {selectedLead.guests.custom_fields && Object.keys(selectedLead.guests.custom_fields).length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Survey Answers</h4>
                  <div className="grid gap-3 text-sm">
                    {Object.entries(selectedLead.guests.custom_fields).map(([key, value]) => {
                      if (key === 'Attendee Photo' || !value) return null;
                      return (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs text-gray-500 mb-1">{key}</span>
                          <span className="font-medium text-gray-900">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
              <button
                onClick={handleSaveLeadDetails}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <a 
                href={`mailto:${selectedLead.guests.email}?subject=Follow up from Lekkside Education Fair&body=Hi ${selectedLead.guests.first_name},%0D%0A%0D%0AIt was great connecting with you at the exhibition. Let's schedule a brief video call to discuss your academic goals further.%0D%0A%0D%0APlease join my virtual booth using this link when you are ready: http://localhost:8080/meetings/booth-${user?.id}%0D%0A%0D%0ABest regards,%0D%0A${user?.user_metadata?.full_name || 'University Representative'}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                <Video className="w-5 h-5" />
                Schedule Video Meeting
              </a>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
