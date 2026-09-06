import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  Loader2, 
  Key, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function UniversityRegistrationPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [institutionType, setInstitutionType] = useState('University');
  const [showPassword, setShowPassword] = useState(false);
  
  const [step, setStep] = useState<'signup' | 'otp'>('signup');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) throw signInError;

      // Navigate to university dashboard
      navigate('/university-dashboard');
    } catch (err: any) {
      console.error('University login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Send OTP verification code
      const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
        body: { email: email.trim(), formId: 'portal-signup', eventName: 'Lekkside University Registration' }
      });

      if (sendError || data?.error) {
        throw new Error(data?.error || sendError?.message || 'Failed to send verification code. Please try again.');
      }

      setStep('otp');
      setMessage(`A 6-digit verification code has been sent to ${email.trim()}`);
    } catch (err: any) {
      console.error('University signup error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { email: email.trim(), code: otp.trim(), formId: 'portal-signup' }
      });

      if (verifyError || verifyData?.error) {
        throw new Error(verifyData?.error || 'Invalid verification code. Please try again.');
      }

      const tempPassword = verifyData?.password;

      if (tempPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: tempPassword
        });

        if (signInError) throw signInError;

        const displayName = institutionName.trim() || fullName.trim();

        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
          data: {
            full_name: displayName,
            phone: phone.trim(),
            role: 'university',
            institution_type: institutionType
          }
        });

        if (updateError) throw updateError;
      } else {
        const displayName = institutionName.trim() || fullName.trim();
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: displayName,
              phone: phone.trim(),
              role: 'university',
              institution_type: institutionType
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            const { error: fallbackSignInError } = await supabase.auth.signInWithPassword({ 
              email: email.trim(), 
              password 
            });
            if (fallbackSignInError) throw signUpError;
          } else {
            throw signUpError;
          }
        }
      }

      // Successfully registered & authenticated
      navigate('/university-dashboard');
    } catch (err: any) {
      console.error('University OTP error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8 relative selection:bg-primary/30">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/lekkside-logo.png" alt="Lekkside" className="h-10 w-auto object-contain" />
          <span className="text-xl font-display font-bold uppercase tracking-tight text-white">
            Lekkside
          </span>
        </Link>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
          Back to Main Site
        </Link>
      </div>

      {/* Main Registration Box */}
      <div className="max-w-md w-full mx-auto my-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20 mb-6">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Exhibitor & University Portal</span>
        </div>

        {/* Tab Switcher */}
        {step === 'signup' && (
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <h1 className="text-3xl font-bold font-display mb-2 text-white">
          {step === 'otp'
            ? 'Verify Email Address'
            : mode === 'login'
            ? 'University Sign In'
            : 'University Registration'}
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          {step === 'otp'
            ? `Enter the 6-digit code sent to ${email}`
            : mode === 'login'
            ? 'Sign in to access your university leads, meetings, and exhibition tools.'
            : 'Create your university exhibitor account to access leads, meetings, and exhibition tools.'}
        </p>

        {error && (
          <div className="p-4 mb-6 bg-red-500/10 text-red-400 rounded-2xl text-sm font-medium border border-red-500/20">
            {error}
          </div>
        )}
        {message && (
          <div className="p-4 mb-6 bg-emerald-500/10 text-emerald-400 rounded-2xl text-sm font-medium border border-emerald-500/20">
            {message}
          </div>
        )}

        {mode === 'login' && step === 'signup' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admissions@university.edu"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-6 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : step === 'signup' ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Representative Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Sarah Johnson"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Institution / University Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="University of Oxford"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Institution Type
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <select
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium appearance-none"
                  required
                >
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="High School">High School</option>
                  <option value="Embassy">Embassy</option>
                  <option value="Language School">Language School</option>
                  <option value="Pathway Provider">Pathway Provider</option>
                  <option value="Education Organisation">Education Organisation</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admissions@university.edu"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 20 1234 5678"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-6 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Register University
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Verification Code
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-lg tracking-[0.5em] text-center"
                  required
                  maxLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify & Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('signup')}
              className="w-full text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors text-center"
            >
              Back to Registration Form
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center py-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
        © 2026 Lekkside Education Expo. All Rights Reserved.
      </div>
    </div>
  );
}
