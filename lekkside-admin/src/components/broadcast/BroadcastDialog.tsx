import { useState } from "react";
import { useBroadcasts } from "@/hooks/useBroadcasts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Send, Loader2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageInbox } from "./MessageInbox";

interface BroadcastDialogProps {
  eventId: string;
}

export function BroadcastDialog({ eventId }: BroadcastDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [expandedBroadcastId, setExpandedBroadcastId] = useState<string | null>(null);
  const { broadcasts, isLoading, createBroadcast } = useBroadcasts(eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBroadcast.mutateAsync({ subject, content });
      setSubject("");
      setContent("");
      // Don't close immediately so user can see success or go to history
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "sending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Megaphone className="h-4 w-4" />
          Broadcast
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Broadcast</DialogTitle>
          <DialogDescription>
            Send announcements and reminders to all registered guests.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose Email</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="history">Broadcast History</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Important Update: Event Schedule Change"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message Content (HTML supported)</Label>
                <Textarea
                  id="content"
                  placeholder="<p>Dear Guest,</p><p>We are excited to announce...</p>"
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Basic HTML tags are supported. A tracking pixel will be automatically added.
                </p>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createBroadcast.isPending || !subject || !content}
                  className="w-full sm:w-auto"
                >
                  {createBroadcast.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Broadcast
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="inbox">
            <MessageInbox />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : broadcasts && broadcasts.length > 0 ? (
              <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <Card key={broadcast.id} className="overflow-hidden">
                    <CardHeader 
                      className="pb-2 cursor-pointer select-none"
                      onClick={() => setExpandedBroadcastId(expandedBroadcastId === broadcast.id ? null : broadcast.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium">
                            {broadcast.subject}
                          </CardTitle>
                          {expandedBroadcastId === broadcast.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <Badge variant={getStatusColor(broadcast.status) as any}>
                          {broadcast.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sent on {format(new Date(broadcast.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </CardHeader>
                    {expandedBroadcastId === broadcast.id && (
                      <CardContent className="pt-0 border-t border-slate-50 mt-2 bg-slate-50/30">
                        <div className="py-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Message Content
                          </p>
                          <div 
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-700 overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: broadcast.content }}
                          />
                        </div>
                      </CardContent>
                    )}
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg">
                          <span className="text-2xl font-semibold">{broadcast.sent_count}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Sent</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg">
                          <span className="text-2xl font-semibold text-blue-600">{broadcast.open_count}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Opened</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg">
                          <span className="text-2xl font-semibold text-green-600">{broadcast.click_count}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Clicked</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No broadcasts sent yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
