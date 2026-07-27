import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Mail } from 'lucide-react';
import gsap from 'gsap';

interface GuestLoginModalProps {
  initialEmail?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function GuestLoginModal({ initialEmail = '', onSuccess, onClose }: GuestLoginModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'error'>('idle');
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(modalRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.from(contentRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.4,
        delay: 0.1,
        ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setStatus('sending');

    try {
      const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
        body: { email: email.trim(), formId: 'portal-signup' }
      });

      if (sendError) throw sendError;
      if (data?.error) throw new Error(data.error);
      
      setStatus('sent');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send login code.');
      setStatus('error');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setError('');
    setStatus('verifying');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { email: email.trim(), code: otp.trim(), formId: 'portal-signup' }
      });

      if (verifyError) throw verifyError;
      if (!data?.success) throw new Error(data?.error || 'Invalid code. Please try again.');

      if (data?.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: data.password
        });
        if (signInError) throw signInError;
      }

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid code. Please try again.');
      setStatus('sent');
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 z-[60] flex items-center justify-center p-4 opacity-0 pointer-events-auto">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div ref={contentRef} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-2">Login Required</h3>
            <p className="text-muted-foreground text-sm">
              Please verify your email to securely chat and book meetings with universities.
            </p>
          </div>

          {status === 'sent' || status === 'verifying' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm text-center">
                A login code has been sent to <strong>{email}</strong>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Login Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center text-lg tracking-widest font-mono"
                  required
                />
              </div>
              {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={status === 'verifying'}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-70 transition-all"
              >
                {status === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="w-full text-center text-sm font-bold text-slate-500 hover:text-primary transition-colors"
              >
                Change Email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-70 transition-all"
              >
                {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Login Code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
