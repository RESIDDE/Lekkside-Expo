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
import { Calendar, MapPin, Loader2, CheckCircle2, Mail, User, Phone, MessageSquare, ArrowRight, ExternalLink, ShieldCheck, FileText, Lock } from "lucide-react";
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

  const [currentStep, setCurrentStep] = useState(0);
  const isStudentRegistration = !!form?.is_default;
  const [allEvents, setAllEvents] = useState<{id: string, name: string}[]>([]);

  const customFields = ((form?.custom_fields as unknown) as CustomField[]) || [];
  const event = form?.events as any;

  // Fetch all events for the "Fair" dropdown if this is a student registration form
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!isStudentRegistration || !event?.created_by) return;
      
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("created_by", event.created_by)
        .order("date", { ascending: false });
      
      if (!error && data) {
        setAllEvents(data);
      }
    };
    fetchAllEvents();
  }, [isStudentRegistration, event?.created_by]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(r => r - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (field: keyof FormData, value: string) => {
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

      if (error || data?.error) {
        setEmailStatus('error');
        setOtpError(data?.error || 'Failed to send verification code');
        return;
      }

      setEmailStatus('sent');
      setResendCountdown(60);
    } catch (err: any) {
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

      if (error || data?.error) {
        setOtpError(data?.error || 'Verification failed');
        setIsVerifyingOtp(false);
        return;
      }

      setEmailStatus('verified');
      setIsVerifyingOtp(false);
      toast.success("Email verified successfully!");
    } catch (err: any) {
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

  const nextStep = () => {
    if (isStudentRegistration) {
      const stepFields = currentStep === 0 
        ? ["fair", "education", "country", "source"]
        : ["study_level", "budget", "funding", "start_date"];
      
      for (const fieldId of stepFields) {
        const field = customFields.find(f => f.id === fieldId);
        if (field?.required && !customFieldValues[fieldId]) {
          toast.error(`Please fill in: ${field.label}`);
          return;
        }
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderCustomField = (field: CustomField) => {
    let options = field.options || [];
    if (isStudentRegistration) {
      if (field.id === "fair") options = allEvents.map(e => e.name);
      if (field.id === "country") options = COUNTRIES_LIST;
      if (field.id === "education") options = EDUCATION_LEVELS;
      if (field.id === "study_level") options = STUDY_LEVELS;
      if (field.id === "budget") options = BUDGET_RANGES;
      if (field.id === "funding") options = FUNDING_SOURCES;
      if (field.id === "start_date") options = START_DATES;
      if (field.id === "source") options = SOURCES;
    }

    return (
      <div key={field.id} className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#f97316]">
            {field.label} {field.required && <span className="text-primary">*</span>}
          </span>
          <div className="h-px bg-orange-500/10 flex-1" />
        </div>
        
        {field.type === "text" && (
          <Input
            id={field.id}
            value={(customFieldValues[field.id] as string) || ""}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="h-14 px-6 rounded-2xl bg-white border-border/40 focus-visible:ring-primary/20 font-semibold shadow-sm"
            required={field.required}
          />
        )}
        {field.type === "textarea" && (
          <Textarea
            id={field.id}
            value={(customFieldValues[field.id] as string) || ""}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Details for ${field.label.toLowerCase()}`}
            className="min-h-[100px] p-6 rounded-2xl bg-white border-border/40 focus-visible:ring-primary/20 font-semibold shadow-sm resize-none"
            required={field.required}
          />
        )}
        {field.type === "select" && (
          <Select
            value={(customFieldValues[field.id] as string) || ""}
            onValueChange={(value) => handleCustomFieldChange(field.id, value)}
          >
            <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border-border/40 focus:ring-primary/20 font-semibold shadow-sm text-left">
              <SelectValue placeholder={field.placeholder || `Choose ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-premium border-border/40 p-2 max-h-[300px]">
              {options.map((option) => (
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
              className="mt-0.5 rounded-lg w-6 h-6"
            />
            <Label htmlFor={field.id} className="font-semibold text-sm leading-relaxed text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors">
              {field.placeholder || field.label}
            </Label>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error("Please enter email or phone");
      return;
    }

    if (formData.email.trim() && emailStatus !== 'verified') {
      toast.error("Please verify your email address");
      return;
    }

    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]) {
        toast.error(`Please fill in: ${field.label}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const customFieldsData: Record<string, string | boolean> = {};
      for (const fieldId in customFieldValues) {
        const field = customFields.find(f => f.id === fieldId);
        if (field) customFieldsData[field.label] = customFieldValues[fieldId];
      }

      const guestId = crypto.randomUUID();
      const registeredAtIso = new Date().toISOString();

      const { error } = await supabase.from("guests").insert({
        id: guestId,
        event_id: form.event_id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
        registered_via: form.id,
        custom_fields: customFieldsData,
      });

      if (error) throw error;

      const confNum = `LEKK-${guestId.slice(0, 8).toUpperCase()}`;
      setConfirmationNumber(confNum);
      setRegisteredAt(registeredAtIso);
      setSubmittedCustomFields(customFieldsData);

      if (formData.email.trim()) {
        try {
          await supabase.functions.invoke('send-confirmation-ticket', {
            body: {
              firstName: formData.first_name.trim(),
              lastName: formData.last_name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              customFields: customFieldsData,
              eventName: event?.name,
              eventDate: event?.date,
              eventVenue: event?.venue,
              confirmationNumber: confNum,
            }
          });
        } catch (e) {}
      }

      setIsSubmitted(true);
      toast.success("Registration Successful!");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Portal</p>
      </div>
    );
  }

  if (error || !form || !form.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-premium flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">Portal Deactivated</h2>
        <p className="text-sm text-muted-foreground font-medium mb-8 max-w-sm">
          {form && !form.is_active 
            ? "Portal Deactivated: This registration gateway has been temporarily suspended by the administrator."
            : "Unknown Endpoint: The registration link you are using is either invalid or has been decommissioned."}
        </p>
        <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-2xl px-8 h-12 font-bold uppercase tracking-widest text-[10px] shadow-sm">
          Return to Events
        </Button>
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
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Verified Entry</span>
            </div>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 py-12">
          <div className="w-full max-w-[600px] space-y-8">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-sm"><CheckCircle2 className="w-10 h-10" /></div>
              <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground tracking-tight">Passport Secured</h1>
              <p className="text-sm text-muted-foreground font-medium">Identity confirmed for <span className="text-primary font-bold">{event?.name}</span>.</p>
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
          </div>
        </motion.div>
      </div>
    );
  }

  const renderIdentityFields = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Identity Verification</span>
        <div className="h-px bg-primary/10 flex-1" />
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">First Name *</Label>
          <Input value={formData.first_name} onChange={e => handleChange("first_name", e.target.value)} className="h-14 px-6 rounded-2xl bg-muted/20 border-border/40 font-semibold" required />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">Last Name *</Label>
          <Input value={formData.last_name} onChange={e => handleChange("last_name", e.target.value)} className="h-14 px-6 rounded-2xl bg-muted/20 border-border/40 font-semibold" required />
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">Verify Email *</Label>
        <div className="flex gap-3">
          <Input 
            type="email" value={formData.email} 
            onChange={e => handleChange("email", e.target.value)} 
            className={cn("h-14 flex-1 px-6 rounded-2xl font-semibold", emailStatus === 'verified' ? "bg-green-50 border-green-200" : "bg-muted/20 border-border/40")}
            placeholder="your@email.com"
            disabled={emailStatus === 'verified'}
            required
          />
          {emailStatus === 'verified' ? (
            <div className="h-14 px-6 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/10"><CheckCircle2 className="w-6 h-6"/></div>
          ) : (
            <Button type="button" onClick={sendOtp} disabled={emailStatus === 'sending'} className="h-14 px-8 rounded-2xl font-bold text-[10px] uppercase tracking-widest">
              {emailStatus === 'sending' ? <Loader2 className="animate-spin"/> : "Verify"}
            </Button>
          )}
        </div>
        {emailStatus === 'sent' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
            <p className="text-sm font-semibold text-center text-primary">Verification code dispatched</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={handleOtpChange}>
                <InputOTPGroup className="gap-2">
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-10 sm:w-12 rounded-xl border-2 border-primary/20 bg-white" />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {otpError && <p className="text-[10px] text-destructive text-center font-bold tracking-widest uppercase">{otpError}</p>}
          </motion.div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">Whatsapp Number</Label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input value={formData.phone} onChange={e => handleChange("phone", e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 font-semibold" placeholder="+234..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-widest text-primary px-1">Any Questions?</Label>
          <Input value={formData.notes} onChange={e => handleChange("notes", e.target.value)} className="h-14 px-6 rounded-2xl bg-muted/20 font-semibold" placeholder="How can we help?" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-inter pb-12">
      <header className="bg-white/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={lekkLogo} alt="Lekkside" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Identity Secured</span>
             </div>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-12 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-[10px] font-bold tracking-widest text-primary uppercase mb-6">
             <FileText className="w-3.5 h-3.5" /> Official Registration
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground tracking-tight leading-[1.1] mb-6">{event?.name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {event?.date && <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm text-xs font-bold"><Calendar className="h-4 w-4 text-primary" />{format(new Date(event.date), "PPP")}</div>}
            {event?.venue && <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm text-xs font-bold"><MapPin className="h-4 w-4 text-primary" />{event.venue}</div>}
          </div>
        </motion.div>

        <Card className="border-none shadow-premium rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-8 sm:p-12 pb-8 border-b border-border/40 bg-slate-50/50">
             <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-premium flex items-center justify-center text-primary border border-primary/5"><FileText className="h-8 w-8" /></div>
                  <div>
                    <CardTitle className="text-2xl font-heading font-semibold text-foreground">{form.name}</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Registration Portal</CardDescription>
                  </div>
                </div>
                {isStudentRegistration && (
                  <div className="flex items-center gap-2 pt-2">
                    {[0, 1, 2].map(step => (
                      <div key={step} className={cn("h-2 flex-1 rounded-full transition-all duration-700", currentStep >= step ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted")} />
                    ))}
                  </div>
                )}
             </div>
          </CardHeader>

          <CardContent className="p-8 sm:p-12">
             <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {isStudentRegistration ? (
                      <>
                        {currentStep === 0 && (
                          <div className="space-y-10">
                             <div className="flex items-center gap-3"><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f97316]">Preferences</span><div className="h-px bg-[#f97316]/10 flex-1" /></div>
                             <div className="grid gap-8">{customFields.slice(0, 4).map(renderCustomField)}</div>
                          </div>
                        )}
                        {currentStep === 1 && (
                          <div className="space-y-10">
                             <div className="flex items-center gap-3"><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f97316]">Academic Intent</span><div className="h-px bg-[#f97316]/10 flex-1" /></div>
                             <div className="grid gap-8">{customFields.slice(4, customFields.length).map(renderCustomField)}</div>
                          </div>
                        )}
                        {currentStep === 2 && renderIdentityFields()}
                      </>
                    ) : (
                      <div className="space-y-12">
                         {renderIdentityFields()}
                         {customFields.length > 0 && (
                           <div className="space-y-10">
                             <div className="flex items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">Additional Data</span><div className="h-px bg-[#f97316]/10 flex-1" /></div>
                             <div className="grid gap-8">{customFields.map(renderCustomField)}</div>
                           </div>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-4 pt-8">
                   {isStudentRegistration && currentStep > 0 && (
                     <Button type="button" variant="outline" onClick={prevStep} className="h-16 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50">Back</Button>
                   )}
                   {isStudentRegistration && currentStep < 2 ? (
                     <Button type="button" onClick={nextStep} className="h-16 flex-1 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Next Component</Button>
                   ) : (
                     <Button 
                        type="submit" 
                        disabled={isSubmitting || (formData.email && emailStatus !== 'verified')} 
                        className="h-16 flex-1 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 group hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                        {isSubmitting ? <Loader2 className="animate-spin"/> : (
                           <span className="flex items-center gap-2">Finalize Entry <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                        )}
                     </Button>
                   )}
                </div>
             </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicForm;
