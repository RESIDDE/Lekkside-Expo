import { useState, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import { Search, Users, UserCheck, Clock, Calendar, MapPin, LayoutGrid, ListChecks, ArrowLeft, Loader2, ShieldCheck, Scan } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestCard } from "@/components/checkin/GuestCard";
import { QRScannerModal } from "@/components/checkin/QRScannerModal";
import { ProgressRing } from "@/components/stats/ProgressRing";
import { useGuests, useGuestStats, useCheckIn, useUndoCheckIn } from "@/hooks/useGuests";
import { useStation } from "@/hooks/useStations";
import { useToast } from "@/hooks/use-toast";
import lekkLogo from "@/assets/lekkside-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CheckInOnly() {
  const { stationId } = useParams<{ stationId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "checked-in">("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { toast } = useToast();

  // Fetch station details to get event ID
  const { data: stationData, isLoading: stationLoading, error: stationError } = useStation(stationId);
  
  const eventId = stationData?.event_id;
  const event = stationData?.events;
  const station = stationData;

  const { data: guests = [], isLoading: guestsLoading } = useGuests(eventId);
  const stats = useGuestStats(eventId);
  const checkIn = useCheckIn();
  const undoCheckIn = useUndoCheckIn();

  // Prepare guests with full name for fuzzy search
  const guestsWithFullName = useMemo(() => {
    return guests.map(guest => ({
      ...guest,
      fullName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim(),
      reverseName: `${guest.last_name || ''} ${guest.first_name || ''}`.trim(),
    }));
  }, [guests]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(guestsWithFullName, {
      keys: [
        { name: 'fullName', weight: 2 },
        { name: 'reverseName', weight: 2 },
        { name: 'first_name', weight: 1.5 },
        { name: 'last_name', weight: 1.5 },
        { name: 'email', weight: 1 },
        { name: 'phone', weight: 1 },
        { name: 'ticket_number', weight: 1 },
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [guestsWithFullName]);

  const filteredGuests = useMemo(() => {
    let result = guestsWithFullName;

    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim());
      result = searchResults.map(r => r.item);
    }

    if (activeTab === "pending") {
      result = result.filter((guest) => !guest.checked_in);
    } else if (activeTab === "checked-in") {
      result = result.filter((guest) => guest.checked_in);
    }

    return result;
  }, [guestsWithFullName, searchQuery, activeTab, fuse]);

  const handleCheckIn = useCallback((guestId: string) => {
    checkIn.mutate(
      { guestId, userId: null, stationId: stationId || null },
      {
        onSuccess: () => {
          toast({
            title: "Access Granted",
            description: "Attendee ID verified and registered.",
          });
        },
        onError: () => {
          toast({
            title: "System Error",
            description: "Credential verification failed. Please retry.",
            variant: "destructive",
          });
        },
      }
    );
  }, [checkIn, stationId, toast]);

  const handleUndoCheckIn = useCallback((guestId: string) => {
    undoCheckIn.mutate(guestId, {
      onSuccess: () => {
        toast({
          title: "Session Reset",
          description: "Attendee status reverted to pending.",
        });
      },
      onError: () => {
        toast({
          title: "Undo failed",
          description: "Failed to revert status. System sync required.",
          variant: "destructive",
        });
      },
    });
  }, [undoCheckIn, toast]);

  // Virtual list for performance
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredGuests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 10,
  });

  if (stationLoading || guestsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-center space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">Initializing Station</p>
          <p className="text-xs text-muted-foreground font-medium">Synchronizing attendee database...</p>
        </div>
      </div>
    );
  }

  if (stationError || !station || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-premium border border-border/40 text-center max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-destructive/5 rounded-full flex items-center justify-center mx-auto text-destructive">
            <LayoutGrid className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-semibold text-foreground">Terminal Offline</h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              This check-in point endpoint is inaccessible or the event has been terminated.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!station.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-premium border border-border/40 text-center max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-semibold text-foreground">Station Locked</h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              The organizer has suspended operations at this terminal. Please contact HQ.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-30 transition-all duration-500">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src={lekkLogo} alt="Lekkside" className="h-10 w-auto object-contain cursor-pointer" 
            />
            <div className="h-8 w-px bg-border/40 hidden sm:block" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Check-in Station</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              </div>
              <span className="text-lg font-heading font-semibold text-foreground tracking-tight">{station.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-border/40 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-[hsl(var(--success))]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Verified Station</span>
             </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-8 max-w-5xl">
        {/* Unified Event Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-premium border border-border/40 group transition-all"
        >
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] grayscale pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
             <LayoutGrid className="w-64 h-64 -mr-20 -mt-20" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/10 text-[9px] font-semibold uppercase tracking-[0.2em]">
                 <ShieldCheck className="w-3 h-3" /> System Ready
              </div>
              <h1 className="text-4xl font-heading font-semibold text-foreground leading-[1.1] tracking-tight">{event.name}</h1>
              <div className="flex flex-wrap gap-6 text-sm">
                {event.date && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-muted-foreground">
                       <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Schedule</span>
                       <span className="font-semibold text-foreground">{format(new Date(event.date), "PPP")}</span>
                    </div>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-muted-foreground">
                       <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Location</span>
                       <span className="font-semibold text-foreground">{event.venue}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Stats Ring */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-border/20 flex items-center gap-8 shadow-sm">
              <ProgressRing percentage={stats.percentage} size={110} strokeWidth={9} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest">Registrations</span>
                  </div>
                  <div className="text-2xl font-semibold text-foreground tracking-tighter">{stats.total}</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[hsl(var(--success))] mb-1">
                    <UserCheck className="h-3 w-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest">Arrived</span>
                  </div>
                  <div className="text-2xl font-semibold text-[hsl(var(--success))] tracking-tighter">{stats.checkedIn}</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest">Pending</span>
                  </div>
                  <div className="text-2xl font-semibold text-amber-500 tracking-tighter">{stats.pending}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Controls */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center">
          <div className="flex-1 flex gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-16 pl-14 pr-6 rounded-[1.5rem] bg-white border-border/40 shadow-sm font-semibold text-lg focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
              {filteredGuests.length > 0 && searchQuery && (
                 <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-1 rounded-md">
                   {filteredGuests.length} Results
                 </div>
              )}
            </div>
            
            <Button 
               onClick={() => setIsScannerOpen(true)}
               className="h-16 w-16 shrink-0 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all"
            >
               <Scan className="w-6 h-6" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full md:w-auto">
            <TabsList className="h-16 bg-white border border-border/40 p-2 rounded-[1.5rem] shadow-sm flex items-stretch">
              <TabsTrigger 
                value="all" 
                className="flex-1 md:px-8 rounded-xl font-semibold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg shadow-primary/20 transition-all"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="flex-1 md:px-8 rounded-xl font-semibold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg shadow-primary/20 transition-all"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="checked-in" 
                className="flex-1 md:px-8 rounded-xl font-semibold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg shadow-primary/20 transition-all"
              >
                Checked In
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Virtualized Interface */}
        <AnimatePresence mode="wait">
          {filteredGuests.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-border/40 border-dashed space-y-4"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto text-muted-foreground/30">
                 <Users className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="font-heading font-semibold text-foreground text-xl">No Guests Found</p>
                <p className="text-sm text-muted-foreground font-medium max-w-[280px] mx-auto">
                  {searchQuery
                    ? "Your search returned no matches."
                    : stats.total === 0
                    ? "The registration list is currently empty."
                    : "No guests match the selected filter."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2.5rem] bg-white border border-border/40 shadow-premium overflow-hidden"
            >
              <div
                ref={parentRef}
                className="h-[calc(100vh-500px)] min-h-[400px] overflow-auto scrollbar-hide p-6 sm:p-8"
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const guest = filteredGuests[virtualRow.index];
                    return (
                      <div
                        key={guest.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          padding: '8px 0',
                        }}
                      >
                         <GuestCard
                          guest={guest}
                          onCheckIn={handleCheckIn}
                          onUndoCheckIn={handleUndoCheckIn}
                          isLoading={checkIn.isPending || undoCheckIn.isPending}
                          eventName={event?.name}
                          eventDate={event?.date}
                          eventVenue={event?.venue}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-slate-50/80 p-4 border-t border-border/40 flex items-center justify-between px-10">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Connected</span>
                 </div>
                 <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/40">Lekkside Check-in System v3.2.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <QRScannerModal 
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(data) => {
            setSearchQuery(data);
            setIsScannerOpen(false);
          }}
        />
      </main>
    </div>
  );
}
