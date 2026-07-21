import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X, Save, GraduationCap, DollarSign, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Program {
  id: string;
  university_id: string;
  program_name: string;
  degree_level: string;
  duration: string;
  tuition_fee: string;
  scholarships_available: boolean;
  application_deadline: string | null;
  admission_requirements: string;
}

const DEGREE_OPTIONS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'];

export function UniversityProgramsManager({ user }: { user: any }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    program_name: '',
    degree_level: '',
    duration: '',
    tuition_fee: '',
    scholarships_available: false,
    application_deadline: '',
    admission_requirements: ''
  });

  async function fetchPrograms() {
    setLoading(true);
    const { data, error } = await supabase
      .from('university_programs')
      .select('*')
      .eq('university_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPrograms(data as Program[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPrograms();
  }, [user.id]);

  const openModal = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        program_name: program.program_name,
        degree_level: program.degree_level || '',
        duration: program.duration || '',
        tuition_fee: program.tuition_fee || '',
        scholarships_available: program.scholarships_available,
        application_deadline: program.application_deadline || '',
        admission_requirements: program.admission_requirements || ''
      });
    } else {
      setEditingProgram(null);
      setFormData({
        program_name: '',
        degree_level: '',
        duration: '',
        tuition_fee: '',
        scholarships_available: false,
        application_deadline: '',
        admission_requirements: ''
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.program_name || !formData.degree_level) {
      setError('Program Name and Degree Level are required');
      setSaving(false);
      return;
    }

    const payload = {
      university_id: user.id,
      program_name: formData.program_name,
      degree_level: formData.degree_level,
      duration: formData.duration,
      tuition_fee: formData.tuition_fee,
      scholarships_available: formData.scholarships_available,
      application_deadline: formData.application_deadline || null,
      admission_requirements: formData.admission_requirements
    };

    if (editingProgram) {
      const { error: updateError } = await supabase
        .from('university_programs')
        .update(payload)
        .eq('id', editingProgram.id);
      
      if (updateError) {
        setError(updateError.message);
      } else {
        fetchPrograms();
        setIsModalOpen(false);
      }
    } else {
      const { error: insertError } = await supabase
        .from('university_programs')
        .insert([payload]);
      
      if (insertError) {
        setError(insertError.message);
      } else {
        fetchPrograms();
        setIsModalOpen(false);
      }
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      await supabase.from('university_programs').delete().eq('id', id);
      fetchPrograms();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Manage Academic Programs
            </h2>
            <p className="text-gray-500 text-sm mt-1">Add details about your courses to attract prospective students.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Program
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Programs Added Yet</h3>
            <p className="text-gray-500 mb-6">Start adding your academic programs to showcase them in your virtual booth.</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Program
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all group bg-white relative">
                
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(program)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(program.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pr-16">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{program.program_name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      {program.degree_level}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {program.duration || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {program.tuition_fee || 'Contact for info'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Program Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProgram ? 'Edit Program' : 'Add New Program'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <form id="program-form" onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.program_name}
                      onChange={e => setFormData({...formData, program_name: e.target.value})}
                      placeholder="e.g. B.Sc. Computer Science"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level *</label>
                      <select
                        required
                        value={formData.degree_level}
                        onChange={e => setFormData({...formData, degree_level: e.target.value})}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                      >
                        <option value="" disabled>Select degree...</option>
                        {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        placeholder="e.g. 4 Years"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Tuition Fee</label>
                      <input
                        type="text"
                        value={formData.tuition_fee}
                        onChange={e => setFormData({...formData, tuition_fee: e.target.value})}
                        placeholder="e.g. $15,000"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                      <input
                        type="date"
                        value={formData.application_deadline}
                        onChange={e => setFormData({...formData, application_deadline: e.target.value})}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Requirements</label>
                    <textarea
                      rows={3}
                      value={formData.admission_requirements}
                      onChange={e => setFormData({...formData, admission_requirements: e.target.value})}
                      placeholder="List GPA, language tests, portfolios, etc."
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 rounded-xl border border-blue-100 transition-colors hover:bg-blue-50">
                      <input
                        type="checkbox"
                        checked={formData.scholarships_available}
                        onChange={e => setFormData({...formData, scholarships_available: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                      />
                      <span className="text-sm font-semibold text-blue-900">Scholarships available for this program</span>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  form="program-form"
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Program'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
