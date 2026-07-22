import { Users, Calendar, CheckCircle, Clock, Bell, Video, MessageSquare, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/stats/StatsCard';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export default function Dashboard() {
  const { data: events, isLoading } = useEvents();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setNotifications(data as Notification[]);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel('dashboard-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 5))
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications([]);
  };

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
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Platform Overview</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-foreground tracking-tight">
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
              <h2 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-3">
                Recent Events
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-semibold">
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
              <h3 className="text-2xl font-heading font-semibold text-foreground">No events yet</h3>
              <p className="text-muted-foreground mt-2 mb-8 max-w-xs mx-auto font-medium">
                Ready to start? Create your first event and manage your guest list with ease.
              </p>
              <CreateEventDialog />
            </motion.div>
          )}
        </div>
        {/* Recent Notifications Section */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                Incoming Requests
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] uppercase tracking-wider font-semibold">
                  {notifications.length} New
                </span>
              </h2>
              <button onClick={markAllRead} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                Mark all read
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-4 p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {n.type === 'video' ? <Video className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {n.link && (
                      <Link to={n.link} onClick={() => markAsRead(n.id)} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">
                        {n.type === 'video' ? 'Join Room' : 'View Chat'}
                      </Link>
                    )}
                    <button onClick={() => markAsRead(n.id)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </AppLayout>
  );
}
