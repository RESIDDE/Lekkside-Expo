import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ArrowRight, Zap } from 'lucide-react';

interface LiveAdmin {
  user_id: string;
  meeting_room_id: string;
}

export function AdminLiveEventBanner() {
  const [liveAdmin, setLiveAdmin] = useState<LiveAdmin | null>(null);

  useEffect(() => {
    async function fetchLiveAdmin() {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, meeting_room_id')
        .eq('role', 'member')
        .eq('is_live', true)
        .maybeSingle();

      if (!error && data) {
        setLiveAdmin(data as LiveAdmin);
      }
    }
    fetchLiveAdmin();

    const channel = supabase
      .channel('admin-live-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: "role=eq.member"
        },
        (payload) => {
          const updatedProfile = payload.new;
          if (updatedProfile.is_live && updatedProfile.meeting_room_id) {
            setLiveAdmin({
              user_id: updatedProfile.user_id,
              meeting_room_id: updatedProfile.meeting_room_id
            });
          } else {
            setLiveAdmin(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!liveAdmin) return null;

  const handleJoin = () => {
    const meetingsUrl = import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080';
    window.open(`${meetingsUrl}/meetings/${liveAdmin.meeting_room_id}`, "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full mb-8 relative z-40"
      >
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-3xl p-1 shadow-[0_8px_30px_rgba(239,68,68,0.3)] relative overflow-hidden group">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-yellow-400 opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>

          <div className="bg-black/10 backdrop-blur-sm rounded-[1.4rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 border border-white/10">
            <div className="flex items-center gap-6 w-full sm:w-auto">
              {/* Icon Container */}
              <div className="w-16 h-16 shrink-0 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50"></div>
                <Zap className="w-8 h-8 text-white relative z-10 animate-pulse" />
              </div>
              
              {/* Content */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span className="text-white/90 text-sm font-bold tracking-widest uppercase">Main Event Live</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm leading-tight">
                  Join the General Session!
                </h3>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleJoin}
              className="w-full sm:w-auto group/btn flex items-center justify-center gap-3 bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-red-50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl"
            >
              <Video className="w-6 h-6" />
              <span>Join Now</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
