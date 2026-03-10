import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { type Database } from '../../../lekkside-admin/src/integrations/supabase/types';
import { X, Loader2, Calendar, MapPin, CheckCircle2, Send, Mail } from 'lucide-react';
import { format } from 'date-fns';
import gsap from 'gsap';
import RegistrationTicket from './RegistrationTicket';

type Event = Database['public']['Tables']['events']['Row'];
type EventForm = Database['public']['Tables']['event_forms']['Row'];

interface RegistrationModalProps {
  event: Event | null;
  onClose: () => void;
}

interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export function RegistrationModal({ event, onClose }: RegistrationModalProps) {
  const [form, setForm] = useState<EventForm | null>(null);
  const [availableForms, setAvailableForms] = useState<EventForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event) {
      fetchForm();
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

  async function fetchForm() {
    if (!event) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_forms')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAvailableForms(data || []);
      
      if (data && data.length === 1) {
        setForm(data[0]);
      }
    } catch (err) {
      console.error('Error fetching form:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    // Reset verification if email changes
    if (emailStatus !== 'idle') {
      setEmailStatus('idle');
      setOtpCode('');
      setOtpError('');
      setResendCountdown(0);
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
      
      // Check for debug code if present (for testing)
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
    // Only allow numbers and max 6 digits
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
      onComplete: onClose
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !form) return;

    // Email verification check
    if (formData.email.trim() && emailStatus !== 'verified') {
      setOtpError('Please verify your email address first');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare custom fields data exactly like lekkside-admin
      const customFields = (form.custom_fields as unknown as CustomField[]) || [];
      const customData: Record<string, any> = {};
      
      customFields.forEach(field => {
        const val = customFieldValues[field.id];
        if (val !== undefined && val !== null) {
          customData[field.label] = val;
        }
      });

      const guestId = crypto.randomUUID();
      const registeredAtIso = new Date().toISOString();

      const { error } = await supabase.from('guests').insert({
        id: guestId,
        event_id: event.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        registered_via: form.id,
        custom_fields: Object.keys(customData).length > 0 ? customData : null,
        checked_in: false
      });

      if (error) throw error;

      // Registration ticket data
      const confNum = `LEKK-${guestId.slice(0, 8).toUpperCase()}`;
      setConfirmationNumber(confNum);
      setRegisteredAt(registeredAtIso);
      setSubmittedCustomFields(customData);

      // Trigger confirmation email
      if (formData.email.trim()) {
        try {
          await supabase.functions.invoke('send-confirmation-ticket', {
            body: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone || undefined,
              notes: formData.notes || undefined,
              customFields: Object.keys(customData).length > 0 ? customData : undefined,
              eventName: event.name,
              eventDate: event.date || undefined,
              eventVenue: event.venue || undefined,
              confirmationNumber: confNum,
            }
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting registration:', err);
      alert('Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!event) return null;

  return (
    <>
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
        {/* Header (Hidden when submitted to show ticket more clearly) */}
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
            
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 leading-tight">
              {event.name}
            </h2>
            
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
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
            <div className="py-4 md:py-8 flex flex-col items-center print:py-0">
              <div className="w-full max-w-md space-y-8">
                <RegistrationTicket 
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  email={formData.email}
                  phone={formData.phone}
                  notes={formData.notes}
                  customFields={submittedCustomFields}
                  eventName={event.name}
                  eventDate={event.date || undefined}
                  eventVenue={event.venue || undefined}
                  image_url={event.image_url || undefined}
                  confirmationNumber={confirmationNumber}
                  registeredAt={registeredAt}
                />
                
                <div className="text-center space-y-6 print:hidden">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display">Registration Success!</h3>
                    <p className="text-muted-foreground">A confirmation ticket has been sent to your email.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={handleClose}
                      className="w-full sm:w-auto px-12 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !form ? (
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
                        <svg className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
                  }}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-6 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Form Selection
                </button>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 focus:shadow-sm"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 focus:shadow-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      disabled={emailStatus === 'verified'}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 focus:shadow-sm ${
                        emailStatus === 'verified' ? 'border-primary/50 bg-primary/5' : 'focus:ring-primary/50'
                      }`}
                      placeholder="john@example.com"
                    />
                    {emailStatus === 'verified' && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {emailStatus !== 'verified' && formData.email.includes('@') && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={emailStatus === 'sending' || resendCountdown > 0}
                      className="px-6 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 min-w-[100px]"
                    >
                      {emailStatus === 'sending' ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-500" />
                      ) : resendCountdown > 0 ? (
                        `${resendCountdown}s`
                      ) : emailStatus === 'sent' ? (
                        'Resend'
                      ) : (
                        'Verify'
                      )}
                    </button>
                  )}
                </div>

                {/* OTP Input UI */}
                {emailStatus === 'sent' && (
                  <div className="space-y-4 pt-4 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 text-sm text-primary/80 font-medium">
                      <Mail className="h-4 w-4" />
                      <span>Verification code sent to your email</span>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <input 
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={e => handleOtpChange(e.target.value)}
                        disabled={isVerifyingOtp}
                        className="w-full bg-background border border-primary/20 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="••••••"
                        autoFocus
                      />
                      
                      {isVerifyingOtp && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Verifying unique code...</span>
                        </div>
                      )}
                      
                      {otpError && (
                        <p className="text-xs text-destructive text-center font-medium">{otpError}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {emailStatus === 'error' && otpError && (
                  <p className="text-xs text-destructive font-medium ml-1">{otpError}</p>
                )}
                
                {emailStatus === 'verified' && (
                  <p className="text-xs text-primary font-bold tracking-widest uppercase ml-1">Email Verified Successfully</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 focus:shadow-sm"
                  placeholder="+234 ..."
                />
              </div>

              {/* Custom Fields */}
              {((form.custom_fields as unknown as CustomField[]) || []).map((field: CustomField) => (
                <div key={field.id} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    {field.label} {field.required && <span className="text-primary">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <div className="relative group">
                      <select
                        required={field.required}
                        value={customFieldValues[field.id] || ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer focus:shadow-sm"
                      >
                        <option value="" className="bg-white text-gray-900">Select an option</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt} className="bg-white text-gray-900">{opt}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea 
                      required={field.required}
                      rows={3}
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 focus:shadow-sm resize-none min-h-[120px]"
                      placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
                    />
                  ) : field.type === 'checkbox' ? (
                    <div 
                      className="flex items-center gap-4 group cursor-pointer bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 hover:border-primary/50 hover:bg-white hover:shadow-sm transition-all text-gray-900"
                      onClick={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        customFieldValues[field.id] ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary/30'
                      }`}>
                        {customFieldValues[field.id] && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                      </div>
                      <span className="text-sm font-medium">{field.placeholder || 'I agree to the terms'}</span>
                    </div>
                  ) : (
                    <input 
                      required={field.required}
                      type="text"
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 focus:shadow-sm"
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}

              <button 
                disabled={submitting || (formData.email.trim() !== '' && emailStatus !== 'verified')}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-5 font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 mt-10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
