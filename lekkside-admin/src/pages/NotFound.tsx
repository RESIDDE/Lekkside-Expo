import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-inter">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div className="relative inline-block">
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              y: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 bg-white rounded-[3rem] shadow-premium flex items-center justify-center text-primary border border-border/40"
          >
            <Compass className="w-16 h-16" />
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-2 -right-2 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-semibold shadow-lg shadow-primary/20 border-4 border-slate-50"
          >
            404
          </motion.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-semibold text-foreground tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn't exist or has been moved to a new location.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/">
            <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 group">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Go Back Home
            </Button>
          </Link>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground/30 pt-12">
          Lekkside Admin Portal / 404 Error
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
