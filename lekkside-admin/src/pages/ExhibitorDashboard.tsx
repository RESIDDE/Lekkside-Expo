import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download, LogOut, Star, StarOff, StickyNote, Search, Filter, Building2, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { LeadNotesDialog } from "@/components/exhibitor/LeadNotesDialog";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  ticket_type: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
}

interface BoothLead {
  id: string;
  guest_id: string;
  is_relevant: boolean;
  tags: string[];
  lead_score: number;
  guest?: Guest;
}

interface BoothInfo {
  id: string;
  booth_name: string;
  booth_number: string;
  event_id: string;
}

export default function ExhibitorDashboard() {
  const [searchParams] = useSearchParams();
  const boothId = searchParams.get("booth");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [boothInfo, setBoothInfo] = useState<BoothInfo | null>(null);
  const [attendees, setAttendees] = useState<Guest[]>([]);
  const [leads, setLeads] = useState<BoothLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "relevant" | "not-relevant">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<BoothLead | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  useEffect(() => {
    if (!boothId) {
      toast({
        title: "Invalid Access",
        description: "No booth ID provided.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadBoothData();
  }, [boothId]);

  const loadBoothData = async () => {
    if (!boothId) return;

    try {
      setIsLoading(true);

      const { data: booth, error: boothError } = await supabase
        .from("exhibition_booths")
        .select("id, booth_name, booth_number, event_id")
        .eq("id", boothId)
        .single();

      if (boothError) throw boothError;
      setBoothInfo(booth);

      const { data: guests, error: guestsError } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", booth.event_id)
        .order("last_name");

      if (guestsError) throw guestsError;
      setAttendees(guests || []);

      const { data: boothLeads, error: leadsError } = await supabase
        .from("booth_leads")
        .select(`
          *,
          guest:guests(*)
        `)
        .eq("booth_id", boothId);

      if (leadsError) throw leadsError;
      setLeads(boothLeads || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load booth data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLeadRelevance = async (guestId: string, currentStatus: boolean) => {
    if (!boothId) return;

    try {
      const existingLead = leads.find((l) => l.guest_id === guestId);

      if (existingLead) {
        const { error } = await supabase
          .from("booth_leads")
          .update({ is_relevant: !currentStatus })
          .eq("id", existingLead.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("booth_leads")
          .insert({
            booth_id: boothId,
            guest_id: guestId,
            is_relevant: true,
          });

        if (error) throw error;
      }

      await loadBoothData();

      toast({
        title: "Lead Updated",
        description: existingLead && !currentStatus
          ? "Lead marked as not relevant."
          : "Lead marked as relevant.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead status.",
        variant: "destructive",
      });
    }
  };

  const handleAddNotes = (lead: BoothLead) => {
    setSelectedLead(lead);
    setNotesDialogOpen(true);
  };

  const handleExport = (filter: "all" | "relevant" | "not-relevant") => {
    let dataToExport: Guest[] = [];

    if (filter === "all") {
      dataToExport = attendees;
    } else if (filter === "relevant") {
      const relevantGuestIds = leads.filter((l) => l.is_relevant).map((l) => l.guest_id);
      dataToExport = attendees.filter((a) => relevantGuestIds.includes(a.id));
    } else {
      const notRelevantGuestIds = leads.filter((l) => !l.is_relevant).map((l) => l.guest_id);
      dataToExport = attendees.filter((a) => notRelevantGuestIds.includes(a.id));
    }

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There are no attendees to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Phone", "Ticket Type", "Checked In", "Check-in Time"];
    const rows = dataToExport.map((guest) => [
      guest.first_name || "",
      guest.last_name || "",
      guest.email || "",
      guest.phone || "",
      guest.ticket_type || "",
      guest.checked_in ? "Yes" : "No",
      guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString() : "",
    ]);

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${boothInfo?.booth_number}_${filter}_leads_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `CSV file with ${dataToExport.length} records has been downloaded.`,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;

    const lead = leads.find((l) => l.guest_id === attendee.id);
    if (filterStatus === "relevant") {
      return matchesSearch && lead?.is_relevant === true;
    }
    if (filterStatus === "not-relevant") {
      return matchesSearch && lead?.is_relevant === false;
    }

    return matchesSearch;
  });

  const relevantCount = leads.filter((l) => l.is_relevant).length;
  const notRelevantCount = leads.filter((l) => !l.is_relevant).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-foreground">
                {boothInfo?.booth_name}
              </h1>
              <p className="text-sm text-muted-foreground font-bold">
                Booth {boothInfo?.booth_number}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="gap-2 rounded-2xl font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-3xl border-border/40 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Attendees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-black text-foreground">{attendees.length}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/40 shadow-lg bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Relevant Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-black text-green-700">{relevantCount}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/40 shadow-lg bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Not Relevant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-black text-orange-700">{notRelevantCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border/40 shadow-xl">
          <CardHeader className="border-b border-border/40 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl font-heading font-black">Event Attendees</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-2xl bg-muted/20 border-border/40"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-2xl font-bold">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                    <DropdownMenuItem onClick={() => handleExport("all")}>
                      All Attendees ({attendees.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("relevant")}>
                      Relevant Leads ({relevantCount})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("not-relevant")}>
                      Not Relevant ({notRelevantCount})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-6 rounded-2xl">
                <TabsTrigger value="all" className="rounded-xl font-bold">
                  All ({attendees.length})
                </TabsTrigger>
                <TabsTrigger value="relevant" className="rounded-xl font-bold">
                  Relevant ({relevantCount})
                </TabsTrigger>
                <TabsTrigger value="not-relevant" className="rounded-xl font-bold">
                  Not Relevant ({notRelevantCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filterStatus} className="mt-0">
                <div className="rounded-2xl border border-border/40 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-black uppercase text-xs">Name</TableHead>
                        <TableHead className="font-black uppercase text-xs">Email</TableHead>
                        <TableHead className="font-black uppercase text-xs">Phone</TableHead>
                        <TableHead className="font-black uppercase text-xs">Ticket Type</TableHead>
                        <TableHead className="font-black uppercase text-xs">Status</TableHead>
                        <TableHead className="font-black uppercase text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            No attendees found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendees.map((attendee) => {
                          const lead = leads.find((l) => l.guest_id === attendee.id);
                          return (
                            <TableRow key={attendee.id}>
                              <TableCell className="font-bold">
                                {attendee.first_name} {attendee.last_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                              <TableCell className="text-muted-foreground">{attendee.phone || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="rounded-full">
                                  {attendee.ticket_type || "Standard"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {attendee.checked_in ? (
                                  <Badge className="rounded-full bg-green-500">Checked In</Badge>
                                ) : (
                                  <Badge variant="outline" className="rounded-full">Pending</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant={lead?.is_relevant ? "default" : "outline"}
                                    onClick={() => toggleLeadRelevance(attendee.id, lead?.is_relevant || false)}
                                    className="rounded-xl gap-1"
                                  >
                                    {lead?.is_relevant ? (
                                      <>
                                        <Star className="w-3 h-3 fill-current" />
                                        Relevant
                                      </>
                                    ) : (
                                      <>
                                        <StarOff className="w-3 h-3" />
                                        Mark Relevant
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (lead) {
                                        handleAddNotes(lead);
                                      } else {
                                        toast({
                                          title: "Mark as Lead First",
                                          description: "Please mark this attendee as relevant or not relevant before adding notes.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="rounded-xl gap-1"
                                  >
                                    <StickyNote className="w-3 h-3" />
                                    Notes
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedLead && (
        <LeadNotesDialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          lead={selectedLead}
          onNotesUpdated={loadBoothData}
        />
      )}
    </div>
  );
}
