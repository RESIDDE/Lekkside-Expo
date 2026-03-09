import { useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trash2,
  FileX,
  Download,
  Upload,
  Share2,
  FileText,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Search,
  CheckCircle2,
  Clock,
  ImageIcon,
  Pencil,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/stats/ProgressRing";
import { GuestSearch } from "@/components/checkin/GuestSearch";
import { GuestCard } from "@/components/checkin/GuestCard";
import { ImportDialog } from "@/components/import/ImportDialog";
import { ExportButton } from "@/components/export/ExportButton";
import { CheckInStationsDialog } from "@/components/share/CheckInStationsDialog";
import { StationsStatsPanel } from "@/components/share/StationsStatsPanel";
import { FormsButton } from "@/components/forms/FormsButton";
import { BroadcastDialog } from "@/components/broadcast/BroadcastDialog";
import { CreateBoothDialog } from "@/components/booths/CreateBoothDialog";
import { BoothCard } from "@/components/booths/BoothCard";
import { useEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/useEvents";
import {
  useGuests,
  useGuestStats,
  useCheckIn,
  useUndoCheckIn,
  useDeleteAllGuests,
} from "@/hooks/useGuests";
import { useExhibitionBooths } from "@/hooks/useExhibitionBooths";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const stats = useGuestStats(eventId);
  const { data: booths, isLoading: boothsLoading } =
    useExhibitionBooths(eventId);

  const checkIn = useCheckIn();
  const undoCheckIn = useUndoCheckIn();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const deleteAllGuests = useDeleteAllGuests();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogType, setDeleteDialogType] = useState<
    "data" | "event" | null
  >(null);

  // Prepare guests with full name for fuzzy search
  const guestsWithFullName = useMemo(() => {
    if (!guests) return [];
    return guests.map((guest) => {
      const customFieldValues = guest.custom_fields
        ? Object.values(guest.custom_fields as Record<string, string>).join(" ")
        : "";

      return {
        ...guest,
        fullName: `${guest.first_name || ""} ${guest.last_name || ""}`.trim(),
        reverseName:
          `${guest.last_name || ""} ${guest.first_name || ""}`.trim(),
        searchableCustomFields: customFieldValues,
      };
    });
  }, [guests]);

  const filteredGuests = useMemo(() => {
    let filtered = guestsWithFullName;

    if (activeTab === "pending") {
      filtered = filtered.filter((g) => !g.checked_in);
    } else if (activeTab === "checked-in") {
      filtered = filtered.filter((g) => g.checked_in);
    }

    if (searchQuery.trim()) {
      const fuseOptions = {
        keys: [
          { name: "fullName", weight: 2 },
          { name: "email", weight: 1 },
          { name: "phone", weight: 1 },
          { name: "ticket_number", weight: 1 },
          { name: "searchableCustomFields", weight: 0.8 },
        ],
        threshold: 0.4,
      };
      const fuse = new Fuse(filtered, fuseOptions);
      const searchResults = fuse.search(searchQuery.trim());
      filtered = searchResults.map((r) => r.item);
    }

    return filtered;
  }, [guestsWithFullName, searchQuery, activeTab]);

  const handleCheckIn = useCallback(
    async (guestId: string) => {
      if (!user) return;
      try {
        await checkIn.mutateAsync({ guestId, userId: user.id });
        toast({
          title: "Checked in!",
          description: "Guest has been successfully checked in.",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to check in guest.",
          variant: "destructive",
        });
      }
    },
    [user, checkIn, toast],
  );

  const handleUndoCheckIn = useCallback(
    async (guestId: string) => {
      try {
        await undoCheckIn.mutateAsync(guestId);
        toast({
          title: "Check-in undone",
          description: "Guest check-in has been reversed.",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to undo check-in.",
          variant: "destructive",
        });
      }
    },
    [undoCheckIn, toast],
  );

  const handleDeleteEvent = async () => {
    if (!eventId) return;
    try {
      await deleteEvent.mutateAsync(eventId);
      toast({
        title: "Event deleted",
        description: "The event and all its guests have been deleted.",
      });
      navigate("/events");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogType(null);
    }
  };

  const handleDeleteImportedData = async () => {
    if (!eventId) return;
    try {
      await deleteAllGuests.mutateAsync(eventId);
      toast({
        title: "Data deleted",
        description: "All imported guest data has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete data.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogType(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(filePath);

      await updateEvent.mutateAsync({
        id: eventId,
        image_url: publicUrl,
      });

      toast({
        title: "Image updated",
        description: "The event cover image has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to update event image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (eventLoading) {
    return (
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[200px] lg:col-span-2 rounded-3xl" />
            <Skeleton className="h-[200px] rounded-3xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Event not found
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            This event might have been moved or deleted from our servers.
          </p>
          <Button
            variant="outline"
            className="mt-8 h-12 px-8 rounded-2xl border-border/50 font-bold"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="space-y-8 max-w-7xl mx-auto pb-20"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/events")}
                className="group -ml-2 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Back to Events
              </Button>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight text-balance">
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
                  {event.date && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      {format(new Date(event.date), "PPP p")}
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      {event.venue}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2">
                <ImportDialog eventId={event.id} />
                <ExportButton guests={guests || []} eventName={event.name} />
                <div className="hidden sm:block">
                  <CheckInStationsDialog eventId={event.id} />
                </div>
                <FormsButton eventId={event.id} />
                <BroadcastDialog eventId={event.id} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl border-border/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 rounded-2xl shadow-premium border-border/40"
                >
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogType("data")}
                    disabled={stats.total === 0}
                    className="rounded-xl font-medium gap-2 py-3"
                  >
                    <FileX className="w-4 h-4" />
                    Delete imported data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogType("event")}
                    className="text-destructive focus:text-destructive rounded-xl font-medium gap-2 py-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete event permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Hero Image Section */}
        <motion.div variants={itemVariants} className="relative group">
          <div
            className={cn(
              "relative w-full h-[300px] sm:h-[400px] overflow-hidden rounded-[2.5rem] border-2 bg-muted/30 transition-all duration-500",
              event.image_url
                ? "border-transparent"
                : "border-dashed border-border/50",
            )}
          >
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                <ImageIcon className="w-20 h-20" />
                <p className="font-heading font-bold text-xl uppercase tracking-widest">
                  No cover image
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent flex justify-end">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-2xl h-12 px-6 bg-white/90 hover:bg-white text-black font-bold shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {event.image_url ? "Change Cover" : "Add Cover"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main Progress Ring Card */}
          <div className="lg:col-span-5 premium-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-32 h-32" />
            </div>

            <div className="relative">
              <ProgressRing
                percentage={stats.percentage}
                size={180}
                strokeWidth={14}
                showText={false}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-heading font-black text-foreground">
                  {Math.round(stats.percentage)}%
                </span>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mt-1">
                  Completion
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 w-full">
              <div className="text-center space-y-1">
                <p className="text-2xl font-heading font-black text-foreground">
                  {stats.total}
                </p>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Total Guests
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-heading font-black text-[hsl(var(--success))]">
                  {stats.checkedIn}
                </p>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Arrived
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-heading font-black text-[hsl(var(--warning))]">
                  {stats.pending}
                </p>
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Remaining
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Card */}
          <div className="lg:col-span-7 premium-card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                Ticket Distribution
              </h3>
              <Badge
                variant="outline"
                className="rounded-lg bg-muted/30 border-border/50 font-bold px-3 py-1"
              >
                {Object.keys(stats.ticketTypes || {}).length} Types
              </Badge>
            </div>

            <div className="space-y-6 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {stats.ticketTypes &&
              Object.keys(stats.ticketTypes).length > 0 ? (
                Object.entries(stats.ticketTypes).map(([type, data], idx) => {
                  const percent =
                    data.total > 0 ? (data.checkedIn / data.total) * 100 : 0;
                  return (
                    <div key={type} className="space-y-2 group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-muted-foreground">
                            {data.checkedIn}{" "}
                            <span className="opacity-50">/</span> {data.total}
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black">
                            {Math.round(percent)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                          className="h-full bg-primary rounded-full relative"
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">
                    No ticket type data available
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Station Stats */}
        <motion.div variants={itemVariants}>
          <StationsStatsPanel eventId={event.id} />
        </motion.div>

        {/* Guest Management Section */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-black text-foreground">
                  Guest Management
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Manage and check-in your attendees
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <GuestSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full sm:w-auto p-1.5 h-auto bg-muted/30 rounded-[1.5rem] border border-border/40 grid grid-cols-4 sm:flex gap-1">
              {[
                { id: "all", label: "All Guests", color: "bg-primary" },
                {
                  id: "pending",
                  label: "Remaining",
                  color: "bg-[hsl(var(--warning))]",
                },
                {
                  id: "checked-in",
                  label: "Arrived",
                  color: "bg-[hsl(var(--success))]",
                },
                {
                  id: "booths",
                  label: "Exhibition Booths",
                  color: "bg-purple-600",
                },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300",
                    "data-[state=active]:shadow-lg data-[state=active]:text-white",
                    tab.id === "all" && "data-[state=active]:bg-primary",
                    tab.id === "pending" &&
                      "data-[state=active]:bg-[hsl(var(--warning))]",
                    tab.id === "checked-in" &&
                      "data-[state=active]:bg-[hsl(var(--success))]",
                    tab.id === "booths" && "data-[state=active]:bg-purple-600",
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-0 text-[10px] font-black h-5 px-1.5 min-w-[20px] rounded-md"
                    >
                      {tab.id === "all"
                        ? stats.total
                        : tab.id === "pending"
                          ? stats.pending
                          : tab.id === "checked-in"
                            ? stats.checkedIn
                            : booths?.length || 0}
                    </Badge>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value={activeTab}
              className="mt-8 focus-visible:outline-none focus-visible:ring-0"
            >
              <AnimatePresence mode="popLayout">
                {guestsLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {[1, 2, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-32 rounded-3xl" />
                    ))}
                  </motion.div>
                ) : filteredGuests.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filteredGuests.slice(0, 50).map((guest, idx) => (
                      <GuestCard
                        key={guest.id}
                        guest={guest}
                        onCheckIn={handleCheckIn}
                        onUndoCheckIn={handleUndoCheckIn}
                        isLoading={checkIn.isPending || undoCheckIn.isPending}
                        index={idx}
                        eventName={event?.name}
                        eventDate={event?.date}
                        eventVenue={event?.venue}
                      />
                    ))}
                    {filteredGuests.length > 50 && (
                      <div className="col-span-full pt-8 flex flex-col items-center gap-4">
                        <div className="h-px w-24 bg-border/50" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                          Showing 50 of {filteredGuests.length} guests
                        </p>
                        <Button
                          variant="outline"
                          className="rounded-2xl h-12 px-8 border-border/50 text-xs font-black uppercase tracking-widest gap-2"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Load More
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 px-4 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40 text-center"
                  >
                    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    {searchQuery ? (
                      <>
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          No matching guests
                        </h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                          We couldn't find anyone matching "{searchQuery}".
                          Check the spelling or try another term.
                        </p>
                        <Button
                          variant="ghost"
                          onClick={() => setSearchQuery("")}
                          className="mt-6 text-primary font-bold"
                        >
                          Clear Search
                        </Button>
                      </>
                    ) : stats.total === 0 ? (
                      <>
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          Your guest list is empty
                        </h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                          Import your attendees from a CSV or Excel file to
                          begin management.
                        </p>
                        <div className="mt-8">
                          <ImportDialog eventId={event.id} />
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          {activeTab === "pending"
                            ? "All checked in! 🎉"
                            : "No arrivals yet"}
                        </h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                          {activeTab === "pending"
                            ? "Everyone is here. You've reached 100% completion for this segment."
                            : "Waiting for the first guest to arrive. Get ready to check them in!"}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent
              value="booths"
              className="mt-8 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      Exhibition Booths
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage exhibitor booths and access
                    </p>
                  </div>
                  <CreateBoothDialog eventId={event.id} />
                </div>

                <AnimatePresence mode="popLayout">
                  {boothsLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-3xl" />
                      ))}
                    </motion.div>
                  ) : booths && booths.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {booths.map((booth) => (
                        <BoothCard
                          key={booth.id}
                          booth={booth}
                          onViewDetails={(boothId) => {
                            console.log("View booth details:", boothId);
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-24 px-4 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40 text-center"
                    >
                      <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6">
                        <LayoutGrid className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-heading font-bold text-foreground">
                        No exhibition booths yet
                      </h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        Create your first exhibition booth to start managing
                        exhibitor access and leads.
                      </p>
                      <div className="mt-8">
                        <CreateBoothDialog eventId={event.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Dialogs */}
      <AlertDialog
        open={deleteDialogType === "data"}
        onOpenChange={(open) => !open && setDeleteDialogType(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-border/40 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-heading font-bold">
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              This will permanently remove all{" "}
              <span className="font-bold text-foreground">
                {stats.total} guests
              </span>{" "}
              from this event. The event profile will be preserved, but all
              check-in history and metadata will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-2xl border-border/50 font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImportedData}
              className="h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold px-8"
            >
              Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogType === "event"}
        onOpenChange={(open) => !open && setDeleteDialogType(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-border/40 p-8">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-heading font-bold">
              Delete Event permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed">
              This action cannot be undone. You are about to delete{" "}
              <span className="font-bold text-foreground">"{event.name}"</span>{" "}
              and all its associated data, including{" "}
              <span className="font-bold text-foreground">
                {stats.total} guest records
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-2xl border-border/50 font-bold">
              Keep Event
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold px-8 shadow-lg shadow-destructive/20"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
