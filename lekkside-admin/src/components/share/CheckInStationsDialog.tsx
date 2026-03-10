import { useState } from "react";
import { 
  Users, 
  Copy, 
  Check, 
  QrCode, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Monitor,
  Activity,
  ArrowRight,
  Signal,
  MoreVertical,
  ExternalLink,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useStations, useCreateStation, useToggleStation, useDeleteStation, useStationStats } from "@/hooks/useStations";
import { StationQRCodeDialog } from "./StationQRCodeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface CheckInStationsDialogProps {
  eventId: string;
}

export function CheckInStationsDialog({ eventId }: CheckInStationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrStation, setQrStation] = useState<{ id: string; name: string } | null>(null);
  
  const { toast } = useToast();
  const { data: stations, isLoading } = useStations(eventId);
  const { data: stats } = useStationStats(eventId);
  const createStation = useCreateStation();
  const toggleStation = useToggleStation();
  const deleteStation = useDeleteStation();

  const getStationUrl = (stationId: string) => 
    `${window.location.origin}/checkin/${stationId}`;

  const handleCopy = async (stationId: string) => {
    try {
      await navigator.clipboard.writeText(getStationUrl(stationId));
      setCopiedId(stationId);
      toast({
        title: "Link Copied",
        description: "Station access URL is now in your clipboard.",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the URL.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (!newStationName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please identify this station with a unique name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStation.mutateAsync({ eventId, name: newStationName.trim() });
      setNewStationName("");
      toast({
        title: "Deployment Successful",
        description: "New check-in station is live and ready.",
      });
    } catch {
      toast({
        title: "System Error",
        description: "Failed to deploy new station.",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (stationId: string, currentStatus: boolean) => {
    try {
      await toggleStation.mutateAsync({ stationId, isActive: !currentStatus });
      toast({
        title: currentStatus ? "Station Offline" : "Station Online",
        description: currentStatus 
          ? "Access to this station has been revoked." 
          : "Station is now accepting check-ins.",
      });
    } catch {
      toast({
        title: "Toggle Failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (stationId: string, stationName: string) => {
    try {
      await deleteStation.mutateAsync(stationId);
      toast({
        title: "Station Removed",
        description: `"${stationName}" has been decommissioned.`,
      });
    } catch {
      toast({
        title: "Removal Failed",
        variant: "destructive",
      });
    }
  };

  const getStationStats = (stationId: string) => {
    return stats?.find(s => s.station_id === stationId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="h-11 px-6 rounded-2xl border-border/50 bg-white hover:bg-muted font-semibold text-muted-foreground gap-2 transition-all shadow-sm"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Check-in Stations</span>
            <span className="sm:hidden">Stations</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
          <div className="relative">
            {/* Header Decoration */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
            
            <div className="p-8">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5 text-primary">
                    <Monitor className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <DialogTitle className="text-2xl font-heading font-semibold text-foreground">
                      Station Grid
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground font-medium">
                      Manage distributed access points for real-time check-in synchronization.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Create new station */}
              <div className="relative mb-8 group">
                <Input
                  placeholder="Identify new station (e.g. South Gate)"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="h-14 pl-5 pr-16 rounded-2xl border-border/40 focus-visible:ring-primary/20 bg-muted/20 font-semibold transition-all group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-primary/5"
                />
                <Button 
                  onClick={handleCreate} 
                  disabled={createStation.isPending}
                  className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Stations list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Global Network</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                    <span className="text-[10px] font-semibold text-[hsl(var(--success))] uppercase tracking-widest">Active nodes</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-[1.8rem]" />)}
                    </div>
                  ) : stations?.length === 0 ? (
                    <div className="text-center py-12 px-6 rounded-[2rem] bg-muted/10 border-2 border-dashed border-border/40">
                      <Signal className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-sm font-semibold text-muted-foreground">No active nodes detected</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Deploy a station to start accepting attendees.</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {stations?.map((station) => {
                        const stationStats = getStationStats(station.id);
                        return (
                          <motion.div
                            key={station.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            className={cn(
                              "relative group p-5 rounded-[1.8rem] border border-border/40 transition-all duration-300",
                              station.is_active 
                                ? "bg-white hover:border-primary/20 shadow-sm hover:shadow-premium" 
                                : "bg-muted/30 opacity-60 grayscale-[0.8]"
                            )}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-heading font-semibold text-foreground truncate">{station.name}</h4>
                                  {!station.is_active && (
                                    <span className="text-[9px] font-semibold uppercase tracking-widest bg-muted text-muted-foreground px-2 py-0.5 rounded">Offline</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                                  <span className="flex items-center gap-1.5">
                                    <Activity className="h-3 w-3 text-primary" />
                                    {stationStats?.check_in_count || 0} Processed
                                  </span>
                                  {stationStats?.last_check_in && (
                                    <span>• {formatTimeAgo(stationStats.last_check_in)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                                  onClick={() => handleCopy(station.id)}
                                  title="Copy Access Link"
                                >
                                  {copiedId === station.id ? (
                                    <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                                  ) : (
                                    <ExternalLink className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-premium border-border/40">
                                    <DropdownMenuItem onClick={() => setQrStation({ id: station.id, name: station.name })} className="rounded-xl py-3 font-medium gap-3">
                                      <QrCode className="w-4 h-4 text-primary" />
                                      Station Passport (QR)
                                    </DropdownMenuItem>
                                    <div className="h-px bg-border/40 my-1 mx-2" />
                                    <DropdownMenuItem onClick={() => handleToggle(station.id, station.is_active)} className="rounded-xl py-3 font-medium gap-3">
                                      {station.is_active ? (
                                        <>
                                          <ToggleRight className="w-4 h-4 text-[hsl(var(--success))]" />
                                          Deactivate Node
                                        </>
                                      ) : (
                                        <>
                                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                          Activate Node
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(station.id, station.name)} 
                                      className="rounded-xl py-3 font-medium gap-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                      <Trash className="w-4 h-4" />
                                      Decommission Station
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {qrStation && (
        <StationQRCodeDialog
          stationId={qrStation.id}
          stationName={qrStation.name}
          open={!!qrStation}
          onOpenChange={(open) => !open && setQrStation(null)}
        />
      )}
    </>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just active";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
