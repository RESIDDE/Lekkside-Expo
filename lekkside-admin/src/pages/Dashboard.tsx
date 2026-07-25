import { Users, Calendar, CheckCircle, Clock, Bell, Video, MessageSquare, Check, Building2, MonitorSmartphone, Handshake, BookOpen, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/stats/StatsCard';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { useEvents } from '@/hooks/useEvents';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
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
  const { metrics, totalGuests, totalLeads, loading: metricsLoading, counts } = useDashboardMetrics();
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

        {/* Advanced Mission Control - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Main Stats */}
          <StatsCard
            index={0}
            title="Total Events"
            value={totalEvents}
            icon={<Calendar />}
          />
          <StatsCard
            index={1}
            title="Total Guests"
            value={metricsLoading ? "..." : totalGuests}
            subtitle="Platform-wide Attendees"
            icon={<Users />}
          />
          <StatsCard
            index={2}
            title="Total Leads"
            value={metricsLoading ? "..." : totalLeads}
            subtitle="Captured by Exhibitors"
            icon={<Handshake />}
          />
          <StatsCard
            index={3}
            title="Upcoming"
            value={upcomingEvents.length}
            subtitle="Events Scheduled"
            icon={<Clock />}
          />
          
          {/* Quick Access Grid */}
          <Link to="/universities" className="group col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 relative overflow-hidden text-white hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500"><Building2 size={80} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <Building2 size={32} />
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-md">
                  {metricsLoading ? "..." : counts.universities} Registered
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-heading mb-1">Universities</h3>
                <p className="text-white/80 font-medium">Manage exhibitors & directory</p>
              </div>
            </div>
          </Link>

          <Link to="/meetings" className="group bg-emerald-500 rounded-3xl p-6 relative overflow-hidden text-white hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:scale-110 transition-transform duration-500"><Video size={100} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <Video size={28} />
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                  {metricsLoading ? "..." : counts.meetings} Requests
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading mb-1">Meetings</h3>
                <p className="text-white/80 text-sm font-medium">Virtual rooms</p>
              </div>
            </div>
          </Link>

          <Link to="/applications" className="group bg-rose-500 rounded-3xl p-6 relative overflow-hidden text-white hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:scale-110 transition-transform duration-500"><BookOpen size={100} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <BookOpen size={28} />
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                  {metricsLoading ? "..." : counts.applications} Apps
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading mb-1">Applications</h3>
                <p className="text-white/80 text-sm font-medium">Student submissions</p>
              </div>
            </div>
          </Link>
          
          <Link to="/screenings" className="group bg-amber-500 rounded-3xl p-6 relative overflow-hidden text-white hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:scale-110 transition-transform duration-500"><FileText size={100} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <FileText size={28} />
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                  {metricsLoading ? "..." : counts.screenings} Reviews
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading mb-1">Screenings</h3>
                <p className="text-white/80 text-sm font-medium">Review forms</p>
              </div>
            </div>
          </Link>
          
          <Link to="/analytics" className="group col-span-1 md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 relative overflow-hidden text-white hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500"><MonitorSmartphone size={80} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <MonitorSmartphone size={32} className="mb-4" />
              <div>
                <h3 className="text-2xl font-bold font-heading mb-1">Analytics</h3>
                <p className="text-white/80 font-medium">Platform performance & reports</p>
              </div>
            </div>
          </Link>
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
                <EventCard key={event.id} event={event} index={idx} metrics={metrics[event.id]} />
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
