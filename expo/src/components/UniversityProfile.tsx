import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Save, Upload, X } from 'lucide-react';

export function UniversityProfile({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    university_name: '',
    full_name: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    logo_url: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('university_name, full_name, location, contact_email, contact_phone, logo_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setFormData({
          university_name: data.university_name || '',
          full_name: data.full_name || '',
          location: data.location || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          logo_url: data.logo_url || ''
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
    
    await supabase
      .from('profiles')
      .update({
        university_name: formData.university_name,
        full_name: formData.full_name,
        location: formData.location,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        logo_url: finalLogoUrl
      })
      .eq('user_id', user.id);
      
    setFormData(prev => ({ ...prev, logo_url: finalLogoUrl }));
    setSaving(false);
    // Could add a toast here
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">University Profile</h2>
            <p className="text-gray-500 text-sm">Update your institution's details</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
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
            <p className="text-xs text-gray-500 mt-2">
              This name will be displayed in the dropdown for students when they apply.
            </p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                placeholder="university@example.com"
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


          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              <Save className="h-5 w-5" />
              {saving || uploadingLogo ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
