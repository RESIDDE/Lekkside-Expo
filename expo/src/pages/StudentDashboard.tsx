import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Handshake,
  MessageCircleQuestion,
  Menu,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { ScreeningForm } from '../components/ScreeningForm';
import { StudentApplications } from '../components/StudentApplications';
import { StudentMeetingsManager } from '../components/StudentMeetingsManager';
import { AIMatching } from '../components/AIMatching';
import { UniversitiesDirectory } from '../components/UniversitiesDirectory';
import { LekksideSupportChat } from '../components/LekksideSupportChat';
import { StudentChats } from '../components/StudentChats';
import { motion, AnimatePresence } from 'framer-motion';

export function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exhibition-hall' | 'screening' | 'applications' | 'meetings' | 'ai-matches' | 'chats' | 'support'>('exhibition-hall');
  const [isCollapsed, setIsCollapsed] = useState(true);
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
      <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { id: 'exhibition-hall' as const, label: 'Exhibition Hall', icon: LayoutDashboard },
    { id: 'screening' as const, label: 'Screening', icon: ClipboardList },
    { id: 'applications' as const, label: 'Applications', icon: FileText },
    { id: 'meetings' as const, label: 'Meetings and Appointments', icon: Calendar },
    { id: 'ai-matches' as const, label: 'AI Matches', icon: Handshake },
    { id: 'chats' as const, label: 'Live Chats', icon: MessageSquare },
    { id: 'support' as const, label: 'Lekkside Support', icon: MessageCircleQuestion },
  ];

  return (
    <div className="flex h-screen bg-[#FBFBFD] font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background Animated Blobs for Apple-style subtle depth */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-100/40 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-rose-100/30 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* Floating Glass Sidebar (Desktop) */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`hidden md:flex flex-col z-40 my-6 ml-6 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${isCollapsed ? "w-[88px]" : "w-[280px]"
          }`}
      >
        <div className="flex flex-col h-full py-8 relative">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-12 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full p-1.5 shadow-sm hover:shadow-md text-gray-500 hover:text-gray-800 transition-all z-50"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Logo Section */}
          <div className={`flex items-center transition-all duration-500 mb-10 ${isCollapsed ? "justify-center px-0" : "px-8 gap-4"}`}>
            <div className={`relative flex items-center justify-center overflow-hidden flex-shrink-0 bg-white shadow-sm rounded-2xl p-2 ${isCollapsed ? "w-12 h-12" : "w-14 h-14"}`}>
              <img
                src="/lekkside-logo.png"
                alt="Lekkside"
                className="h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
                <span className="font-semibold text-lg tracking-tight text-gray-900 leading-none mb-1">Lekkside</span>
                <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">Student Portal</span>
              </motion.div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center transition-all duration-300 rounded-2xl group relative overflow-hidden ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3.5 gap-4"
                    } ${isActive
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:bg-black/5 hover:text-black"
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide text-left leading-tight">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Profile / Logout */}
          <div className="px-4 mt-auto">
            <div className={`bg-gray-100/50 rounded-2xl p-2 ${isCollapsed ? "" : "flex items-center gap-3"}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 mx-auto">
                <span className="text-gray-600 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className={`flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors ${isCollapsed ? "w-full mt-2 py-2" : "p-2"
                  }`}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <img src="/lekkside-logo.png" alt="Lekkside Logo" className="h-6" />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-20 px-4 pb-6 flex flex-col"
          >
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-4 rounded-2xl gap-4 transition-all ${isActive ? "bg-black text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              onClick={handleSignOut}
              className="mt-auto flex items-center justify-center gap-2 w-full p-4 rounded-2xl text-red-600 bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col overflow-hidden pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {activeTab === 'exhibition-hall' && <UniversitiesDirectory />}
                {activeTab === 'screening' && <ScreeningForm />}
                {activeTab === 'applications' && <StudentApplications user={user} />}
                {activeTab === 'meetings' && <StudentMeetingsManager user={user} />}
                {activeTab === 'ai-matches' && <AIMatching />}
                {activeTab === 'chats' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-none pb-6">
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Live Chats</h1>
                      <p className="text-gray-500 font-medium">Connect directly with university representatives.</p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col relative">
                        <StudentChats user={user} />
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'support' && (
                  <div className="h-[calc(100vh-8rem)]">
                    <LekksideSupportChat user={user} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
