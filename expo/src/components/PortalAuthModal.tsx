import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Loader2, 
  ArrowRight, 
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  GraduationCap,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

interface PortalAuthModalProps {
  onClose: () => void;
}

type UserRole = 'student' | 'university';

export function PortalAuthModal({ onClose }: PortalAuthModalProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [step, setStep] = useState<'login' | 'signup' | 'otp' | 'custom-otp' | 'forgot-password' | 'reset-password-otp'>('login');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

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
    setError('');
    setMessage('');

    if (step === 'forgot-password') {
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }
      setLoading(true);
      try {
        const { data, error: resetError } = await supabase.functions.invoke('send-password-reset-otp', {
          body: { email }
        });
        if (resetError || data?.error) {
          throw new Error(data?.error || 'Failed to send password reset email.');
        }
        setStep('reset-password-otp');
        setMessage(data?.message || 'Check your email for the password reset code.');
      } catch (err: any) {
        console.error('Password reset error:', err);
        setError(err.message || 'Failed to send password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 'reset-password-otp') {
      if (!otp.trim() || !password.trim()) {
        setError('Please enter the OTP and your new password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('reset-password', {
          body: { email, code: otp, newPassword: password }
        });
        
        if (error || data?.error) {
          throw new Error(data?.error || 'Failed to reset password.');
        }
        
        setStep('login');
        setPassword('');
        setOtp('');
        setMessage('Password updated successfully! You can now log in.');
      } catch (err: any) {
        console.error('Reset password OTP error:', err);
        setError(err.message || 'Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 'login' || step === 'signup') {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password');
        return;
      }

      if (step === 'signup') {
        if (!phone.trim() || !fullName.trim()) {
          setError('Please fill in all fields');
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
      }

      setLoading(true);

      try {
        if (step === 'login') {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            if (signInError.message.toLowerCase().includes('email not confirmed')) {
              await supabase.auth.resend({ type: 'signup', email });
              setStep('otp');
              return;
            }
            throw signInError;
          }
          
          // Determine redirect based on role from metadata if possible, 
          // but since they might be an old user without 'role' we default to student if not found,
          // or just rely on UI toggle for now if they switch role tabs before login.
          const userRole = data.user?.user_metadata?.role || role;
          
          // Success login
          handleClose();
          if (userRole === 'student') navigate('/student-dashboard');
          else navigate('/university-dashboard');
          return;
        } else if (step === 'signup') {
          // Send custom OTP
          const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
            body: { email, formId: 'portal-signup', eventName: 'Lekkside Portal' }
          });

          if (sendError || data?.error) {
            throw new Error(data?.error || 'Failed to send verification code. Please try again.');
          }

          setStep('custom-otp');
        }
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (step === 'custom-otp') {
      if (!otp.trim()) {
        setError('Please enter the OTP');
        return;
      }

      setLoading(true);
      try {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
          body: { email, code: otp, formId: 'portal-signup' }
        });

        if (verifyError || verifyData?.error) {
          throw new Error(verifyData?.error || 'Invalid OTP. Please try again.');
        }

        // OTP verified successfully, now create the user
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: role
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        handleClose();
        if (role === 'student') navigate('/student-dashboard');
        else navigate('/university-dashboard');

      } catch (err: any) {
        console.error('OTP error:', err);
        setError(err.message || 'Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (step === 'otp') {
      if (!otp.trim()) {
        setError('Please enter the OTP');
        return;
      }

      setLoading(true);
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup'
        });

        if (verifyError) throw verifyError;

        // Success
        handleClose();
        if (role === 'student') navigate('/student-dashboard');
        else navigate('/university-dashboard');

      } catch (err: any) {
        console.error('OTP error:', err);
        setError(err.message || 'Invalid OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

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
        className="relative w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="relative p-8 border-b border-gray-100 bg-white">
          <button 
            onClick={handleClose}
            className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900 z-10"
          >
            <X className="h-6 w-6" />
          </button>
        
          <div className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 border border-primary/10 mb-6">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Portal Registration</span>
          </div>
          
          <h2 className="text-3xl font-bold font-display mb-2 text-gray-900">
            {step === 'login' ? 'Welcome Back' : step === 'signup' ? 'Create an Account' : step === 'forgot-password' ? 'Reset Password' : step === 'reset-password-otp' ? 'New Password' : 'Verify Email'}
          </h2>
          <p className="text-sm text-gray-500">
            {step === 'login' ? 'Sign in to access your portal.' : step === 'signup' ? 'Join the Lekkside Expo portal to manage your experience.' : step === 'forgot-password' ? 'Enter your email to receive a password reset code.' : step === 'reset-password-otp' ? 'Enter the code sent to your email and your new password.' : 'Enter the code sent to your email.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {(step === 'login' || step === 'signup') ? (
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  role === 'student' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('university')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  role === 'university' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                University
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
              <p className="text-sm text-gray-600 font-medium">We've sent a verification code to</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{email}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                {message}
              </div>
            )}

            {(step === 'login' || step === 'signup') ? (
              <>
                {step === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                      required
                    />
                  </div>
                </div>

                {step === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Password
                    </label>
                    {step === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMessage('');
                          setStep('forgot-password');
                        }}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 pl-12 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : step === 'forgot-password' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                    required
                  />
                </div>
              </div>
            ) : step === 'reset-password-otp' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50 text-center tracking-[0.5em] font-bold text-lg"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 pl-12 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                  Verification Code
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50 text-center tracking-[0.5em] font-bold text-lg"
                    required
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-4 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === 'login' ? 'Sign In' : step === 'signup' ? 'Create Account' : step === 'forgot-password' ? 'Send Reset OTP' : step === 'reset-password-otp' ? 'Update Password' : 'Verify'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            {step === 'forgot-password' && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMessage('');
                    setStep('login');
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            )}

            {(step === 'login' || step === 'signup') && (
              <p className="text-center text-sm text-gray-500 mt-4">
                {step === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step === 'login' ? 'signup' : 'login');
                  }}
                  className="font-bold text-primary hover:underline"
                >
                  {step === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
