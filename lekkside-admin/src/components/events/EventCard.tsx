import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ChevronRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { useGuestStats } from '@/hooks/useGuests';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

type Event = Tables<'events'>;

interface EventCardProps {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const { total, checkedIn, percentage } = useGuestStats(event.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] as const }}
    >
      <Link
        to={`/events/${event.id}`}
        className="group relative block premium-card p-6 h-full hover:border-primary/30 active:scale-[0.98] transition-all duration-500 overflow-hidden"
      >
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Active Event</span>
              </div>
              <h3 className="text-xl font-heading font-extrabold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 truncate">
                {event.name}
              </h3>
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
              <ArrowUpRight className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 mb-8">
            {event.date && (
              <div className="flex items-center text-sm font-medium text-muted-foreground/80">
                <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-primary/60" />
                </div>
                <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {event.venue && (
              <div className="flex items-center text-sm font-medium text-muted-foreground/80">
                <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-primary/60" />
                </div>
                <span className="truncate">{event.venue}</span>
              </div>
            )}

            <div className="flex items-center text-sm font-medium text-muted-foreground/80">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-primary/60" />
              </div>
              <span>{checkedIn} <span className="text-xs opacity-60">/ {total}</span> checked in</span>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-border/40">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2.5">
              <span className="text-muted-foreground/60">Check-in Progress</span>
              <span className="text-primary">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-1.5 bg-muted/50" />
          </div>
        </div>

        {/* Hover Effect Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Link>
    </motion.div>
  );
}
