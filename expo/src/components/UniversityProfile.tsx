import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Save, Upload, X, BookOpen, DollarSign, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const PROGRAM_OPTIONS = ['Engineering', 'Business', 'Arts & Humanities', 'Computer Science', 'Medicine', 'Law', 'Sciences'];
const DEGREE_OPTIONS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'];
const TUITION_OPTIONS = ['< $10,000', '$10,000 - $20,000', '$20,000 - $30,000', '> $30,000'];

export function UniversityProfile({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    university_name: '',
    full_name: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    programs: [] as string[],
    degree_levels: [] as string[],
    tuition_category: '',
    has_scholarship: false
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('university_name, full_name, location, contact_email, contact_phone, logo_url, programs, degree_levels, tuition_category, has_scholarship')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setFormData({
          university_name: data.university_name || '',
          full_name: data.full_name || '',
          location: data.location || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          logo_url: data.logo_url || '',
          programs: data.programs || [],
          degree_levels: data.degree_levels || [],
          tuition_category: data.tuition_category || '',
          has_scholarship: data.has_scholarship || false
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Logo image must be less than 1MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    let finalLogoUrl = formData.logo_url;

    if (logoFile) {
      setUploadingLogo(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, logoFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);
        finalLogoUrl = publicUrl;
      }
      setUploadingLogo(false);
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'university',
        university_name: formData.university_name,
        full_name: formData.full_name,
        location: formData.location,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        logo_url: finalLogoUrl,
        programs: formData.programs,
        degree_levels: formData.degree_levels,
        tuition_category: formData.tuition_category,
        has_scholarship: formData.has_scholarship
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error(updateError);
      setToast({ message: 'Failed to save profile. Please try again.', type: 'error' });
    } else {
      setFormData(prev => ({ ...prev, logo_url: finalLogoUrl }));
      setToast({ message: 'Profile saved successfully!', type: 'success' });
    }
    setSaving(false);
  };

  const toggleArrayItem = (field: 'programs' | 'degree_levels', item: string) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(item)) {
        return { ...prev, [field]: array.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...array, item] };
      }
    });
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl z-50 text-white font-medium ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-4 opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Institution Profile</h2>
            <p className="text-gray-500 text-sm">This information will be displayed to students in the portal.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section: Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University / Institution Name
              </label>
              <input
                type="text"
                required
                value={formData.university_name}
                onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                placeholder="e.g. Stanford University"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact / Representative Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / Address
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Stanford, CA, United States"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                The country will be extracted from this field for filtering. Please include the country name.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                  {(logoPreview || formData.logo_url) ? (
                    <>
                      <img 
                        src={logoPreview || formData.logo_url} 
                        alt="Logo Preview" 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                          setFormData({...formData, logo_url: ''});
                        }}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Max file size: 1MB. Recommended format: PNG, JPG.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Academic Offerings */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" /> Academic Offerings
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Programs Offered (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-3">
                {PROGRAM_OPTIONS.map(program => (
                  <button
                    key={program}
                    type="button"
                    onClick={() => toggleArrayItem('programs', program)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      formData.programs.includes(program)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {program}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Degree Levels (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-3">
                {DEGREE_OPTIONS.map(degree => (
                  <button
                    key={degree}
                    type="button"
                    onClick={() => toggleArrayItem('degree_levels', degree)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      formData.degree_levels.includes(degree)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {degree}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Tuition & Scholarships */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500" /> Tuition & Scholarships
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Annual Tuition Fee
              </label>
              <select
                value={formData.tuition_category}
                onChange={(e) => setFormData({...formData, tuition_category: e.target.value})}
                className="w-full md:w-1/2 rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
              >
                <option value="" disabled>Select tuition range...</option>
                {TUITION_OPTIONS.map(tuition => (
                  <option key={tuition} value={tuition}>{tuition}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 rounded-xl border border-blue-100 transition-colors hover:bg-blue-50">
                <input 
                  type="checkbox" 
                  checked={formData.has_scholarship}
                  onChange={(e) => setFormData({...formData, has_scholarship: e.target.checked})}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-semibold text-blue-900 block">We offer scholarships to international students</span>
                    <span className="text-xs text-blue-700">Checking this will highlight your institution to prospective students.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>


          <div className="pt-8 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:shadow-none"
            >
              <Save className="h-5 w-5" />
              {saving || uploadingLogo ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
