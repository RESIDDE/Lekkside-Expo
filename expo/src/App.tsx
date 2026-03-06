import { useEffect, useState } from "react";
// Force rebuild comment
import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, CalendarDays, MapPin, ArrowRight, ChevronRight, Instagram, Twitter, Linkedin } from 'lucide-react';
import { supabase } from "./lib/supabase";
import { type Database } from "../../lekkside-admin/src/integrations/supabase/types";
import { RegistrationModal } from "./components/RegistrationModal";
import { SupportForm } from "./components/SupportForm";
import { format, isAfter, isBefore, startOfToday } from "date-fns";

type Event = Database["public"]["Tables"]["events"]["Row"];

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { scrollYProgress } = useScroll();

  // Parallax values for hero
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("date", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const today = startOfToday();
  const upcomingEvents = events.filter(
    (e) =>
      (e.date && isAfter(new Date(e.date), today)) ||
      (e.date && new Date(e.date).getTime() === today.getTime()),
  );
  const pastEvents = events.filter(
    (e) => e.date && isBefore(new Date(e.date), today),
  );

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden relative selection:bg-purple-500/30">
      <RegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden px-8">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center max-w-5xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              ease: [0.215, 0.61, 0.355, 1],
            }}
            className="text-[12vw] md:text-[8vw] font-display font-bold leading-[0.9] tracking-tighter mb-8"
          >
            EVENTS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
              MANIFESTO
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-white/40 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed"
          >
            Explore upcoming events and revisit cherished memories that shape
            our community.
          </motion.p>
        </motion.div>

        {/* Decorative Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40 rotate-90 origin-right">
            Scroll Down
          </span>
        </motion.div>
      </section>

      {/* Upcoming Events Section */}
      <section
        id="upcoming"
        className="relative z-10 py-32 px-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-12 h-[1px] bg-purple-500" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-[0.3em]">
                The Horizon
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
              UPCOMING EVENTS
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[500px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="glass p-20 rounded-[3rem] text-center border border-white/5 bg-white/5 backdrop-blur-3xl">
            <CalendarDays className="w-16 h-16 text-white/10 mx-auto mb-6" />
            <p className="text-white/40 text-xl font-light italic">
              No upcoming events scheduled yet. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleRegister(event)}
                className="group relative h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all duration-700 hover:-translate-y-2 shadow-2xl cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={
                      (event as any).image_url ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    }
                    alt={event.name}
                    className="w-full h-full object-cover grayscale-[0.2] brightness-[0.6] group-hover:scale-110 transition-transform duration-1000 group-hover:grayscale-0 group-hover:brightness-[0.4]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                </div>

                {/* Content */}
                <div className="relative h-full p-10 flex flex-col justify-end">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-widest backdrop-blur-md">
                        Upcoming
                      </div>
                      <div className="flex items-center gap-2 text-white/60 text-xs tracking-tight">
                        <Calendar className="w-3 h-3" />
                        {event.date
                          ? format(new Date(event.date), "MMM dd, yyyy")
                          : "TBA"}
                      </div>
                    </div>

                    <h3 className="text-3xl font-display font-bold leading-tight group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                      {event.name}
                    </h3>

                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      {event.venue || "TBA"}
                    </div>

                    <p className="text-white/60 text-sm line-clamp-3 font-light leading-relaxed h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      {event.description}
                    </p>

                    <div className="pt-4 flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                      View Details{" "}
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Past Events Section */}
      <section className="relative z-10 py-32 px-8 bg-white/[0.02] border-y border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-12 h-[1px] bg-orange-500" />
              <span className="text-orange-400 text-xs font-bold uppercase tracking-[0.3em]">
                The Archive
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
              PAST MEMORIES
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[200px] rounded-2xl bg-white/5 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="p-20 text-center opacity-40 italic font-light">
              No past events archived yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  onClick={() => handleRegister(event)}
                  className="group flex flex-col sm:flex-row gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-orange-500/20 transition-all duration-500 cursor-pointer overflow-hidden relative"
                >
                  <div className="w-full sm:w-[200px] h-[160px] rounded-2xl overflow-hidden shrink-0 relative bg-black">
                    <img
                      src={
                        (event as any).image_url ||
                        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                      }
                      alt={event.name}
                      className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                        {event.date
                          ? format(new Date(event.date), "MMMM yyyy")
                          : "TBA"}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-tight">
                      {event.name}
                    </h3>
                    <p className="text-white/40 text-sm line-clamp-2 font-light leading-relaxed">
                      {event.description ||
                        "A cherished memory from our past gatherings."}
                    </p>
                    <div className="flex items-center gap-2 group/btn">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60 group-hover:text-orange-400 transition-colors">
                        Relive Memory
                      </span>
                      <ChevronRight className="w-3 h-3 text-orange-500/60 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Form Section */}
      <SupportForm />

      <footer className="py-12 px-8 border-t border-white/5 text-center relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <img 
              src="/lekkside-logo.png" 
              alt="Lekkside Logo" 
              className="h-8 w-auto object-contain brightness-0 invert opacity-80"
            />
            <span className="text-lg font-bold font-display tracking-tighter uppercase whitespace-nowrap">
              Lekkside
            </span>
          </div>
          <p className="text-white/20 text-[10px] font-bold tracking-[0.3em] uppercase">
            © 2026 Lekkside Limited. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Instagram", "Twitter", "LinkedIn"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[10px] font-bold text-white/40 hover:text-purple-400 transition-colors uppercase tracking-[0.2em]"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
