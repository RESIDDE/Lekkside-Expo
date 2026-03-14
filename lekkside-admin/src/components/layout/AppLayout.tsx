import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import lekksideLogo from "@/assets/lekkside-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary transition-colors duration-500">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <Link
                to="/dashboard"
                className="flex items-center gap-3.5 group relative"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-11 h-11 rounded-2xl overflow-hidden shadow-premium group-hover:shadow-premium-hover transition-all duration-500"
                  >
                    <img
                      src={lekksideLogo}
                      alt="Lekkside Logo"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </motion.div>
                  <div className="absolute -inset-2 bg-primary/5 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-semibold text-xl tracking-tight text-foreground bg-clip-text">
                    Lekkside
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80 leading-none">
                    Admin Portal
                  </span>
                </div>
              </Link>

              {/* Desktop Tabs */}
              <nav className="hidden md:flex items-center ml-4 space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 group",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-primary/10 rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            type: "spring",
                            bounce: 0.25,
                            duration: 0.5,
                          }}
                        />
                      )}
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110",
                          isActive
                            ? "text-primary"
                            : "opacity-70 group-hover:opacity-100",
                        )}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-xs font-semibold text-foreground/90 truncate max-w-[180px]">
                  {user?.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Administrator
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden sm:flex h-10 px-4 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-11 w-11 rounded-2xl bg-muted/50 hover:bg-muted transition-all"
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
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] as const }}
              className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 pt-4 pb-8 space-y-2">
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="pt-4 mt-4 border-t border-border/40"
                >
                  <div className="px-5 py-3 mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold truncate text-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start px-5 py-4 h-auto text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-2xl"
                  >
                    <LogOut className="w-5 h-5 mr-4" />
                    Sign out
                  </Button>
                </motion.div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content with Entrance Animation */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Subtle Footer Decorations */}
      <footer className="py-12 px-8 flex justify-center items-center opacity-30 pointer-events-none select-none">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          &copy; 2026 Lekkside Education Fair • Premium Admin Experience
        </span>
      </footer>
    </div>
  );
}
