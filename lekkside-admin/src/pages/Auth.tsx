import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Mail, KeyRound, Lock, User, ChevronRight, ShieldCheck, MailCheck, Fingerprint, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import lekksideLogo from '@/assets/lekkside-logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type ForgotPasswordStep = 'email' | 'otp' | 'newPassword';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Signup state
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateInputs = (includeFullName = false) => {
    try {
      emailSchema.parse(email);
    } catch {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid administrative email address.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast({
        title: 'Security Requirement',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return false;
    }

    if (includeFullName && !fullName.trim()) {
      toast({
        title: 'Identity Required',
        description: 'Please enter your full legal or professional name.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Access Denied',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please verify your credentials.'
          : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;

    setIsSigningUp(true);
    const { error } = await signUp(email, password, fullName);
    setIsSigningUp(false);

    if (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created',
        description: 'Your administrative account has been created successfully. Please check your email for a confirmation link if required.',
      });
    }
  };


  // Forgot Password Handlers
  const handleSendResetOtp = async () => {
    try {
      emailSchema.parse(resetEmail);
    } catch {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-otp', {
        body: { email: resetEmail },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Dispatch Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Code Sent',
        description: 'A reset verification code has been sent to your email.',
      });
      setForgotPasswordStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset code.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (resetOtp.length !== 6) {
      toast({
        title: 'Checksum Error',
        description: 'Please enter the complete 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setForgotPasswordStep('newPassword');
  };

  const handleResetPassword = async () => {
    try {
      passwordSchema.parse(newPassword);
    } catch {
      toast({
        title: 'Security Requirement',
        description: 'New password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Mismatched Credentials',
        description: 'Confirm password must match the new entry.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { 
          email: resetEmail, 
          code: resetOtp, 
          newPassword 
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Update Rejected',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Password Updated',
        description: 'Your account password has been successfully updated.',
      });

      resetForgotPasswordState();
    } catch (error: any) {
      toast({
        title: 'System Error',
        description: error.message || 'Failed to update credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setResetEmail('');
    setResetOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] as const 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.98, 
      transition: { 
        duration: 0.3 
      } 
    }
  };

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 font-inter">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none -auto -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="inline-block relative mb-6"
            >
              <img 
                src={lekksideLogo} 
                alt="Lekkside Logo" 
                className="w-24 h-24 rounded-[2rem] mx-auto shadow-2xl shadow-primary/20 object-cover border-4 border-white"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                <KeyRound className="w-4 h-4" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Account Recovery</h1>
            <p className="text-sm text-muted-foreground font-medium mt-3">
              {forgotPasswordStep === 'email' && 'Enter your email to reset your password'}
              {forgotPasswordStep === 'otp' && 'Enter the verification code'}
              {forgotPasswordStep === 'newPassword' && 'Create your new password'}
            </p>
          </div>

          <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-4 px-8 pt-8 flex-row items-center border-b border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl px-4 font-bold text-muted-foreground hover:bg-muted gap-2"
                onClick={resetForgotPasswordState}
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Login
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-8 p-8">
              <AnimatePresence mode="wait">
                {forgotPasswordStep === 'email' && (
                  <motion.div 
                    key="email"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="admin@lekkside.com"
                          className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendResetOtp} 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? 'Sending...' : 'Send Reset Code'}
                      {!isSendingOtp && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}

                {forgotPasswordStep === 'otp' && (
                  <motion.div 
                    key="otp"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                         <MailCheck className="w-4 h-4 text-primary" />
                         <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Security Verification</Label>
                       </div>
                       <p className="text-sm text-muted-foreground font-medium px-1">
                         A 6-digit security code has been sent to: <span className="text-foreground font-bold">{resetEmail}</span>
                       </p>
                      <div className="flex justify-center pt-4">
                        <InputOTP 
                          maxLength={6} 
                          value={resetOtp} 
                          onChange={setResetOtp}
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                              <InputOTPSlot 
                                key={i} 
                                index={i} 
                                className="h-14 w-12 rounded-xl text-xl font-black border-2 border-border/40 focus:border-primary shadow-sm" 
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <Button 
                      onClick={handleVerifyOtp} 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
                      disabled={resetOtp.length !== 6}
                    >
                      <KeyRound className="h-4 w-4" />
                      Verify Code
                    </Button>
                    <button 
                      onClick={() => setForgotPasswordStep('email')}
                      className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                    >
                      Incorrect email? Try another
                    </button>
                  </motion.div>
                )}

                {forgotPasswordStep === 'newPassword' && (
                  <motion.div 
                    key="password"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">New Password</Label>
                        <div className="relative group">
                          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Confirm Password</Label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="confirm-new-password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleResetPassword} 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
                      disabled={isResettingPassword || !newPassword || !confirmNewPassword}
                    >
                      {isResettingPassword ? 'Updating...' : 'Update Password'}
                      {!isResettingPassword && <Check className="w-5 h-5" />}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 font-inter">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" as const }}
          className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-primary rounded-[40%] blur-[120px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block relative mb-8"
          >
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110" />
            <img 
              src={lekksideLogo} 
              alt="Lekkside Logo" 
              className="relative w-28 h-28 rounded-[2.5rem] mx-auto shadow-2xl object-cover border-4 border-white"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">Admin Login</h1>
            <p className="text-sm text-muted-foreground font-semibold mt-3 flex items-center justify-center gap-2">
              Lekkside Event Dashboard
            </p>
          </motion.div>
        </div>

        <Card className="border-none shadow-premium bg-white/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden border-t border-white">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="p-1 px-4 pt-1 mb-4 mt-6">
              <TabsList className="grid w-full grid-cols-2 h-16 rounded-[1.8rem] bg-muted/30 p-1.5">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="px-8 pb-10">
              <TabsContent value="signin" className="mt-0 focus-visible:outline-none">
                <CardDescription className="mb-8 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Sign in to manage your events
                </CardDescription>
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@lekkside.com"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3 transition-all active:scale-95" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Signing in...
                      </div>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot Password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
                <CardDescription className="mb-8 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Create your administrative account
                </CardDescription>
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@lekkside.com"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-black uppercase tracking-widest shadow-xl shadow-foreground/20 gap-3 transition-all active:scale-95" 
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Creating...
                      </div>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.4em] mt-12"
        >
          Lekkside Event Management v8.4.2
        </motion.p>
      </motion.div>
    </div>
  );
}
