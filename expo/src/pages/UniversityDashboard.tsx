import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Building2, 
  Users,
  Star,
  Video,
  FileEdit,
  FileCheck,
  Bell,
  LayoutDashboard,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Scan,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { UniversityApplications } from '../components/UniversityApplications';
import { UniversityProfile } from '../components/UniversityProfile';
import { UniversityProgramsManager } from '../components/UniversityProgramsManager';
import { UniversityStudentManager } from '../components/UniversityStudentManager';
import { UniversityMeetingsManager } from '../components/UniversityMeetingsManager';
import { UniversityVideoMeetings } from '../components/UniversityVideoMeetings';
import { LeadScanner } from '../components/LeadScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap } from 'lucide-react';
import { UniversityChats } from '../components/UniversityChats';
import { UniversityAllStudents } from '../components/UniversityAllStudents';
import { AdminLiveEventBanner } from '../components/AdminLiveEventBanner';
import { formatDistanceToNow } from 'date-fns';

export function UniversityDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitors: 0,
    leads: 0,
    meetingsScheduled: 0,
    meetingsCompleted: 0,
    downloads: 0,
    appsStarted: 0,
    appsSubmitted: 0,
    pendingApps: 0
  });
  const [exhibitorData, setExhibitorData] = useState<any>(null);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scan' | 'leads' | 'students' | 'meetings' | 'video-meetings' | 'applications' | 'profile' | 'programs' | 'chats'>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const navigate = useNavigate();

  // Notifications state
  interface Notification { id: string; title: string; message: string; type: string; read: boolean; link?: string; created_at: string; }
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      
      // Check profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_name, contact_email, is_active, video_access_enabled')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (!(profile as any)?.university_name) {
        setShowProfileReminder(true);
      }
      
      const profileActive = (profile as any)?.is_active;
      if (profileActive === false) {
        setIsDeactivated(true);
      }
      setIsApproved(profileActive === true);

      // Fetch global settings
      const { data: systemSettings } = await supabase
        .from('system_settings')
        .select('video_rooms_enabled')
        .limit(1)
        .maybeSingle();
      
      const globalVideoEnabled = systemSettings?.video_rooms_enabled ?? false;
      const exhibitorVideoEnabled = (profile as any)?.video_access_enabled ?? false;
      setVideoEnabled(globalVideoEnabled || exhibitorVideoEnabled);

      // Fetch Applications Data
      const { data: applications } = await supabase
        .from('university_applications')
        .select('id, status')
        .eq('university_id', session.user.id);
        
      const appsStarted = applications?.length || 0;
      const appsSubmitted = applications?.filter(app => app.status === 'submitted' || app.status === 'approved' || app.status === 'accepted').length || appsStarted;
      const pendingApps = applications?.filter(app => app.status === 'pending' || app.status === 'under_review').length || 0;

      // Fetch Meetings & Appointments Data
      const { data: meetingRequests } = await supabase
        .from('meeting_requests')
        .select('id, status')
        .eq('university_id', session.user.id);

      const meetingsScheduled = meetingRequests?.length || 0;
      const meetingsCompleted = meetingRequests?.filter(m => m.status === 'accepted' || m.status === 'completed' || m.status === 'confirmed').length || 0;

      // Fetch Live Conversations / Inquiries
      const { data: chatData } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('university_id', session.user.id);

      const totalChats = chatData?.length || 0;

      // Find booths assigned to this university directly and query booth leads & event visitors
      const { data: assignedBooths } = await supabase
        .from('exhibition_booths')
        .select('id, event_id')
        .eq('university_id', session.user.id)
        .order('created_at', { ascending: false });
        
      let leads = 0;
      let visitors = 0;
      
      if (assignedBooths && assignedBooths.length > 0) {
        setExhibitorData({ booth_id: assignedBooths[0].id });
        const boothIds = assignedBooths.map(b => b.id);
        const eventIds = assignedBooths.map(b => b.event_id).filter(Boolean);

        const { data: allLeads } = await supabase
          .from('booth_leads')
          .select('id, is_relevant, lead_score')
          .in('booth_id', boothIds);
          
        leads = allLeads?.length || 0;

        if (eventIds.length > 0) {
          const { count } = await supabase
            .from('guests')
            .select('id', { count: 'exact', head: true })
            .in('event_id', eventIds);
          visitors = Math.max(count || 0, leads);
        } else {
          visitors = leads;
        }
      }

      setStats({
        visitors,
        leads,
        meetingsScheduled,
        meetingsCompleted,
        downloads: totalChats,
        appsStarted,
        appsSubmitted,
        pendingApps
      });

      setLoading(false);
    }
    
    fetchDashboardData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data as Notification[]);
  }, []);

  // Subscribe to notifications realtime when user is loaded
  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id);
    const channel = supabase
      .channel(`uni-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => fetchNotifications(user.id))
      .subscribe();
      
    // Subscribe to profile changes realtime (e.g., video_access_enabled toggled by admin)
    const profileChannel = supabase
      .channel(`uni-profile-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const newProfile = payload.new as any;
        setIsApproved(newProfile.is_active === true);
        if (newProfile.is_active === false) {
          setIsDeactivated(true);
        }
        
        // Refetch system settings to accurately set videoEnabled
        const { data: systemSettings } = await supabase
          .from('system_settings')
          .select('video_rooms_enabled')
          .limit(1)
          .maybeSingle();
          
        const globalVideoEnabled = systemSettings?.video_rooms_enabled ?? false;
        const exhibitorVideoEnabled = newProfile.video_access_enabled ?? false;
        setVideoEnabled(globalVideoEnabled || exhibitorVideoEnabled);
      })
      .subscribe();
      
    // Subscribe to system settings changes realtime
    const settingsChannel = supabase
      .channel(`system-settings-changes`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'system_settings'
      }, async (payload) => {
        const newSettings = payload.new as any;
        const globalVideoEnabled = newSettings.video_rooms_enabled ?? false;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('video_access_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
          
        const exhibitorVideoEnabled = (profile as any)?.video_access_enabled ?? false;
        setVideoEnabled(globalVideoEnabled || exhibitorVideoEnabled);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [user, fetchNotifications]);

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }


  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'scan' as const, label: 'Scan Leads', icon: Scan },
    { id: 'leads' as const, label: 'Manage Leads', icon: Users },
    { id: 'students' as const, label: 'Registered Students', icon: GraduationCap },
    { id: 'meetings' as const, label: 'Meetings and Appointments', icon: Calendar },
    { id: 'video-meetings' as const, label: 'Video Rooms', icon: Video },
    { id: 'chats' as const, label: 'Live Chats', icon: MessageSquare },
    { id: 'applications' as const, label: 'Applications', icon: FileText },
    { id: 'programs' as const, label: 'Manage Programs', icon: BookOpen },
    { id: 'profile' as const, label: 'Profile Settings', icon: Settings },
  ];

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-500">
      
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] bg-blue-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>
      
      {/* Profile Reminder Modal */}
      <AnimatePresence>
        {showProfileReminder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center border border-gray-800 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-white border border-gray-700 shadow-inner">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Complete Your Profile</h2>
              <p className="text-gray-400 mb-8 font-medium">
                Please set up your university profile so students can see your institution when applying.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowProfileReminder(false)}
                  className="flex-1 px-4 py-4 text-gray-400 font-bold hover:bg-gray-800 rounded-2xl transition-all"
                >
                  Do it later
                </button>
                <button
                  onClick={() => {
                    setShowProfileReminder(false);
                    setActiveTab('profile');
                  }}
                  className="flex-1 px-4 py-4 bg-white text-black font-bold hover:bg-gray-200 hover:-translate-y-0.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Set up Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white/70 backdrop-blur-2xl z-40 transition-all duration-500 relative ${
          isCollapsed ? "w-[80px]" : "w-[280px]"
        } shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 bg-gray-900 border border-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all z-50 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`flex items-center h-24 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "px-8 gap-4"}`}>
            <div className={`relative z-10 flex items-center justify-center overflow-hidden flex-shrink-0 bg-black shadow-sm rounded-2xl p-2 ${isCollapsed ? "w-12 h-12" : "w-14 h-14"}`}>
              <img
                src="/lekkside-logo.png"
                alt="Lekkside Logo"
                className={`h-full object-contain ${isCollapsed ? "p-1" : ""}`}
              />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-gray-900 tracking-wide whitespace-nowrap">
                  University
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col pt-4">
            <div className={`transition-all ${isCollapsed ? "px-2" : "px-6"}`}>
              <div className={`flex items-center mb-10 ${isCollapsed ? "justify-center" : "gap-4 bg-white/5 p-4 rounded-2xl border border-white/5"}`}>
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-white font-bold border border-gray-700 shadow-inner">
                  {user?.user_metadata?.full_name?.charAt(0) || <Building2 className="h-5 w-5" />}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate tracking-wide">
                      {user?.user_metadata?.full_name || 'University'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate uppercase tracking-widest mt-1 font-bold">{user?.email}</p>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`relative w-full flex items-center rounded-[1.25rem] text-sm font-bold transition-all duration-500 group overflow-hidden ${
                        isCollapsed ? "justify-center p-3.5" : "px-5 py-4 gap-4"
                      } ${
                        isActive
                          ? "bg-black text-white shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
                          : "text-gray-500 hover:bg-black/5 hover:text-black"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 flex-shrink-0 ${
                          isActive ? "text-black" : "opacity-70 group-hover:opacity-100"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="relative z-10 text-left leading-tight">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sign Out at bottom */}
          <div className="border-t border-white/5 p-6">
            <div className={`flex ${isCollapsed ? "justify-center" : "items-center"}`}>
              <button
                onClick={handleSignOut}
                title={isCollapsed ? "Sign Out" : undefined}
                className={`flex items-center text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-[1.25rem] transition-all duration-300 border border-transparent hover:border-red-500/20 ${
                  isCollapsed ? "p-3.5 justify-center w-full" : "w-full gap-4 px-5 py-4 text-sm font-bold"
                }`}
              >
                <LogOut className={`w-5 h-5 flex-shrink-0`} />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center gap-3">
              <img src="/lekkside-logo.png" alt="Lekkside Logo" className="h-6" />
              <span className="font-bold text-gray-900 tracking-wide">University</span>
            </div>

            <button
              className="p-3 text-gray-900 hover:bg-black/5 rounded-xl transition-colors border border-gray-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
              />
              
              {/* Drawer */}
              <motion.nav
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col"
              >
                <div className="flex items-center h-20 px-8 border-b border-gray-800 bg-black/20">
                  <span className="font-bold text-white tracking-widest uppercase text-xs">Navigation</span>
                </div>
                
                <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                  <div className="flex items-center gap-4 mb-8 px-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold shadow-inner">
                      {user?.user_metadata?.full_name?.charAt(0) || <Building2 className="h-6 w-6" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-base font-bold text-white truncate">
                        {user?.user_metadata?.full_name || 'University'}
                      </p>
                    </div>
                  </div>

                  {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.id}
                      >
                        <button
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300 border border-transparent ${
                            isActive
                              ? "bg-white text-black shadow-xl"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isActive ? "opacity-100 rotate-90 text-black" : "opacity-30"
                            }`}
                          />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile Sign Out */}
                <div className="p-4 border-t border-gray-200">
                   <button
                    className="w-full flex items-center h-12 px-5 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition-colors"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign out
                  </button>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-none custom-scrollbar">
          <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] mx-auto w-full">
            <AdminLiveEventBanner />
            <header className="hidden md:flex justify-between items-center mb-12">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                { activeTab === 'overview' && 'Exhibitor Command Center' }
                { activeTab === 'scan' && 'Lead Scanner' }
                { activeTab === 'leads' && 'Student Leads' }
                { activeTab === 'students' && 'Registered Students' }
                { activeTab === 'meetings' && 'Meetings and Appointments' }
                { activeTab === 'chats' && 'Live Chats' }
                {activeTab === 'applications' && 'Student Applications'}
                {activeTab === 'profile' && 'University Profile Settings'}
                {activeTab === 'programs' && 'Manage Programs'}
              </h1>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-3.5 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-[1.25rem] hover:bg-gray-800 transition-all shadow-sm hover:scale-105"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-gray-900 animate-pulse" />
                )}
              </button>
            </header>

            {isDeactivated ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center mt-20">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Deactivated</h1>
                  <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                    Your university account has been deactivated. You currently do not have access to the dashboard or student data. Please contact Lekkside Support for assistance.
                  </p>
                  <div className="space-y-3">
                    <a 
                      href="mailto:support@lekkside.com"
                      className="block w-full py-3.5 px-4 bg-gray-900 text-white rounded-[1.25rem] font-bold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-gray-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="h-14 w-14 rounded-[1.25rem] bg-black border border-gray-800 flex items-center justify-center text-blue-400 shadow-inner">
                        <Users className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-[10px] uppercase tracking-widest font-bold rounded-full border border-green-500/20">+12%</span>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Booth Visitors</p>
                    <h3 className="text-4xl font-bold text-white mt-2 tracking-tight relative z-10">{stats.visitors}</h3>
                  </div>

                  <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-gray-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="h-14 w-14 rounded-[1.25rem] bg-black border border-gray-800 flex items-center justify-center text-yellow-400 shadow-inner">
                        <Star className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-[10px] uppercase tracking-widest font-bold rounded-full border border-green-500/20">+5%</span>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Qualified Leads</p>
                    <h3 className="text-4xl font-bold text-white mt-2 tracking-tight relative z-10">{stats.leads}</h3>
                  </div>

                  <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-gray-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="h-14 w-14 rounded-[1.25rem] bg-black border border-gray-800 flex items-center justify-center text-purple-400 shadow-inner">
                        <Video className="h-6 w-6" />
                      </div>
                      <span className="px-3 py-1.5 bg-gray-800 text-gray-300 text-[10px] uppercase tracking-widest font-bold rounded-full border border-gray-700">Today</span>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Meetings</p>
                    <h3 className="text-4xl font-bold text-white mt-2 tracking-tight relative z-10">{stats.meetingsCompleted} <span className="text-xl text-gray-500 font-medium">/ {stats.meetingsScheduled}</span></h3>
                  </div>

                  <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-gray-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="h-14 w-14 rounded-[1.25rem] bg-black border border-gray-800 flex items-center justify-center text-emerald-400 shadow-inner">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest relative z-10">Student Inquiries</p>
                    <h3 className="text-4xl font-bold text-white mt-2 tracking-tight relative z-10">{stats.downloads}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Applications Overview */}
                  <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-10">
                    <h2 className="text-2xl font-bold text-white mb-8">Application Pipeline</h2>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Applications Started</p>
                          <p className="text-2xl font-bold text-white">{stats.appsStarted}</p>
                        </div>
                        <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-gray-800">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Applications Submitted</p>
                          <p className="text-2xl font-bold text-white">{stats.appsSubmitted}</p>
                        </div>
                        <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-gray-800">
                          <div className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${stats.appsStarted > 0 ? (stats.appsSubmitted / stats.appsStarted) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-10">
                    <h2 className="text-2xl font-bold text-white mb-8">Quick Actions</h2>
                    <div className="space-y-4">
                      <button 
                        onClick={() => setActiveTab('scan')}
                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border border-gray-800 bg-black hover:border-gray-600 transition-all group hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-[1rem] bg-gray-900 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors border border-gray-800 shadow-inner">
                            <Scan className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-white text-lg">Scan Badges</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">Capture leads at the booth</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('applications')}
                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border border-gray-800 bg-black hover:border-gray-600 transition-all group hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-[1rem] bg-gray-900 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors border border-gray-800 shadow-inner">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-white text-lg">Review Applications</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">{stats.pendingApps} pending review</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border border-gray-800 bg-black hover:border-gray-600 transition-all group hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-[1rem] bg-gray-900 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors border border-gray-800 shadow-inner">
                            <FileEdit className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-white text-lg">Update Profile</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">Edit your university details</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scan' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                {exhibitorData ? (
                  <LeadScanner boothId={exhibitorData.booth_id} />
                ) : (
                  <div className="bg-gray-900 p-16 text-center rounded-[3rem] border border-gray-800 shadow-2xl">
                    <p className="text-gray-400 font-medium text-lg">You must be assigned to an exhibition booth to scan leads.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <UniversityStudentManager user={user} boothId={exhibitorData?.booth_id} />
              </div>
            )}

            {activeTab === 'students' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                <UniversityAllStudents user={user} isApproved={isApproved} />
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <UniversityMeetingsManager user={user} isApproved={isApproved} />
              </div>
            )}

            {activeTab === 'video-meetings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto h-[calc(100vh-100px)]">
                <UniversityVideoMeetings videoEnabled={videoEnabled} />
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <UniversityChats user={user} isApproved={isApproved} />
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <UniversityApplications user={user} />
              </div>
            )}

            {activeTab === 'programs' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <UniversityProgramsManager user={user} />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                <UniversityProfile user={user} />
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Notification Slide-Over Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            />
            {/* Slide-over panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-8 border-b border-gray-800 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-bold text-white text-xl">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-bold text-gray-500 hover:text-white transition-colors tracking-wide">
                      MARK ALL READ
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 rounded-xl hover:bg-gray-800 transition-colors text-gray-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto py-6 px-6 bg-transparent">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-black border border-gray-800 flex items-center justify-center mb-6 shadow-inner">
                      <Bell className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-xl font-bold text-white tracking-tight">All caught up!</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((n, i) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-black border border-gray-800 hover:border-gray-600 transition-all shadow-sm group"
                      >
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 border shadow-inner ${
                          n.type === 'video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white text-black border-gray-200'
                        }`}>
                          {n.type === 'video' ? <Video className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-widest font-bold">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                          <div className="flex items-center gap-4 mt-4">
                            {n.type === 'chat' && (
                              <button
                                onClick={() => {
                                  markNotificationRead(n.id);
                                  setActiveTab('chats');
                                  setShowNotifications(false);
                                }}
                                className="text-xs font-bold text-white hover:text-gray-300 transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
                              >
                                View Chat
                              </button>
                            )}
                            {n.type === 'video' && (
                              <button
                                onClick={() => {
                                  markNotificationRead(n.id);
                                  setShowNotifications(false);
                                  const meetingsUrl = import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080';
                                  window.open(`${meetingsUrl}/meetings/booth-${user?.id}`, '_blank');
                                }}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                              >
                                Join Meeting
                              </button>
                            )}
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors ml-auto uppercase tracking-widest"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
