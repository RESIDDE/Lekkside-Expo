import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { type Database } from "../../../lekkside-admin/src/integrations/supabase/types";
import { RegistrationModal } from "./RegistrationModal";
import { Navbar } from "./Navbar";
import { format, startOfToday } from "date-fns";

type Event = Database["public"]["Tables"]["events"]["Row"];

const EVENTS_PER_PAGE = 9;

export function AllEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error, count } = await supabase
          .from("events")
          .select("*", { count: "exact" })
          .gte("date", startOfToday().toISOString())
          .order("date", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
        setTotalPages(Math.ceil((count || 0) / EVENTS_PER_PAGE));
      } catch (err: any) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
  };

  const paginatedEvents = events.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24">
      <Navbar />
      <RegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-[1px] bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
              All Events
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900 uppercase">
            UPCOMING EXPLORATIONS
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[500px] rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-20 rounded-[3rem] text-center border border-slate-200 bg-white shadow-xl">
            <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <p className="text-slate-500 text-xl font-light italic">
              No events found. Stay tuned!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  onClick={() => handleRegister(event)}
                  className="group relative h-[500px] rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 cursor-pointer border border-slate-100 shadow-lg flex flex-col"
                >
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2 rounded-full border border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        currentPage === i + 1
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 rounded-full border border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
