import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  GraduationCap,
  CalendarDays,
  User,
  Settings,
  Bell,
  LayoutDashboard,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Handshake
} from 'lucide-react';
import { ScreeningForm } from '../components/ScreeningForm';
import { StudentApplications } from '../components/StudentApplications';
import { AIMatching } from '../components/AIMatching';
import { UniversitiesDirectory } from '../components/UniversitiesDirectory';
import { motion, AnimatePresence } from 'framer-motion';

export function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exhibition-hall' | 'screening' | 'applications' | 'ai-matches'>('exhibition-hall');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    checkUser();
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
    { id: 'exhibition-hall' as const, label: 'Exhibition Hall', icon: LayoutDashboard },
    { id: 'screening' as const, label: 'Screening', icon: ClipboardList },
    { id: 'applications' as const, label: 'Applications', icon: FileText },
    { id: 'ai-matches' as const, label: 'AI Matches', icon: Handshake },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans selection:bg-primary/10 selection:text-primary transition-colors duration-500">

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white z-40 transition-all duration-300 relative ${isCollapsed ? "w-[80px]" : "w-[260px]"
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
                  Student Portal
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            <div className={`p-4 transition-all ${isCollapsed ? "px-2" : "px-6"}`}>
              <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.user_metadata?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.user_metadata?.full_name || 'Student'}
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
                      className={`relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 group ${isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3"
                        } ${isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      <Icon
                        className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${isActive ? "text-white" : "opacity-70 group-hover:opacity-100"
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
                className={`flex items-center text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 ${isCollapsed ? "p-3 justify-center w-full" : "w-full gap-3 px-4 py-3 text-sm font-medium"
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
              <span className="font-bold text-gray-900 font-display">Student</span>
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
                      {user?.user_metadata?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user?.user_metadata?.full_name || 'Student'}
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
                          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isActive ? "opacity-100 rotate-90" : "opacity-30"
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
            <header className="justify-between items-center mb-8 hidden md:flex">
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                {activeTab === 'exhibition-hall' && 'Virtual Exhibition Hall'}
                {activeTab === 'screening' && 'Student Screening'}
                {activeTab === 'applications' && 'My Applications'}
                {activeTab === 'ai-matches' && 'AI Recommendations'}
              </h1>
              <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </header>

            {activeTab === 'exhibition-hall' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Quick Stats Cards */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Universities Saved</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Settings</p>
                      <p className="text-sm text-gray-400">Manage profile</p>
                    </div>
                  </div>
                </div>

                {/* Universities Directory */}
                <UniversitiesDirectory />
              </div>
            )}

            {activeTab === 'screening' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                <ScreeningForm />
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <StudentApplications user={user} />
              </div>
            )}

            {activeTab === 'ai-matches' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                <AIMatching />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
