import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  BarChart3,
  Video,
  FileText,
  UserCheck,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import lekksideLogo from "@/assets/lekkside-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { NotificationBell } from "./NotificationBell";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.user_metadata?.user_type === "exhibitor") {
        const { data } = await supabase
          .from("exhibitors")
          .select("booth_id")
          .eq("user_id", user.id)
          .single();

        if (data?.booth_id) {
          navigate(`/exhibitor/dashboard/${data.booth_id}`);
        } else {
          // If exhibitor but no booth found, maybe sign out or show error?
          // For now, let's sign out to be safe
          await signOut();
          navigate("/auth");
        }
      }
    };

    checkAccess();
  }, [user, navigate, signOut]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/meetings", label: "Meetings", icon: Video },
    { href: "/chats", label: "Live Chats", icon: MessageSquare },
    { href: "/screenings", label: "Screenings", icon: UserCheck },
    { href: "/applications", label: "Applications", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background font-sans selection:bg-primary/10 selection:text-primary transition-colors duration-500">
        
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden md:flex flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl z-40 transition-all duration-300 relative",
            isCollapsed ? "w-[80px]" : "w-[260px]"
          )}
        >
          {/* Toggle Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-background border border-border rounded-full p-1 shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-50"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className={cn("flex items-center h-20 transition-all duration-300", isCollapsed ? "justify-center px-0" : "px-6 gap-3")}>
              <Link to="/dashboard" className="flex items-center gap-3 group relative">
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn("relative z-10 rounded-2xl overflow-hidden shadow-premium group-hover:shadow-premium-hover transition-all duration-500 flex-shrink-0", isCollapsed ? "w-10 h-10" : "w-11 h-11")}
                  >
                    <img
                      src={lekksideLogo}
                      alt="Lekkside Logo"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </motion.div>
                  <div className="absolute -inset-2 bg-primary/5 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {!isCollapsed && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-heading font-semibold text-xl tracking-tight text-foreground bg-clip-text whitespace-nowrap">
                      Lekkside
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80 leading-none whitespace-nowrap">
                      Admin Portal
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                
                const linkContent = (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 group",
                      isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                        isActive
                          ? "text-primary"
                          : "opacity-70 group-hover:opacity-100"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="relative z-10 truncate whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );

                return isCollapsed ? (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkContent
                );
              })}
            </nav>

            {/* User Profile & Sign Out at bottom */}
            <div className="border-t border-border/40 p-4">
              <div className={cn("flex", isCollapsed ? "justify-center" : "items-center justify-between")}>
                {!isCollapsed && (
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-sm font-semibold text-foreground/90 truncate max-w-[120px]">
                      {user?.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                )}
                
                {isCollapsed ? (
                  <div className="flex flex-col gap-2 items-center">
                    <NotificationBell />
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSignOut}
                          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                        >
                          <LogOut className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Sign out</TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <NotificationBell />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <header className="md:hidden sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between h-16 px-4">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm">
                  <img src={lekksideLogo} alt="Lekkside Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-heading font-semibold text-lg text-foreground">Lekkside</span>
              </Link>

              <div className="flex items-center gap-1">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted transition-all"
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
                </Button>
              </div>
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
                  className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                />
                
                {/* Drawer */}
                <motion.nav
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-background border-r border-border/40 shadow-2xl flex flex-col"
                >
                  <div className="flex items-center h-16 px-6 border-b border-border/40">
                    <span className="font-heading font-semibold text-xl text-foreground">Menu</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {navItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.href);
                      return (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          key={item.href}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center justify-between px-5 py-4 rounded-2xl text-base font-semibold transition-all duration-300",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                : "text-foreground hover:bg-muted/80",
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <Icon className="w-5 h-5" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 transition-transform",
                                isActive ? "opacity-100 rotate-90" : "opacity-30",
                              )}
                            />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile Sign Out */}
                  <div className="p-4 border-t border-border/40">
                     <Button
                      variant="ghost"
                      className="w-full justify-start h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign out
                    </Button>
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>

          {/* Scrollable Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full bg-background/50">
            <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
