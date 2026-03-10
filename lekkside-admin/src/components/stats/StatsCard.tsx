import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  index?: number;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  className,
  index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.21, 1.11, 0.81, 0.99] as const }}
      className={cn(
        "premium-card p-6 sm:p-7 relative overflow-hidden group",
        className,
      )}
    >
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-150 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
        {icon}
      </div>
      
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
              <div className="w-5 h-5 flex-shrink-0">
                {icon}
              </div>
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {title}
          </span>
        </div>

        <div>
          <h4 className="text-3xl sm:text-4xl font-heading font-semibold text-foreground tracking-tight mb-1">
            {value}
          </h4>
          {subtitle && (
            <p className="text-sm font-medium text-muted-foreground/80">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Decorative gradient corner */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}
