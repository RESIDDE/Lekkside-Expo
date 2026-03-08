import { Calendar, Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Events() {
  const { data: events, isLoading } = useEvents();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-10 sm:space-y-14">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-primary mb-1">
              <Calendar className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-foreground tracking-tight">
              Events
            </h1>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg font-medium leading-relaxed">
              Organize, track, and manage all your events in one sophisticated workspace.
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Search events..." 
                className="pl-11 h-12 w-64 rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <CreateEventDialog />
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[280px] rounded-3xl bg-muted/50" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {events.map((event, idx) => (
              <EventCard key={event.id} event={event} index={idx} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 sm:py-32 bg-card/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-border/60 mx-auto max-w-4xl"
          >
            <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Calendar className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">No events found</h3>
            <p className="text-muted-foreground mt-3 mb-10 max-w-sm mx-auto text-lg font-medium leading-relaxed">
              Your event list is currently empty. Begin your journey by creating a new event today.
            </p>
            <CreateEventDialog />
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
