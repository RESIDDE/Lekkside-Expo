import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePublicForm, type CustomField } from "@/hooks/useForms";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, MapPin, Loader2, CheckCircle2, Mail, User, Phone, MessageSquare, ArrowRight, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import lekkLogo from "@/assets/lekkside-logo.png";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import RegistrationTicket from "@/components/forms/RegistrationTicket";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

const PublicForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form, isLoading, error } = usePublicForm(formId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [submittedCustomFields, setSubmittedCustomFields] = useState<Record<string, string | boolean>>({});

  // OTP Email verification state
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'verified' | 'error'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const customFields = ((form?.custom_fields as unknown) as CustomField[]) || [];
  const event = form?.events as any;

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(r => r - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (field: keyof FormData, value: string) => {
    // Reset email verification if email changes
    if (field === "email") {
      setEmailStatus('idle');
      setOtpCode('');
      setOtpError('');
      setResendCountdown(0);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (fieldId: string, value: string | boolean) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const sendOtp = async () => {
    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setEmailStatus('sending');
    setOtpError('');
    setOtpCode('');

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, formId, eventName: event?.name }
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
      
      // DEBUG MODE: Auto-fill OTP if returned (for testing while DNS is being configured)
      if (data?.debugCode) {
        console.log('Debug mode: Auto-filling OTP code');
        setOtpCode(data.debugCode);
        // Auto-verify after a short delay to show the UI
        setTimeout(() => {
          verifyOtp(data.debugCode);
        }, 500);
        toast.success("Debug mode: Code auto-filled for testing");
      } else {
        toast.success("Verification code sent to your email");
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
        body: { email: formData.email.trim(), code, formId }
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
      toast.success("Email verified successfully!");
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setOtpError('Failed to verify code');
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    setOtpError('');
    if (value.length === 6) {
      verifyOtp(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error("Please enter either an email or phone number");
      return;
    }

    // Block submission if email is provided but not verified
    if (formData.email.trim() && emailStatus !== 'verified') {
      toast.error("Please verify your email address before submitting");
      return;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.required) {
        const value = customFieldValues[field.id];
        if (value === undefined || value === "" || value === false) {
          toast.error(`Please fill in the required field: ${field.label}`);
          return;
        }
      }
    }

    // Validate form data before proceeding
    if (!form?.id || !form?.event_id) {
      toast.error("Invalid form link. Please use the correct registration link.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare custom fields data with labels as keys for better readability
      const customFieldsData: Record<string, string | boolean> = {};
      for (const field of customFields) {
        const value = customFieldValues[field.id];
        if (value !== undefined && value !== "") {
          customFieldsData[field.label] = value;
        }
      }

      // Use form.id (the actual DB form id) instead of formId (URL param) for registered_via
      const guestId = crypto.randomUUID();
      const registeredAtIso = new Date().toISOString();

      const insertPayload = {
        id: guestId,
        event_id: form.event_id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
        registered_via: form.id,
        custom_fields: Object.keys(customFieldsData).length > 0 ? customFieldsData : null,
      };

      const { error } = await supabase.from("guests").insert(insertPayload);
      if (error) throw error;

      // Generate confirmation number from guest ID
      const confNum = `LEKK-${guestId.slice(0, 8).toUpperCase()}`;
      setConfirmationNumber(confNum);
      setRegisteredAt(registeredAtIso);
      setSubmittedCustomFields(customFieldsData);

      // Send confirmation email if email is provided
      if (formData.email.trim()) {
        try {
          await supabase.functions.invoke('send-confirmation-ticket', {
            body: {
              firstName: formData.first_name.trim(),
              lastName: formData.last_name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim() || undefined,
              notes: formData.notes.trim() || undefined,
              customFields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
              eventName: event?.name,
              eventDate: event?.date || undefined,
              eventVenue: event?.venue || undefined,
              confirmationNumber: confNum,
            }
          });
          toast.success("Registration complete! Your ticket has been dispatched.");
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
          toast.success("Registration confirmed. (Digital ticket arrival may be delayed)");
        }
      } else {
        toast.success("Registration complete!");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      toast.error("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Registration</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-[2rem] bg-white shadow-premium flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
            <ExternalLink className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-heading font-black text-foreground mb-3">Portal Inaccessible</h2>
          <p className="text-sm text-muted-foreground font-medium mb-8">
            This registration endpoint has been decommissioned or is no longer active.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl px-8 h-12 font-bold hover:bg-white shadow-sm border-border/40">
            Retry Connection
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-inter">
        <header className="bg-white/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src={lekkLogo} alt="Lekkside" className="h-10 w-auto object-contain" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--success))]">Verified Entry</span>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center p-6 py-12"
        >
          <div className="w-full max-w-[600px] space-y-8">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-[hsl(var(--success))/10] text-[hsl(var(--success))] flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">Passport Secured</h1>
              <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">
                Identity confirmed for <span className="text-primary font-bold">{event?.name}</span>. Your digital passport is ready for presentation.
              </p>
            </div>

            <RegistrationTicket
              firstName={formData.first_name}
              lastName={formData.last_name}
              email={formData.email || undefined}
              phone={formData.phone || undefined}
              notes={formData.notes || undefined}
              customFields={Object.keys(submittedCustomFields).length > 0 ? submittedCustomFields : undefined}
              eventName={event?.name || "Event"}
              eventDate={event?.date || undefined}
              eventVenue={event?.venue || undefined}
              confirmationNumber={confirmationNumber}
              registeredAt={registeredAt}
            />
            
            {formData.email && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-3 p-4 bg-white rounded-2xl border border-border/40 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">
                  A verification copy has been dispatched to <span className="text-foreground">{formData.email}</span>
                </p>
              </motion.div>
            )}

            <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.4em] opacity-30 pt-8">
              Lekkside Identity Protocol v4.0
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const canSubmit = 
    formData.first_name.trim() && 
    formData.last_name.trim() && 
    (
      (formData.email.trim() && emailStatus === 'verified') ||
      (!formData.email.trim() && formData.phone.trim().length > 0)
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-inter">
      <header className="bg-white/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={lekkLogo} alt="Lekkside" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
               <ShieldCheck className="w-3 h-3 text-primary" />
               <span className="text-[9px] font-black uppercase tracking-widest text-primary">Secured Portal</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-12 max-w-2xl mx-auto w-full">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center space-y-4"
        >
          <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/5 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
             <CheckCircle2 className="w-3.5 h-3.5" />
             Sign Up
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-foreground tracking-tight leading-[1.1]">{event?.name}</h1>
          {event?.description && (
            <p className="text-base text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">{event.description}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {event?.date && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{format(new Date(event.date), "PPP 'at' p")}</span>
              </div>
            )}
            {event?.venue && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{event.venue}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Registration Form */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-premium rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 sm:p-10 pb-4 border-b border-border/40 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center text-primary border border-primary/5">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-heading font-black text-foreground">{form.name}</CardTitle>
                  <CardDescription className="text-xs font-bold font-inter uppercase tracking-widest text-muted-foreground">Registration Portal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Identification Grid */}
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">First Name *</Label>
                      <div className="relative group">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                         <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                          placeholder="First Name"
                          className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="last_name" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Last Name *</Label>
                       <div className="relative group">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                         <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                          placeholder="Last Name"
                          className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Verification */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email Address *</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1 group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="your@email.com"
                          className={cn(
                            "h-14 pl-12 rounded-2xl border-border/40 focus-visible:ring-primary/20 font-bold transition-all",
                            emailStatus === 'verified' ? "bg-[hsl(var(--success))/5] border-[hsl(var(--success))/30] pr-12" : "bg-muted/20"
                          )}
                          disabled={emailStatus === 'verified'}
                        />
                        {emailStatus === 'verified' && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--success))]" />
                        )}
                      </div>
                      
                      {emailStatus !== 'verified' && formData.email.includes('@') && (
                        <Button
                          type="button"
                          onClick={sendOtp}
                          disabled={emailStatus === 'sending' || resendCountdown > 0}
                          className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 shrink-0"
                        >
                          {emailStatus === 'sending' ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : resendCountdown > 0 ? (
                            `${resendCountdown}s`
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      )}
                    </div>

                    <AnimatePresence>
                      {emailStatus === 'sent' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6 pt-4 px-1"
                        >
                          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-muted-foreground leading-snug">
                                A verification code has been sent to <span className="text-foreground">{formData.email}</span>. Please enter it below.
                              </p>
                            </div>
                            
                            <div className="flex justify-center py-2">
                              <InputOTP 
                                maxLength={6} 
                                value={otpCode} 
                                onChange={handleOtpChange}
                                disabled={isVerifyingOtp}
                              >
                                <InputOTPGroup className="gap-2">
                                  {[0, 1, 2, 3, 4, 5].map(i => (
                                    <InputOTPSlot 
                                      key={i} 
                                      index={i} 
                                      className="h-14 w-11 sm:w-14 rounded-xl text-xl font-black border-2 border-border/40 focus:border-primary shadow-sm bg-white" 
                                    />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </div>

                            {otpError && (
                              <p className="text-center text-[10px] font-black uppercase tracking-widest text-[hsl(var(--destructive))]">{otpError}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Phone Number</Label>
                      <div className="relative group">
                         <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                         <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Additional Notes</Label>
                      <div className="relative group">
                         <MessageSquare className="absolute left-4 top-5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                         <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleChange("notes", e.target.value)}
                          placeholder="Special requirements..."
                          className="min-h-[56px] pl-12 py-4 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Event Specifics</span>
                       <div className="h-px bg-orange-500/20 flex-1" />
                    </div>
                    
                    <div className="grid gap-6">
                      {customFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id} className="text-[10px] font-extrabold text-muted-foreground/80 lowercase italic px-1">
                            // {field.label} {field.required && <span className="text-primary">*</span>}
                          </Label>
                          {field.type === "text" && (
                            <Input
                              id={field.id}
                              value={(customFieldValues[field.id] as string) || ""}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              className="h-14 px-6 rounded-2xl bg-white border-border/40 focus-visible:ring-primary/20 font-bold shadow-sm"
                              required={field.required}
                            />
                          )}
                          {field.type === "textarea" && (
                            <Textarea
                              id={field.id}
                              value={(customFieldValues[field.id] as string) || ""}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              placeholder={field.placeholder || `Details for ${field.label.toLowerCase()}`}
                              className="min-h-[100px] p-6 rounded-2xl bg-white border-border/40 focus-visible:ring-primary/20 font-bold shadow-sm resize-none"
                              required={field.required}
                            />
                          )}
                          {field.type === "select" && (
                            <Select
                              value={(customFieldValues[field.id] as string) || ""}
                              onValueChange={(value) => handleCustomFieldChange(field.id, value)}
                            >
                              <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border-border/40 focus:ring-primary/20 font-bold shadow-sm">
                                <SelectValue placeholder={field.placeholder || `Choose ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-premium border-border/40 p-2">
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option} className="rounded-xl py-3 font-medium">
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {field.type === "checkbox" && (
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-border/40 group cursor-pointer transition-colors hover:bg-white hover:border-primary/20">
                              <Checkbox
                                id={field.id}
                                checked={(customFieldValues[field.id] as boolean) || false}
                                onCheckedChange={(checked) => handleCustomFieldChange(field.id, !!checked)}
                                className="mt-0.5 rounded-lg w-6 h-6 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label htmlFor={field.id} className="font-bold text-sm leading-relaxed text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors">
                                {field.placeholder || field.label}
                              </Label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex flex-col items-center gap-6">
                  <Button
                    type="submit"
                    className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 gap-4 transition-all hover:scale-[1.02] active:scale-95 group disabled:opacity-50 disabled:grayscale"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Processing...
                      </div>
                    ) : (
                      <>
                        Register Now
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Standard Operational Protocol
                    </p>
                    <div className="flex items-center gap-2 justify-center opacity-40">
                       <ShieldCheck className="w-3 h-3" />
                       <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Registry</span>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.5em] mt-16"
        >
          Registration System v5.3.1
        </motion.p>
      </div>
    </div>
  );
};

export default PublicForm;
