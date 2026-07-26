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
    banner_url: '',
    description: '',
    website_url: '',
    brochure_url: '',
    programs: [] as string[],
    degree_levels: [] as string[],
    tuition_category: '',
    has_scholarship: false
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
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
        .select('university_name, full_name, location, contact_email, contact_phone, logo_url, banner_url, brochure_url, description, website_url, programs, degree_levels, tuition_category, has_scholarship')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setFormData({
          university_name: data.university_name || '',
          full_name: data.full_name || '',
          location: data.location || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          brochure_url: data.brochure_url || '',
          description: data.description || '',
          website_url: data.website_url || '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'brochure') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo' && file.size > 1024 * 1024) {
        alert("Logo image must be less than 1MB");
        return;
      }
      if (type === 'banner' && file.size > 3 * 1024 * 1024) {
        alert("Banner image must be less than 3MB");
        return;
      }
      if (type === 'brochure' && file.size > 10 * 1024 * 1024) {
        alert("Brochure must be less than 10MB");
        return;
      }
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === 'banner') {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      } else if (type === 'brochure') {
        setBrochureFile(file);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    let finalLogoUrl = formData.logo_url;
    let finalBannerUrl = formData.banner_url;
    let finalBrochureUrl = formData.brochure_url;

    if (logoFile) {
      setUploadingLogo(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
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

    if (bannerFile) {
      setUploadingBanner(true);
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `banner-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, bannerFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);
        finalBannerUrl = publicUrl;
      }
      setUploadingBanner(false);
    }

    if (brochureFile) {
      setUploadingBrochure(true);
      const fileExt = brochureFile.name.split('.').pop();
      const fileName = `brochure-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `brochures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, brochureFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);
        finalBrochureUrl = publicUrl;
      }
      setUploadingBrochure(false);
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
        banner_url: finalBannerUrl,
        brochure_url: finalBrochureUrl,
        description: formData.description,
        website_url: formData.website_url,
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
      setFormData(prev => ({ ...prev, logo_url: finalLogoUrl, banner_url: finalBannerUrl, brochure_url: finalBrochureUrl }));
      setBrochureFile(null); // Clear selected file after successful save
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
    return (
      <div className="p-16 text-center">
        <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto"></div>
      </div>
    );
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

      <div className="bg-gray-900 p-8 md:p-12 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-5 mb-10 pb-8 border-b border-gray-800">
          <div className="h-16 w-16 rounded-[1.25rem] bg-black flex items-center justify-center text-white border border-gray-800 shadow-inner">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Institution Profile</h2>
            <p className="text-gray-400 font-medium text-sm mt-1">This information will be displayed to students in the portal.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section: Basic Information */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white mb-6">Basic Information</h3>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                University / Institution Name
              </label>
              <input
                type="text"
                required
                value={formData.university_name}
                onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                placeholder="e.g. Stanford University"
                className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Contact / Representative Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Your full name"
                  className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="university@example.com"
                  className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Stanford, CA, United States"
                  className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                />
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3 font-bold">
                  The country will be extracted from this field for filtering. Please include the country name.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                University Logo
              </label>
              <div className="flex items-center gap-8">
                <div className="relative h-28 w-28 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center bg-black overflow-hidden shadow-inner">
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
                        className="absolute top-2 right-2 bg-black/80 backdrop-blur p-1.5 rounded-full text-white hover:text-red-400 transition-colors border border-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-10 w-10 text-gray-700" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-3 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-bold text-white hover:bg-gray-700 transition-colors shadow-sm">
                    <Upload className="h-4 w-4" />
                    UPLOAD LOGO
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3 font-bold">
                    Max file size: 1MB. Recommended format: PNG, JPG.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Booth Banner Image
              </label>
              <div className="flex items-center gap-8">
                <div className="relative h-28 w-56 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center bg-black overflow-hidden shadow-inner">
                  {(bannerPreview || formData.banner_url) ? (
                    <>
                      <img 
                        src={bannerPreview || formData.banner_url} 
                        alt="Banner Preview" 
                        className="h-full w-full object-cover opacity-80"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                          setFormData({...formData, banner_url: ''});
                        }}
                        className="absolute top-2 right-2 bg-black/80 backdrop-blur p-1.5 rounded-full text-white hover:text-red-400 transition-colors border border-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-10 w-10 text-gray-700" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-3 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-bold text-white hover:bg-gray-700 transition-colors shadow-sm">
                    <Upload className="h-4 w-4" />
                    UPLOAD BANNER
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'banner')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3 font-bold">
                    Max file size: 3MB. Recommended format: PNG, JPG (e.g. 1920x400).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                University Brochure (PDF)
              </label>
              <div className="flex items-center gap-8">
                <div className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center bg-black overflow-hidden shadow-inner p-2 text-center">
                  {(brochureFile || formData.brochure_url) ? (
                    <div className="flex flex-col items-center gap-1">
                      <BookOpen className="h-6 w-6 text-green-400" />
                      <span className="text-[10px] text-gray-300 font-medium truncate w-full max-w-full px-1">
                        {brochureFile ? brochureFile.name : 'Uploaded'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBrochureFile(null);
                          setFormData({...formData, brochure_url: ''});
                        }}
                        className="absolute top-1 right-1 bg-black/80 backdrop-blur p-1 rounded-full text-white hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <BookOpen className="h-8 w-8 text-gray-700" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-3 px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-bold text-white hover:bg-gray-700 transition-colors shadow-sm">
                    <Upload className="h-4 w-4" />
                    UPLOAD BROCHURE
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'brochure')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3 font-bold">
                    Max file size: 10MB. Format: PDF only. Students can download this from your booth.
                  </p>
                  {(brochureFile || formData.brochure_url) && (
                    <p className="text-xs text-green-400 mt-2 font-medium">
                      ✓ Brochure attached
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                University Description / About
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell students about your university, campus life, and what makes it special..."
                className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all resize-none placeholder-gray-600 font-medium custom-scrollbar"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                placeholder="https://www.example.edu"
                className="w-full rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
              />
            </div>
          </div>

          <hr className="border-gray-800" />

          {/* Section: Academic Offerings */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-gray-500" /> Academic Offerings
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Programs Offered (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-3">
                {PROGRAM_OPTIONS.map(program => (
                  <button
                    key={program}
                    type="button"
                    onClick={() => toggleArrayItem('programs', program)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                      formData.programs.includes(program)
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'bg-black text-gray-400 border-gray-800 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {program}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Degree Levels (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-3">
                {DEGREE_OPTIONS.map(degree => (
                  <button
                    key={degree}
                    type="button"
                    onClick={() => toggleArrayItem('degree_levels', degree)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                      formData.degree_levels.includes(degree)
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'bg-black text-gray-400 border-gray-800 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {degree}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-800" />

          {/* Section: Tuition & Scholarships */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-gray-500" /> Tuition & Scholarships
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Average Annual Tuition Fee
              </label>
              <select
                value={formData.tuition_category}
                onChange={(e) => setFormData({...formData, tuition_category: e.target.value})}
                className="w-full md:w-1/2 rounded-[1.25rem] bg-black border border-gray-800 px-5 py-4 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-gray-600">Select tuition range...</option>
                {TUITION_OPTIONS.map(tuition => (
                  <option key={tuition} value={tuition}>{tuition}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-5 cursor-pointer p-6 bg-black rounded-[1.5rem] border border-gray-800 transition-colors hover:border-gray-600 group">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <input 
                    type="checkbox" 
                    checked={formData.has_scholarship}
                    onChange={(e) => setFormData({...formData, has_scholarship: e.target.checked})}
                    className="appearance-none w-6 h-6 rounded border border-gray-600 checked:bg-white checked:border-white transition-colors cursor-pointer"
                  />
                  {formData.has_scholarship && <CheckCircle2 className="absolute w-4 h-4 text-black pointer-events-none" />}
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-900 rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors shadow-inner">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-white block">We offer scholarships to international students</span>
                    <span className="text-xs font-medium text-gray-500 tracking-wide mt-1 block">Checking this will highlight your institution to prospective students.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>


          <div className="pt-10 border-t border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={saving || uploadingLogo || uploadingBanner || uploadingBrochure}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-[1.25rem] font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:shadow-none"
            >
              <Save className="h-5 w-5" />
              {saving || uploadingLogo || uploadingBanner || uploadingBrochure ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
