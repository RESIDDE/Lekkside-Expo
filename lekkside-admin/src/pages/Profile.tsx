import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, ArrowLeft, Shield, Mail, Key, UserCircle, BadgeCheck, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setFullName(data?.full_name || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update administrative profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      passwordSchema.parse(newPassword);
    } catch {
      toast({
        title: 'Security Requirement',
        description: 'Credential must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Checksum Error',
        description: 'Confirm entry does not match new password.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: 'Your security password is now active.',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Rotation Failed',
        description: error.message || 'Failed to update security credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  if (loading || isLoadingProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Loading Account Data</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="max-w-[800px] mx-auto space-y-12 pb-24 font-inter"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4">
          <div className="space-y-4">
            <motion.button 
              whileHover={{ x: -4 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-white px-4 py-2 rounded-full border border-border/40 shadow-sm"
            >
              <ChevronLeft className="h-3 w-3" />
              Return
            </motion.button>
            <div>
              <h1 className="text-4xl sm:text-5xl font-heading font-black text-foreground tracking-tight leading-none mb-4">Account Settings</h1>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/5 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                   <Shield className="w-3 h-3" />
                   Security Enabled
                </div>
                <div className="px-3 py-1 rounded-full bg-muted/50 border border-border/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                   Domain: {user?.email?.split('@')[1]}
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-premium overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
               <UserCircle className="w-full h-full text-primary/20 p-4" />
               {fullName && (
                 <div className="absolute bottom-2 right-2 p-1.5 bg-white rounded-xl shadow-lg border border-border/40">
                    <BadgeCheck className="w-5 h-5 text-[hsl(var(--success))]" />
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Identity Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading font-black text-foreground">Profile Details</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update your account information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="h-14 pl-12 rounded-2xl bg-muted/50 border-border/40 font-bold opacity-60 grayscale-[0.5]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your Name"
                        className="h-14 pl-12 rounded-2xl bg-white border-border/40 focus-visible:ring-primary/20 font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
                  >
                    {isSavingProfile ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--warning))/10] flex items-center justify-center text-[hsl(var(--warning))] shadow-lg shadow-orange-500/5">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading font-black text-foreground">Security Settings</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Change your account password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-widest text-[#f97316] px-1">New Passphrase</Label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 pl-12 rounded-2xl bg-white border-border/40 focus-visible:ring-orange-500/20 font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-[#f97316] px-1">Verify Entry</Label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 pl-12 rounded-2xl bg-white border-border/40 focus-visible:ring-orange-500/20 font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <p className="hidden sm:block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest max-w-[240px]">
                    Security best practice: Update your password regularly.
                  </p>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="h-14 px-8 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-black uppercase tracking-widest shadow-lg shadow-foreground/20 gap-3 w-full sm:w-auto"
                  >
                    <Lock className="h-4 w-4" />
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.4em]"
        >
          Administrative Panel v4.0.1 (Stable)
        </motion.p>
      </motion.div>
    </AppLayout>
  );
}
