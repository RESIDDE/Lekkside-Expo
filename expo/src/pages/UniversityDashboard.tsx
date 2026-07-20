import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Building2, 
  Users,
  Star,
  Video,
  Download,
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
  Scan
} from 'lucide-react';
import { UniversityApplications } from '../components/UniversityApplications';
import { UniversityProfile } from '../components/UniversityProfile';
import { LeadScanner } from '../components/LeadScanner';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'scan' | 'applications' | 'profile'>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
        .select('university_name')
        .eq('user_id', session.user.id)
        .single();
        
      if (!profile?.university_name) {
        setShowProfileReminder(true);
      }

      // Fetch Applications Data
      const { data: applications } = await supabase
        .from('university_applications')
        .select('id, status')
        .eq('university_id', session.user.id);
        
      const appsSubmitted = applications?.length || 0;
      const pendingApps = applications?.filter(app => app.status === 'pending').length || 0;

      // Check if exhibitor to fetch booth leads (estimation)
      const { data: exhibitor } = await supabase
        .from('exhibitors')
        .select('booth_id')
        .eq('user_id', session.user.id)
        .single();
        
      let leads = 0;
      let visitors = 0;
      
      if (exhibitor) {
        setExhibitorData(exhibitor);
        const { data: allLeads } = await supabase
          .from('booth_leads')
          .select('id, is_relevant, lead_score')
          .eq('booth_id', exhibitor.booth_id);
          
        const totalLeads = allLeads?.length || 0;
        const qualifiedLeads = allLeads?.filter(l => l.is_relevant || (l.lead_score && l.lead_score >= 4)).length || 0;

        leads = qualifiedLeads;
        visitors = totalLeads * 3; // Est visitors
      }

      setStats({
        visitors,
        leads,
        meetingsScheduled: 0, // Not available
        meetingsCompleted: 0,
        downloads: 0,
        appsStarted: appsSubmitted, // Default to submitted count
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }



  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'scan' as const, label: 'Scan Leads', icon: Scan },
    { id: 'applications' as const, label: 'Applications', icon: FileText },
    { id: 'profile' as const, label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans selection:bg-primary/10 selection:text-primary transition-colors duration-500">
      
      {/* Profile Reminder Modal */}
      <AnimatePresence>
        {showProfileReminder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Complete Your Profile</h2>
              <p className="text-gray-600 mb-6">
                Please set up your university profile so students can see your institution when applying.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProfileReminder(false)}
                  className="flex-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Do it later
                </button>
                <button
                  onClick={() => {
                    setShowProfileReminder(false);
                    setActiveTab('profile');
                  }}
                  className="flex-1 px-4 py-3 bg-primary text-white font-medium hover:bg-primary/90 rounded-xl transition-colors shadow-sm shadow-primary/20"
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
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white z-40 transition-all duration-300 relative ${
          isCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`flex items-center h-20 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}>
            <div className={`relative z-10 flex items-center justify-center overflow-hidden flex-shrink-0 ${isCollapsed ? "w-10 h-10" : "w-auto"}`}>
              <img
                src="/lekkside-logo.png"
                alt="Lekkside Logo"
                className={`${isCollapsed ? "h-6 object-contain" : "h-8"}`}
              />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-gray-900 font-display whitespace-nowrap">
                  University Portal
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            <div className={`p-4 transition-all ${isCollapsed ? "px-2" : "px-6"}`}>
              <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.user_metadata?.full_name?.charAt(0) || <Building2 className="h-5 w-5" />}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.user_metadata?.full_name || 'University'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                      className={`relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 group ${
                        isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3"
                      } ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${
                          isActive ? "text-white" : "opacity-70 group-hover:opacity-100"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="relative z-10 truncate whitespace-nowrap">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sign Out at bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className={`flex ${isCollapsed ? "justify-center" : "items-center"}`}>
              <button
                onClick={handleSignOut}
                title={isCollapsed ? "Sign Out" : undefined}
                className={`flex items-center text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 ${
                  isCollapsed ? "p-3 justify-center w-full" : "w-full gap-3 px-4 py-3 text-sm font-medium"
                }`}
              >
                <LogOut className={`w-[20px] h-[20px] flex-shrink-0`} />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <img src="/lekkside-logo.png" alt="Lekkside Logo" className="h-6" />
              <span className="font-bold text-gray-900 font-display">University</span>
            </div>

            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-6 h-6" />
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
                className="md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
              />
              
              {/* Drawer */}
              <motion.nav
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-white border-r border-gray-200 shadow-2xl flex flex-col"
              >
                <div className="flex items-center h-16 px-6 border-b border-gray-200">
                  <span className="font-bold text-gray-900 font-display text-xl">Menu</span>
                </div>
                
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                  <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user?.user_metadata?.full_name?.charAt(0) || <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">
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
                          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isActive ? "opacity-100 rotate-90" : "opacity-30"
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
        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 hidden md:flex">
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                {activeTab === 'overview' && 'University Dashboard'}
                {activeTab === 'scan' && 'Lead Scanner'}
                {activeTab === 'applications' && 'Student Applications'}
                {activeTab === 'profile' && 'University Profile Settings'}
              </h1>
              <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </header>

            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">+12%</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Booth Visitors</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.visitors}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Star className="h-6 w-6" />
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">+5%</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Qualified Leads</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.leads}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Video className="h-6 w-6" />
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">Today</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Meetings</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.meetingsCompleted} <span className="text-lg text-gray-400 font-normal">/ {stats.meetingsScheduled}</span></h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Download className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Document Downloads</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.downloads}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Applications Overview */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Application Pipeline</h2>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-medium text-gray-600">Applications Started</p>
                          <p className="text-lg font-bold text-gray-900">{stats.appsStarted}</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-medium text-gray-600">Applications Submitted</p>
                          <p className="text-lg font-bold text-gray-900">{stats.appsSubmitted}</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${stats.appsStarted > 0 ? (stats.appsSubmitted / stats.appsStarted) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setActiveTab('scan')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                            <Scan className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Scan Badges</p>
                            <p className="text-xs text-gray-500">Capture leads at the booth</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('applications')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Review Applications</p>
                            <p className="text-xs text-gray-500">{stats.pendingApps} pending review</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </button>

                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                            <FileEdit className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Update Profile</p>
                            <p className="text-xs text-gray-500">Edit your university details</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
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
                  <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                    <p className="text-gray-500">You must be assigned to an exhibition booth to scan leads.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <UniversityApplications user={user} />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                <UniversityProfile user={user} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
