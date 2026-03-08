import { Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/stats/StatsCard';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: events, isLoading } = useEvents();

  const upcomingEvents = events?.filter(e => !e.date || new Date(e.date) >= new Date()) || [];
  const totalEvents = events?.length ?? 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Platform Overview</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg font-medium leading-relaxed">
              Welcome back. Here's a real-time overview of your events and guest engagement.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CreateEventDialog />
          </motion.div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            index={0}
            title="Total Events"
            value={totalEvents}
            icon={<Calendar />}
          />
          <StatsCard
            index={1}
            title="Upcoming"
            value={upcomingEvents.length}
            icon={<Clock />}
          />
          <StatsCard
            index={2}
            title="Total Guests"
            value="—"
            subtitle="Across all events"
            icon={<Users />}
          />
          <StatsCard
            index={3}
            title="Quick Check-in"
            value="—"
            subtitle="Today's activity"
            icon={<CheckCircle />}
          />
        </div>

        {/* Recent Events Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
                Recent Events
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-extrabold">
                  {events?.length || 0} Total
                </span>
              </h2>
            </motion.div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[280px] rounded-3xl bg-muted/50" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {events.slice(0, 6).map((event, idx) => (
                <EventCard key={event.id} event={event} index={idx} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 sm:py-32 bg-card/30 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-border/60"
            >
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Calendar className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground">No events yet</h3>
              <p className="text-muted-foreground mt-2 mb-8 max-w-xs mx-auto font-medium">
                Ready to start? Create your first event and manage your guest list with ease.
              </p>
              <CreateEventDialog />
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
