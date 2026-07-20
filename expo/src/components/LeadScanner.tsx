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
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center font-display">Scan Student Badge</h2>
        <p className="text-gray-500 text-center mb-6 max-w-lg mx-auto">
          Position the student's QR code within the frame to instantly pull up their profile and capture them as a lead.
        </p>
        
        {!scannedId && (
          <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-gray-300">
            <div id="reader" className="w-full"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {scannedId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative"
          >
            <button 
              onClick={resetScanner}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading student profile...</p>
              </div>
            ) : error ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Scan Failed</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button 
                  onClick={resetScanner}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : success ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">Lead Captured!</h3>
                <p className="text-gray-500">
                  {student.first_name} {student.last_name} has been added to your qualified leads.
                </p>
              </div>
            ) : student && (
              <div className="p-0">
                <div className="bg-primary/5 p-6 border-b border-gray-100 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 font-display">
                      {student.first_name} {student.last_name}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      {student.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Student Custom Fields Display */}
                  {student.custom_fields && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Student Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(student.custom_fields).map(([key, value]) => {
                          if (key === 'Attendee Photo' || !value) return null;
                          return (
                            <div key={key}>
                              <span className="block text-xs text-gray-500 mb-1">{key}</span>
                              <span className="block text-sm font-medium text-gray-900">{String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lead Capture Form */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Qualification</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lead Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setLeadScore(star)}
                            className={`p-2 rounded-lg transition-colors ${
                              star <= leadScore 
                                ? 'text-amber-400 hover:bg-amber-50' 
                                : 'text-gray-300 hover:bg-gray-50'
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
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="isRelevant" className="text-sm font-medium text-gray-700">
                        Mark as Relevant / Qualified
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                      <input 
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g. STEM, High Budget, Scholarship Needed"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={resetScanner}
                      className="px-6 py-3 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveLead}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-70 shadow-sm shadow-primary/20"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {saving ? 'Saving...' : 'Save Lead'}
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
