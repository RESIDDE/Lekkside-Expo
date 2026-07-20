import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Save } from 'lucide-react';

export function UniversityProfile({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    university_name: '',
    full_name: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('university_name, full_name')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setFormData({
          university_name: data.university_name || '',
          full_name: data.full_name || ''
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    await supabase
      .from('profiles')
      .update({
        university_name: formData.university_name,
        full_name: formData.full_name
      })
      .eq('user_id', user.id);
      
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

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
