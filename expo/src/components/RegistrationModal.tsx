import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Loader2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Check,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import RegistrationTicket from './RegistrationTicket';
import gsap from 'gsap';

interface EventForm {
  id: string;
  event_id: string;
  name: string;
  custom_fields: any;
  is_active: boolean;
  is_default?: boolean; // May be missing in DB, handled by logic
}

interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const COUNTRIES_LIST = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

const EDUCATION_LEVELS = ["O'Level", "A'level", "National Diploma", "Higher National Diploma", "B.Sc. Degree", "Masters", "PhD"];
const STUDY_LEVELS = ["Certificate", "Diploma", "B.Sc. Degree", "Masters", "PhD", "Others"];
const BUDGET_RANGES = ["< $10,000", "$10,000 - $20,000", "$20,000 - $30,000", "$30,000 - $40,000", "$40,000+"];
const FUNDING_SOURCES = ["Self-Funded", "Parent/Guardian", "Scholarship", "Sponsor", "Education Loan"];
const START_DATES = ["Immediately", "March 2026", "May 2026", "July 2026", "September 2026", "January 2027", "May 2027", "September 2027"];
const SOURCES = ["Social Media", "Friend/Family", "Newspaper", "Radio/TV", "Email", "Web Search", "Other"];

interface RegistrationModalProps {
  event: any;
  onClose: () => void;
}

export function RegistrationModal({ event, onClose }: RegistrationModalProps) {
  const [form, setForm] = useState<EventForm | null>(null);
  const [availableForms, setAvailableForms] = useState<EventForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [allEvents, setAllEvents] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  
  // Registration data for ticket
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [registeredAt, setRegisteredAt] = useState('');
  const [submittedCustomFields, setSubmittedCustomFields] = useState<Record<string, any>>({});

  // OTP Email verification state
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'verified' | 'error'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setForm(null);
    setAvailableForms([]);
    setCurrentStep(0);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: ''
    });
    setCustomFieldValues({});
    setSubmitted(false);
    setEmailStatus('idle');
    setOtpCode('');
    setOtpError('');
    setIsVerifyingOtp(false);
    setSelectedImage(null);
    setImagePreview(null);
    setIsUploadingImage(false);
  };

  const customFields = ((form?.custom_fields as unknown) as CustomField[]) || [];
  const isStudentRegistration = !!form?.is_default || (form?.name || '').toLowerCase().includes("student") || customFields.some(f => getStudentFieldType(f.label));

  const getStudentFieldType = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("education fair") || l.includes("which fair")) return "fair";
    if (l.includes("highest level of education") || l.includes("education level")) return "education";
    if (l.includes("preferred study country") || l.includes("country do you want to study")) return "country";
    if (l.includes("hear about us") || l.includes("source")) return "source";
    if (l.includes("level of study") || l.includes("level do you want to study")) return "study_level";
    if (l.includes("budget") || l.includes("tuition fees")) return "budget";
    if (l.includes("fund your studies") || l.includes("funding")) return "funding";
    if (l.includes("start your studies") || l.includes("plan to enroll")) return "start_date";
    return null;
  };

  useEffect(() => {
    if (event) {
      resetState();
      fetchForm();
      fetchAllEvents();
      // Animation entrance
      const ctx = gsap.context(() => {
        gsap.to(modalRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out'
        });
        gsap.from(contentRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.6,
          delay: 0.1,
          ease: 'power3.out'
        });
      });
      return () => ctx.revert();
    }
  }, [event]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(r => r - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Auto-advance if Step 0 is empty for non-student forms
  useEffect(() => {
    if (form && !isStudentRegistration && currentStep === 0 && customFields.length === 0) {
      setCurrentStep(1);
    }
  }, [form, isStudentRegistration, currentStep, customFields.length]);

  async function fetchAllEvents() {
    if (!event?.id) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .order('date', { ascending: false });

      if (error) throw error;
      setAllEvents(data || []);
    } catch (err) {
      console.error('Error fetching all events:', err);
    }
  }

  async function fetchForm() {
    if (!event) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_forms')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false } as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAvailableForms((data as any[]) || []);
      
      if (data && data.length > 0) {
        const defaultForm = (data as any[]).find(f => f.is_default);
        // Only auto-select if there's a default form or ONLY one form
        if (defaultForm) {
          setForm(defaultForm);
        } else if (data.length === 1) {
          setForm(data[0]);
        } else {
          // Multiple forms and no default, stay on selection screen
          setForm(null);
        }
      }
    } catch (err) {
      console.error('Error fetching form:', err);
    } finally {
      setLoading(false);
    }
  }


  const handleNext = () => {
    if (isStudentRegistration) {
      if (currentStep === 0) {
        const stepFields = customFields.slice(0, 4);
        for (const field of stepFields) {
          if (field?.required && !customFieldValues[field.id]) {
            alert(`Please fill in: ${field.label}`);
            return;
          }
        }
      } else if (currentStep === 1) {
        const stepFields = customFields.slice(4, 8);
        for (const field of stepFields) {
          if (field?.required && !customFieldValues[field.id]) {
            alert(`Please fill in: ${field.label}`);
            return;
          }
        }
      }
    } else {
      // Non-student registration: Slide 0 might have custom fields
      if (currentStep === 0 && customFields.length > 0) {
        // Only validate the first 4 fields if it's the first step
        const stepFields = customFields.slice(0, 4);
        for (const field of stepFields) {
          if (field?.required && !customFieldValues[field.id]) {
            alert(`Please fill in: ${field.label}`);
            return;
          }
        }
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    if (emailStatus === 'verified' || emailStatus === 'sent' || emailStatus === 'error') {
      setEmailStatus('idle');
      setOtpCode('');
      setOtpError('');
    }
  };

  const sendOtp = async () => {
    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }

    setEmailStatus('sending');
    setOtpError('');
    setOtpCode('');

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, formId: form?.id, eventName: event?.name }
      });

      if (error) {
        console.error('Send OTP error:', error);
        setEmailStatus('error');
        setOtpError('Failed to send verification code');
        return;
      }

      if (data?.error) {
        setEmailStatus('error');
        setOtpError(data.error);
        return;
      }

      setEmailStatus('sent');
      setResendCountdown(60);
      
      if (data?.debugCode) {
        console.log('Debug mode: Auto-filling OTP code');
        handleOtpChange(data.debugCode);
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setEmailStatus('error');
      setOtpError('Failed to send verification code');
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length !== 6) return;

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email: formData.email.trim(), code, formId: form?.id }
      });

      if (error) {
        console.error('Verify OTP error:', error);
        setOtpError('Failed to verify code');
        setIsVerifyingOtp(false);
        return;
      }

      if (data?.error) {
        setOtpError(data.error);
        setIsVerifyingOtp(false);
        return;
      }

      setEmailStatus('verified');
      setIsVerifyingOtp(false);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setOtpError('Failed to verify code');
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(cleanValue);
    setOtpError('');
    if (cleanValue.length === 6) {
      verifyOtp(cleanValue);
    }
  };

  const handleClose = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        resetState();
        onClose();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !form) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      alert("Please enter email or phone");
      return;
    }

    if (formData.email.trim() && emailStatus !== 'verified') {
      setOtpError('Please verify your email address first');
      return;
    }

    // Comprehensive custom field check before final submission
    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]) {
        alert(`Please fill in: ${field.label}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (!selectedImage) {
        alert("Please upload a profile photo");
        setSubmitting(false);
        return;
      }

      setIsUploadingImage(true);
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `attendees/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      setIsUploadingImage(false);

      const customFieldsData: Record<string, any> = {
        'Attendee Photo': publicUrl
      };
      for (const fieldId in customFieldValues) {
        const field = customFields.find(f => f.id === fieldId);
        if (field) customFieldsData[field.label] = customFieldValues[fieldId];
      }

      const guestId = crypto.randomUUID();
      const registeredAtIso = new Date().toISOString();
      const confNum = `LEKK-${guestId.slice(0, 8).toUpperCase()}`;

      const registrationData = {
        id: guestId,
        event_id: event.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
        registered_via: form.id,
        custom_fields: customFieldsData,
        created_at: registeredAtIso
      };

      const { error } = await supabase
        .from('guests')
        .insert([registrationData]);

      if (error) throw error;

      setConfirmationNumber(confNum);
      setRegisteredAt(registeredAtIso);
      setSubmittedCustomFields(customFieldsData);

      if (formData.email.trim()) {
        try {
          await supabase.functions.invoke('send-confirmation-ticket', {
            body: { 
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(), 
              phone: formData.phone.trim() || undefined,
              eventName: event.name,
              eventDate: event.date || undefined,
              eventVenue: event.venue || undefined,
              confirmationNumber: confNum,
              customFields: customFieldsData,
              image_url: publicUrl
            }
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting registration:', err);
      alert('Failed: ' + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const studentType = getStudentFieldType(field.label);

    if (field.type === 'select') {
      let options = field.options || [];

      if (isStudentRegistration && studentType) {
        if (studentType === 'fair') options = allEvents.map(e => e.name);
        else if (studentType === 'education') options = EDUCATION_LEVELS;
        else if (studentType === 'country') options = COUNTRIES_LIST;
        else if (studentType === 'study_level') options = STUDY_LEVELS;
        else if (studentType === 'budget') options = BUDGET_RANGES;
        else if (studentType === 'funding') options = FUNDING_SOURCES;
        else if (studentType === 'start_date') options = START_DATES;
        else if (studentType === 'source') options = SOURCES;
      }

      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <select
            value={customFieldValues[field.id] || ''}
            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            required={field.required}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
          >
            <option value="">Select an option</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            value={customFieldValues[field.id] || ''}
            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            required={field.required}
            placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white min-h-[100px]"
          />
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.id} className="flex items-center gap-3 cursor-pointer group">
          <div 
            onClick={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              customFieldValues[field.id] ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-white group-hover:border-emerald-200'
            }`}
          >
            {customFieldValues[field.id] && <Check className="h-4 w-4 text-white" />}
          </div>
          <span className="text-sm text-slate-600 font-medium">{field.placeholder || field.label}</span>
        </label>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          {field.label} {field.required && <span className="text-rose-500">*</span>}
        </label>
        <input
          type="text"
          value={customFieldValues[field.id] || ''}
          onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
          required={field.required}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
        />
      </div>
    );
  };

  if (!event) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 opacity-0"
    >
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div 
        ref={contentRef}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:bg-transparent print:border-none print:shadow-none"
      >
        {/* Header (Hidden when submitted) */}
        {!submitted && (
          <>
            {event.image_url && (
              <div className="relative w-full h-[200px] overflow-hidden">
                <img 
                  src={event.image_url} 
                  alt={event.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
            )}
            
            <div className="relative p-8 md:p-10 border-b border-gray-100 bg-white">
              <button 
                onClick={handleClose}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900 z-10"
              >
                <X className="h-6 w-6" />
              </button>
            
              <div className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 border border-primary/10 mb-6">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Registration</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 leading-tight text-gray-900">
                {event.name}
              </h2>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                {event.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(new Date(event.date), 'PPP')}</span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${submitted ? 'p-4 md:p-8' : 'p-8 md:p-10'} custom-scrollbar print:overflow-visible print:p-0`}>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse tracking-widest uppercase text-[10px] font-bold">Initializing Form...</p>
            </div>
          ) : submitted ? (
            <div className="py-20 flex flex-col items-center print:py-0">
              <div className="w-full max-w-md space-y-8">
                <RegistrationTicket 
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  email={formData.email}
                  phone={formData.phone}
                  notes={formData.notes}
                  eventName={event.name}
                  eventDate={event.date || undefined}
                  eventVenue={event.venue || undefined}
                  confirmationNumber={confirmationNumber}
                  registeredAt={registeredAt}
                  customFields={submittedCustomFields}
                  image_url={submittedCustomFields['Attendee Photo']}
                />
                
                <div className="flex flex-col gap-4 pt-4 print:hidden">

                  <button
                    onClick={handleClose}
                    className="w-full h-14 bg-white text-gray-900 border border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Return to Event
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              {!form ? (
                availableForms.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-muted-foreground mb-6">Registration for this event is not yet available or has been closed.</p>
                    <button 
                      onClick={handleClose}
                      className="text-primary font-bold hover:underline"
                    >
                      Go back
                    </button>
                  </div>
                ) : (
                  <div className="py-8 space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold font-display mb-2">Select Registration Type</h3>
                      <p className="text-muted-foreground">Please choose a form below</p>
                    </div>
                    
                    <div className="grid gap-4">
                      {availableForms.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setForm(f)}
                          className="flex items-center justify-between p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-primary/50 hover:shadow-md transition-all group text-left w-full"
                        >
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{f.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">Register as {f.name}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all flex-shrink-0">
                            <ArrowRight className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {availableForms.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setForm(null);
                        setFormData({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
                        setCustomFieldValues({});
                        setEmailStatus('idle');
                        setOtpCode('');
                        setCurrentStep(0);
                      }}
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-6 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Form Selection
                    </button>
                  )}

                  {isStudentRegistration && (
                    <div className="flex items-center justify-between mb-10 px-2">
                      {[0, 1, 2].map((step) => (
                        <div key={step} className="flex items-center flex-1 last:flex-0">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                            currentStep === step 
                              ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' 
                              : currentStep > step
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-gray-200 text-gray-400'
                          }`}>
                            {currentStep > step ? <Check className="h-5 w-5" /> : step + 1}
                          </div>
                          {step < 2 && (
                            <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                              currentStep > step ? 'bg-emerald-500' : 'bg-gray-100'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Step 0: Initial Custom Fields */}
                    {currentStep === 0 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                          <h3 className="text-lg font-bold text-gray-900">Registration Preferences</h3>
                          <p className="text-sm text-gray-500">Please provide your initial details</p>
                        </div>
                        <div className="space-y-6 pt-4">
                          {customFields.slice(0, 4).map(renderCustomField)}
                        </div>
                      </div>
                    )}

                    {/* Step 1: Second Batch of Custom Fields */}
                    {isStudentRegistration && currentStep === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                          <h3 className="text-lg font-bold text-gray-900">Educational Plans</h3>
                          <p className="text-sm text-gray-500">Help us understand your academic goals</p>
                        </div>
                        {customFields.slice(4, 8).map(renderCustomField)}
                      </div>
                    )}

                    {/* Step 2: Personal Information + Final Fields */}
                    {((isStudentRegistration && currentStep === 2) || (!isStudentRegistration && currentStep === 1)) && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                          <h3 className="text-lg font-bold text-gray-900">Identity & Contact</h3>
                          <p className="text-sm text-gray-500">Final step! Secure your registration</p>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4 mb-8">
                          <label className="text-sm font-medium text-slate-700 block text-center">Profile Photo <span className="text-rose-500">*</span></label>
                          <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all group relative overflow-hidden max-w-[200px] mx-auto ${
                            imagePreview ? 'border-primary bg-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}>
                            {imagePreview ? (
                              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                  }}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-8 h-8 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center cursor-pointer w-full text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">Upload Photo</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  required
                                  onChange={handleImageChange}
                                />
                              </label>
                            )}
                            {isUploadingImage && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">Attendee's face must be clearly visible</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-gray-900"
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-gray-900"
                              placeholder="Doe"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-rose-500">*</span></label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-gray-900"
                            placeholder="+234 800 000 0000"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                          <div className="relative group">
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={handleEmailChange}
                              disabled={emailStatus === 'verified' || emailStatus === 'sending'}
                              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all pr-32 ${
                                emailStatus === 'verified' 
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                                  : 'bg-white border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900'
                              }`}
                              placeholder="john@example.com"
                            />
                            
                            {emailStatus === 'idle' && formData.email.includes('@') && formData.email.includes('.') && (
                              <button
                                type="button"
                                onClick={sendOtp}
                                className="absolute right-2 top-1.5 px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                              >
                                Verify Email
                              </button>
                            )}
                            
                            {emailStatus === 'sending' && (
                              <div className="absolute right-4 top-3.5">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              </div>
                            )}
                            
                            {emailStatus === 'verified' && (
                              <div className="absolute right-4 top-3.5 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Verified</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </div>

                        {emailStatus === 'sent' && (
                          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                              </div>
                              <p className="text-sm font-bold text-emerald-900">Enter Verification Code</p>
                            </div>
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => handleOtpChange(e.target.value)}
                              className="w-full text-center text-3xl font-bold tracking-[0.5em] h-16 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-gray-900"
                              placeholder="••••••"
                              autoFocus
                            />
                            <div className="flex items-center justify-between mt-4">
                              <button
                                type="button"
                                disabled={resendCountdown > 0}
                                onClick={sendOtp}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-emerald-300 transition-colors"
                              >
                                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                              </button>
                              {isVerifyingOtp && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                            </div>
                          </div>
                        )}

                        {otpError && (
                          <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p className="text-xs font-medium">{otpError}</p>
                          </div>
                        )}
                        
                        {/* Remaining Custom Fields for Student (8+) */}
                        {isStudentRegistration && customFields.slice(8).map(renderCustomField)}
                        
                        {/* Remaining Custom Fields for Non-Student (4+) */}
                        {!isStudentRegistration && customFields.slice(4).map(renderCustomField)}
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Additional Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white min-h-[120px] text-gray-900"
                            placeholder="Tell us anything else you'd like us to know..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-gray-100 flex items-center justify-between gap-4">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-8 h-14 bg-white text-gray-900 border border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                      >
                        Back
                      </button>
                    )}
                    
                    {((isStudentRegistration && currentStep < 2) || (!isStudentRegistration && (currentStep === 0 && customFields.length > 4))) ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                      >
                        Continue
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting || (!!formData.email.trim() && emailStatus !== 'verified')}
                        className="flex-1 h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Registration
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
