import { Users, Clock, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStationStats } from "@/hooks/useStations";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StationsStatsPanelProps {
  eventId: string;
}

export function StationsStatsPanel({ eventId }: StationsStatsPanelProps) {
  const { data: stats, isLoading } = useStationStats(eventId);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  const totalCheckIns = stats.reduce((sum, s) => sum + s.check_in_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Live Station Performance
        </h3>
        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wider">
          {totalCheckIns} Total Arrivals
        </span>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((station) => {
          const percentage = totalCheckIns > 0 ? Math.round((station.check_in_count / totalCheckIns) * 100) : 0;
          return (
            <motion.div
              key={station.station_id}
              variants={item}
              className="premium-card p-5 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-bold text-foreground truncate max-w-[120px]">
                      {station.station_name}
                    </p>
                    <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  {station.last_check_in && (
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(station.last_check_in)}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-foreground">{station.check_in_count}</span>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
