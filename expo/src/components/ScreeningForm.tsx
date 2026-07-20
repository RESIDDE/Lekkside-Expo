import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  Upload, 
  GraduationCap, 
  Globe2,
  BookOpen,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export function ScreeningForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Academic Profile
  const [gpa, setGpa] = useState('');
  const [qualification, setQualification] = useState('');
  const [intendedCourse, setIntendedCourse] = useState('');

  // Study Preferences
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [scholarship, setScholarship] = useState('yes');

  // English Proficiency
  const [englishTest, setEnglishTest] = useState('ielts');
  const [englishScore, setEnglishScore] = useState('');

  // Documents
  const [transcripts, setTranscripts] = useState<File | null>(null);
  const [passport, setPassport] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  
  const [existingTranscripts, setExistingTranscripts] = useState<string | null>(null);
  const [existingPassport, setExistingPassport] = useState<string | null>(null);
  const [existingCv, setExistingCv] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('student_screenings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data && !error) {
        setGpa(data.gpa || '');
        setQualification(data.highest_qualification || '');
        setIntendedCourse(data.intended_course || '');
        setDestination(data.preferred_destination || '');
        setBudget(data.budget || '');
        setScholarship(data.scholarship || 'yes');
        setEnglishTest(data.english_test || 'none');
        setEnglishScore(data.english_score || '');
        setExistingTranscripts(data.transcripts_url);
        setExistingPassport(data.passport_url);
        setExistingCv(data.cv_url);
        setStatus(data.status);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("You must be logged in to submit this form.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const uploadFile = async (file: File | null, prefix: string): Promise<string | null> => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${prefix}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student_documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('student_documents')
          .getPublicUrl(filePath);

        return data.publicUrl;
      };

      const transcriptsUrl = await uploadFile(transcripts, 'transcripts') || existingTranscripts;
      const passportUrl = await uploadFile(passport, 'passport') || existingPassport;
      const cvUrl = await uploadFile(cv, 'cv') || existingCv;

      const { error: upsertError } = await supabase
        .from('student_screenings')
        .upsert({
          user_id: userId,
          gpa,
          highest_qualification: qualification,
          intended_course: intendedCourse,
          preferred_destination: destination,
          budget,
          scholarship,
          english_test: englishTest,
          english_score: englishScore,
          transcripts_url: transcriptsUrl,
          passport_url: passportUrl,
          cv_url: cvUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting screening:', err);
      setError(err.message || 'An error occurred while submitting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
        <div className="h-20 w-20 mx-auto bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Screening Submitted!</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Thank you for submitting your profile. Universities will now be able to review your details and connect with you at the expo.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
        >
          View Submission
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Student Screening Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete this form to help universities understand your academic background and preferences.
          </p>
        </div>
        {status && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${
            status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
            status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {status}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-10">
        
        {/* Academic Profile */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h3 className="text-md font-bold text-gray-900">Academic Profile</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Highest Qualification</label>
              <select 
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50 appearance-none"
                required
              >
                <option value="">Select qualification</option>
                <option value="high_school">High School Diploma</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Current GPA / Grade</label>
              <input 
                type="text" 
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="e.g. 3.8/4.0 or A Level AAA"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Intended Course of Study</label>
              <input 
                type="text" 
                value={intendedCourse}
                onChange={(e) => setIntendedCourse(e.target.value)}
                placeholder="e.g. Computer Science, Business Administration"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                required
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Study Preferences */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Globe2 className="h-4 w-4" />
            </div>
            <h3 className="text-md font-bold text-gray-900">Study Preferences</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Preferred Destination</label>
              <select 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50 appearance-none"
                required
              >
                <option value="">Select destination</option>
                <option value="uk">United Kingdom</option>
                <option value="us">United States</option>
                <option value="canada">Canada</option>
                <option value="australia">Australia</option>
                <option value="europe">Europe (Other)</option>
                <option value="asia">Asia</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Annual Budget (Tuition + Living)</label>
              <select 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50 appearance-none"
                required
              >
                <option value="">Select budget range</option>
                <option value="under_10k">Under $10,000</option>
                <option value="10k_20k">$10,000 - $20,000</option>
                <option value="20k_30k">$20,000 - $30,000</option>
                <option value="30k_50k">$30,000 - $50,000</option>
                <option value="above_50k">Above $50,000</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Are you seeking a scholarship?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="scholarship" 
                    value="yes"
                    checked={scholarship === 'yes'}
                    onChange={(e) => setScholarship(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Yes, it's essential</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="scholarship" 
                    value="preferred"
                    checked={scholarship === 'preferred'}
                    onChange={(e) => setScholarship(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Yes, but not essential</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="scholarship" 
                    value="no"
                    checked={scholarship === 'no'}
                    onChange={(e) => setScholarship(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm text-gray-700">No, I am self-funded</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* English Proficiency */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="text-md font-bold text-gray-900">English Proficiency</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Test Taken / Planned</label>
              <select 
                value={englishTest}
                onChange={(e) => setEnglishTest(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50 appearance-none"
              >
                <option value="none">None</option>
                <option value="ielts">IELTS</option>
                <option value="toefl">TOEFL</option>
                <option value="pte">PTE</option>
                <option value="duolingo">Duolingo</option>
              </select>
            </div>
            
            {englishTest !== 'none' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Overall Score (if known)</label>
                <input 
                  type="text" 
                  value={englishScore}
                  onChange={(e) => setEnglishScore(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50/50"
                />
              </div>
            )}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Documents Upload */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-md font-bold text-gray-900">Document Upload</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Transcripts */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Transcripts</label>
              <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setTranscripts(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
                <div className="text-center p-4">
                  <Upload className="mx-auto h-6 w-6 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-xs text-gray-500 font-medium line-clamp-1 px-2">
                    {transcripts ? transcripts.name : existingTranscripts ? 'Replace Transcripts' : 'Upload Transcripts'}
                  </span>
                </div>
              </div>
              {existingTranscripts && !transcripts && (
                <a href={existingTranscripts} target="_blank" rel="noreferrer" className="block text-xs text-primary mt-1 hover:underline text-center">
                  View Current File
                </a>
              )}
            </div>

            {/* Passport */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Passport Copy</label>
              <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setPassport(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="text-center p-4">
                  <Upload className="mx-auto h-6 w-6 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-xs text-gray-500 font-medium line-clamp-1 px-2">
                    {passport ? passport.name : existingPassport ? 'Replace Passport' : 'Upload Passport'}
                  </span>
                </div>
              </div>
              {existingPassport && !passport && (
                <a href={existingPassport} target="_blank" rel="noreferrer" className="block text-xs text-primary mt-1 hover:underline text-center">
                  View Current File
                </a>
              )}
            </div>

            {/* CV */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">CV / Resume</label>
              <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
                <div className="text-center p-4">
                  <Upload className="mx-auto h-6 w-6 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-xs text-gray-500 font-medium line-clamp-1 px-2">
                    {cv ? cv.name : existingCv ? 'Replace CV' : 'Upload CV'}
                  </span>
                </div>
              </div>
              {existingCv && !cv && (
                <a href={existingCv} target="_blank" rel="noreferrer" className="block text-xs text-primary mt-1 hover:underline text-center">
                  View Current File
                </a>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Submit Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
