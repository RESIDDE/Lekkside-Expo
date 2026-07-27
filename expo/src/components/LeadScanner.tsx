import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { X, User, Mail, Phone, Star, Save, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadScannerProps {
  boothId: string;
}

export function LeadScanner({ boothId }: LeadScannerProps) {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Lead Form State
  const [leadScore, setLeadScore] = useState<number>(3);
  const [isRelevant, setIsRelevant] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Only initialize scanner if we aren't showing a student modal
    if (scannedId) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        // Stop scanning when a code is detected
        setScannedId(decodedText);
        scanner.clear();
      },
      () => {
        // Ignored, just means no code found yet in the frame
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [scannedId]);

  useEffect(() => {
    if (!scannedId) return;

    async function fetchStudent() {
      setLoading(true);
      setError('');
      try {
        let query = supabase.from('guests').select('*');
        if (scannedId && scannedId.startsWith('LEKK-')) {
          // If we scan an old ticket, we can't easily find it since we don't store confirmationNumber
          throw new Error("Old ticket format detected. Please manually enter the lead or have the student refresh their ticket.");
        } else if (scannedId) {
          query = query.eq('id', scannedId);
        }

        const { data, error: dbError } = await query.single();

        if (dbError || !data) {
          throw new Error("Student not found. Invalid badge.");
        }

        // Check if student is approved
        if (data.email) {
           const { data: approvedProfile } = await supabase
             .from('profiles')
             .select('student_screenings!inner(status)')
             .eq('contact_email', data.email)
             .eq('student_screenings.status', 'approved')
             .maybeSingle();
             
           if (!approvedProfile) {
             throw new Error("This student's registration has not been approved yet.");
           }
        }

        setStudent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load student details.");
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [scannedId]);

  const handleSaveLead = async () => {
    if (!student || !boothId) return;
    setSaving(true);
    
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (notes.trim()) {
        tagArray.push(`Note: ${notes.trim()}`);
      }
      
      // Upsert into booth_leads (handles if already scanned)
      const { error: upsertError } = await supabase
        .from('booth_leads')
        .upsert({
          booth_id: boothId,
          guest_id: student.id,
          lead_score: leadScore,
          is_relevant: isRelevant,
          tags: tagArray
        }, { onConflict: 'booth_id, guest_id' });

      if (upsertError) throw upsertError;
      
      // Also save notes into lead_notes if provided (simplified by just appending to notes table if needed, 
      // but without exhibitor_id it might fail. Let's just rely on tags/score for now).
      
      setSuccess(true);
      setTimeout(() => {
        resetScanner();
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to save lead.");
    } finally {
      setSaving(false);
    }
  };

  const resetScanner = () => {
    setScannedId(null);
    setStudent(null);
    setError('');
    setSuccess(false);
    setLeadScore(3);
    setIsRelevant(true);
    setTags('');
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full bg-gray-900 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-gray-800 overflow-hidden p-8 mb-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <h2 className="text-3xl font-bold text-white mb-4 text-center tracking-tight">Scan Student Badge</h2>
        <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto font-medium">
          Position the student's QR code within the frame to instantly pull up their profile and capture them as a lead.
        </p>
        
        {!scannedId && (
          <div className="w-full max-w-md mx-auto overflow-hidden rounded-[2rem] border-2 border-gray-800 bg-black shadow-inner p-2">
            <div 
              id="reader" 
              className="w-full rounded-[1.5rem] overflow-hidden text-gray-300 [&_a]:text-blue-400 [&_a]:underline hover:[&_a]:text-blue-300 [&_select]:text-black [&_select]:rounded-lg [&_select]:px-2 [&_select]:py-1 [&_button]:bg-gray-800 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-xl [&_button]:border [&_button]:border-gray-700 hover:[&_button]:bg-gray-700 transition-colors"
            ></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {scannedId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-gray-900 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800 overflow-hidden relative"
          >
            <button 
              onClick={resetScanner}
              className="absolute top-6 right-6 p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors z-10 bg-black border border-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-6" />
                <p className="text-gray-400 font-bold tracking-wide">Loading student profile...</p>
              </div>
            ) : error ? (
              <div className="p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <X className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Scan Failed</h3>
                <p className="text-gray-400 mb-8 font-medium max-w-sm">{error}</p>
                <button 
                  onClick={resetScanner}
                  className="px-8 py-3.5 bg-white text-black rounded-[1.25rem] font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  TRY AGAIN
                </button>
              </div>
            ) : success ? (
              <div className="p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Lead Captured!</h3>
                <p className="text-gray-400 font-medium max-w-sm">
                  <span className="text-white font-bold">{student.first_name} {student.last_name}</span> has been added to your qualified leads.
                </p>
              </div>
            ) : student && (
              <div className="p-0">
                <div className="bg-black p-8 border-b border-gray-800 flex items-start gap-6">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-gray-900 border border-gray-800 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                    <User className="w-10 h-10" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                      {student.first_name} {student.last_name}
                    </h3>
                    <div className="flex flex-wrap gap-5 mt-3 text-sm text-gray-400 font-medium">
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Student Custom Fields Display */}
                  {student.custom_fields && (
                    <div className="bg-black rounded-[2rem] p-6 border border-gray-800 shadow-inner">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Student Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Object.entries(student.custom_fields).map(([key, value]) => {
                          if (key === 'Attendee Photo' || !value) return null;
                          return (
                            <div key={key}>
                              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{key}</span>
                              <span className="block text-sm font-bold text-white">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lead Capture Form */}
                  <div className="space-y-6 pt-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-3">Qualification</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Lead Rating</label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setLeadScore(star)}
                            className={`p-3 rounded-[1rem] transition-all border ${
                              star <= leadScore 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-inner' 
                                : 'bg-black text-gray-700 border-gray-800 hover:bg-gray-800 hover:text-gray-500'
                            }`}
                          >
                            <Star className={`w-8 h-8 ${star <= leadScore ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isRelevant"
                        checked={isRelevant}
                        onChange={(e) => setIsRelevant(e.target.checked)}
                        className="w-5 h-5 bg-black border-gray-700 rounded focus:ring-white/20 text-white cursor-pointer accent-white"
                      />
                      <label htmlFor="isRelevant" className="text-sm font-bold text-white cursor-pointer">
                        Mark as Relevant / Qualified
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Tags (comma separated)</label>
                      <input 
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g. STEM, High Budget, Scholarship Needed"
                        className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-3.5 focus:ring-2 focus:ring-white/20 outline-none text-white placeholder-gray-600 font-medium shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-4 border-t border-gray-800">
                    <button 
                      onClick={resetScanner}
                      className="px-6 py-3.5 font-bold text-[10px] text-white uppercase tracking-widest bg-black border border-gray-800 hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleSaveLead}
                      disabled={saving}
                      className="flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'SAVING...' : 'SAVE LEAD'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
