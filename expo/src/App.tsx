import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  MapPin,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { type Database } from "../../lekkside-admin/src/integrations/supabase/types";
import { RegistrationModal } from "./components/RegistrationModal";
import { SupportForm } from "./components/SupportForm";
import { Navbar } from "./components/Navbar";
import { PartnersSection } from "./components/PartnersSection";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { AllEvents } from "./components/AllEvents";
import { AIAssistant } from "./components/AIAssistant";

type Event = Database["public"]["Tables"]["events"]["Row"];

function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);



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
  
  const featuredUpcomingEvents = upcomingEvents.slice(0, 6);
  const hasMoreEvents = upcomingEvents.length > 6;
  const pastEvents = events.filter(
    (e) => e.date && isBefore(new Date(e.date), today),
  );

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div id="home" className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-primary/30">
      <Navbar />
      <RegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-32 pb-16">
        {/* Full width background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero4.jpg" 
            alt="Education event"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/75 mix-blend-multiply" />
          {/* <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" /> */}
        </div>

        <div className="max-w-4xl mx-auto w-full px-8 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Join the experience
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight mb-6 text-white uppercase drop-shadow-sm">
              LEKKSIDE INTERNATIONAL <br />
              <span className="text-primary drop-shadow-md">EDUCATION FAIR</span>
            </h1>

            <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-200 mb-4 leading-snug">
              Where Global Institutions Meet Africa's Best Students
            </h2>

            <p className="text-slate-300 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-light">
              Showcase your institution to thousands of qualified students seeking global education opportunities across West Africa, East Africa, South Africa, North Africa, the Middle East, South Asia, Central Asia, Eurasia, and North/Central America. Secure your spot today!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
               <a href="#upcoming" className="px-10 py-4 rounded-full bg-primary text-white font-bold tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 uppercase text-sm">
                 Explore Events
               </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section
        id="upcoming"
        className="relative z-10 py-24 px-8 bg-zinc-50 border-t border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-12 h-[1px] bg-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
                The Horizon
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-slate-900">
              UPCOMING EVENTS
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[500px] rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="glass p-20 rounded-[3rem] text-center border border-slate-200 bg-white shadow-xl">
            <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <p className="text-slate-500 text-xl font-light italic">
              No upcoming events scheduled yet. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredUpcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleRegister(event)}
                className="group relative h-[500px] rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 cursor-pointer border border-slate-100 shadow-lg flex flex-col"
              >
                {/* Image top half */}
                <div className="relative h-1/2 w-full overflow-hidden">
                  <img
                    src={
                      (event as any).image_url ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    }
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                    Upcoming
                  </div>
                </div>

                {/* Content bottom half */}
                <div className="relative h-1/2 p-8 flex flex-col justify-between bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-primary" />
                      {event.date
                        ? format(new Date(event.date), "MMM dd, yyyy")
                        : "TBA"}
                    </div>

                    <h3 className="text-2xl font-display font-bold leading-tight group-hover:text-primary transition-colors tracking-tight text-slate-900">
                      {event.name}
                    </h3>

                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      {event.venue || "TBA"}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                    Register Now
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}

          {hasMoreEvents && (
            <div className="mt-16 text-center">
              <Link
                to="/all-events"
                className="inline-flex items-center gap-2 px-10 py-4 w-full md:w-auto justify-center rounded-full bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 text-sm"
              >
                View All Events
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Past Events Section */}
      <section className="relative z-10 py-24 px-8 bg-slate-50/50 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-12 h-[1px] bg-slate-300" />
              <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">
                The Archive
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-slate-900">
              PAST MEMORIES
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[200px] rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm"
                />
              ))}
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="p-20 text-center opacity-60 italic font-light text-slate-500">
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
                  className="group flex flex-col sm:flex-row gap-6 p-4 rounded-[2rem] bg-white border border-slate-100 hover:border-primary/30 transition-all duration-500 cursor-pointer overflow-hidden relative shadow-sm hover:shadow-lg"
                >
                  <div className="w-full sm:w-[200px] h-[160px] rounded-2xl overflow-hidden shrink-0 relative bg-slate-100">
                    <img
                      src={
                        (event as any).image_url ||
                        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                      }
                      alt={event.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                  </div>

                  <div className="flex flex-col justify-center gap-3 py-2 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-full">
                        {event.date
                          ? format(new Date(event.date), "MMMM yyyy")
                          : "TBA"}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-slate-800 group-hover:text-primary transition-colors tracking-tight">
                      {event.name}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 font-light leading-relaxed">
                      {event.description ||
                        "A cherished memory from our past gatherings."}
                    </p>
                    <div className="flex items-center gap-2 group/btn mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                        View Details
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <PartnersSection />

      {/* Contact Form Section */}
      <SupportForm />

      <footer className="py-12 px-8 border-t border-slate-200 text-center relative z-10 bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <img
              src="/lekkside-logo.png"
              alt="Lekkside Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-bold font-display tracking-tighter uppercase whitespace-nowrap text-slate-900">
              Lekkside
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">
            © 2026 Lekkside Limited. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Instagram", "Twitter", "LinkedIn"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-[0.2em]"
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-events" element={<AllEvents />} />
      </Routes>
      <AIAssistant />
    </Router>
  );
}

export default App;
