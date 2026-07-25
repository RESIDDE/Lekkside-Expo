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
      <div className="bg-gray-900 p-8 md:p-12 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-black rounded-xl border border-gray-800 shadow-inner">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              Manage Academic Programs
            </h2>
            <p className="text-gray-400 font-medium text-sm mt-3">Add details about your courses to attract prospective students.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-[1.25rem] font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0"
          >
            <Plus className="w-5 h-5" />
            ADD PROGRAM
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-gray-800 rounded-[2rem] bg-black shadow-inner">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Programs Added Yet</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">Start adding your academic programs to showcase them in your virtual booth.</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-gray-900 border border-gray-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              ADD YOUR FIRST PROGRAM
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="border border-gray-800 rounded-[1.5rem] p-6 hover:border-gray-600 hover:shadow-xl transition-all group bg-black relative shadow-inner">
                
                <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(program)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(program.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pr-20">
                  <h3 className="font-bold text-xl text-white leading-tight mb-2 tracking-wide">{program.program_name}</h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-2 text-gray-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                      {program.degree_level}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-600" />
                      {program.duration || 'N/A'}
                    </span>
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-gray-600" />
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
              className="relative w-full max-w-2xl bg-gray-900 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col border border-gray-800"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800 bg-black">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {editingProgram ? 'EDIT PROGRAM' : 'ADD NEW PROGRAM'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="mb-8 p-4 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-3 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <form id="program-form" onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Program Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.program_name}
                      onChange={e => setFormData({...formData, program_name: e.target.value})}
                      placeholder="e.g. B.Sc. Computer Science"
                      className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Degree Level *</label>
                      <select
                        required
                        value={formData.degree_level}
                        onChange={e => setFormData({...formData, degree_level: e.target.value})}
                        className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-gray-600">Select degree...</option>
                        {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        placeholder="e.g. 4 Years"
                        className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Annual Tuition Fee</label>
                      <input
                        type="text"
                        value={formData.tuition_fee}
                        onChange={e => setFormData({...formData, tuition_fee: e.target.value})}
                        placeholder="e.g. $15,000"
                        className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all placeholder-gray-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Application Deadline</label>
                      <input
                        type="date"
                        value={formData.application_deadline}
                        onChange={e => setFormData({...formData, application_deadline: e.target.value})}
                        className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all font-medium [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admission Requirements</label>
                    <textarea
                      rows={4}
                      value={formData.admission_requirements}
                      onChange={e => setFormData({...formData, admission_requirements: e.target.value})}
                      placeholder="List GPA, language tests, portfolios, etc."
                      className="w-full rounded-xl bg-black border border-gray-800 px-5 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-gray-600 outline-none transition-all resize-none placeholder-gray-600 font-medium custom-scrollbar"
                    ></textarea>
                  </div>

                  <div>
                    <label className="flex items-center gap-4 cursor-pointer p-5 bg-black rounded-xl border border-gray-800 transition-colors hover:border-gray-600 group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          type="checkbox"
                          checked={formData.scholarships_available}
                          onChange={e => setFormData({...formData, scholarships_available: e.target.checked})}
                          className="appearance-none w-5 h-5 rounded border border-gray-600 checked:bg-white checked:border-white transition-colors cursor-pointer"
                        />
                        {formData.scholarships_available && <div className="absolute w-2 h-2 bg-black rounded-sm pointer-events-none" />}
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide">Scholarships available for this program</span>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-8 py-6 border-t border-gray-800 bg-black flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3.5 text-white font-bold text-xs uppercase tracking-widest hover:bg-gray-800 rounded-xl transition-colors border border-gray-800"
                >
                  CANCEL
                </button>
                <button
                  form="program-form"
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'SAVING...' : 'SAVE PROGRAM'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
