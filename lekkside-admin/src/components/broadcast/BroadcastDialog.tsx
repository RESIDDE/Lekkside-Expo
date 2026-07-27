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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Send, Loader2, ChevronDown, ChevronUp, Eye, ArrowLeft } from "lucide-react";
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
  const [recipientsStr, setRecipientsStr] = useState("");
  const { broadcasts, isLoading, createBroadcast } = useBroadcasts(eventId);

  const handleSubmit = async (e: React.FormEvent, isCustom: boolean) => {
    e.preventDefault();
    try {
      const recipients = isCustom 
        ? recipientsStr.split(",").map(r => r.trim()).filter(Boolean)
        : undefined;

      await createBroadcast.mutateAsync({ subject, content, recipients });
      setSubject("");
      setContent("");
      if (isCustom) setRecipientsStr("");
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
      <DialogContent className="!max-w-none w-screen h-[100dvh] !rounded-none !border-none flex flex-col overflow-hidden p-0 gap-0 bg-slate-50/50 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:zoom-in-100">
        
        <div className="flex-none p-6 pb-4 border-b bg-white shadow-sm z-10 relative">
          <DialogHeader className="max-w-5xl mx-auto w-full flex flex-row items-center gap-4 text-left">
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-100 mt-1">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </DialogClose>
            <div>
              <DialogTitle className="text-2xl mt-0">Email Broadcast</DialogTitle>
              <DialogDescription className="mt-1">
                Send announcements and reminders to all registered guests.
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="compose" className="w-full flex-1 flex flex-col min-h-0 bg-slate-50/50">
          <div className="flex-none px-6 border-b bg-white">
            <div className="max-w-5xl mx-auto w-full pl-14">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12 bg-slate-100/50 mb-2 mt-2">
                <TabsTrigger value="compose">Broadcast to All</TabsTrigger>
                <TabsTrigger value="custom">Custom Recipients</TabsTrigger>
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto w-full h-full">
              <TabsContent value="compose" className="m-0 bg-white p-8 rounded-2xl shadow-sm border h-auto min-h-[60vh]">
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 max-w-3xl">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Important Update: Event Schedule Change"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-base">Message Content (HTML supported)</Label>
                    <Textarea
                      id="content"
                      placeholder="<p>Dear Guest,</p><p>We are excited to announce...</p>"
                      className="min-h-[350px] text-base p-4 resize-y"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Basic HTML tags are supported. A tracking pixel will be automatically added.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createBroadcast.isPending || !subject || !content}
                      className="w-full sm:w-auto px-8 py-6 text-lg"
                    >
                      {createBroadcast.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="custom" className="m-0 bg-white p-8 rounded-2xl shadow-sm border h-auto min-h-[60vh]">
                <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6 max-w-3xl">
                  <div className="space-y-2">
                    <Label htmlFor="custom-subject" className="text-base">Subject</Label>
                    <Input
                      id="custom-subject"
                      placeholder="Important Update: Event Schedule Change"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-recipients" className="text-base">Recipients</Label>
                    <Textarea
                      id="custom-recipients"
                      placeholder="guest1@example.com, guest2@example.com"
                      className="min-h-[100px] text-base p-4"
                      value={recipientsStr}
                      onChange={(e) => setRecipientsStr(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter comma-separated email addresses.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-content" className="text-base">Message Content (HTML supported)</Label>
                    <Textarea
                      id="custom-content"
                      placeholder="<p>Dear Guest,</p><p>We are excited to announce...</p>"
                      className="min-h-[250px] text-base p-4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Basic HTML tags are supported. A tracking pixel will be automatically added.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createBroadcast.isPending || !subject || !content || !recipientsStr}
                      className="w-full sm:w-auto px-8 py-6 text-lg"
                    >
                      {createBroadcast.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send to Custom Recipients
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="inbox" className="m-0 h-full">
                <div className="h-full -mt-2">
                  <MessageInbox />
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : broadcasts && broadcasts.length > 0 ? (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {broadcasts.map((broadcast) => (
                      <Card key={broadcast.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader 
                          className="pb-4 cursor-pointer select-none"
                          onClick={() => setExpandedBroadcastId(expandedBroadcastId === broadcast.id ? null : broadcast.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <CardTitle className="text-lg font-semibold">
                                {broadcast.subject}
                              </CardTitle>
                              {expandedBroadcastId === broadcast.id ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <Badge variant={getStatusColor(broadcast.status) as any} className="px-3 py-1 text-sm">
                              {broadcast.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Sent on {format(new Date(broadcast.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </CardHeader>
                        {expandedBroadcastId === broadcast.id && (
                          <CardContent className="pt-0 border-t border-slate-100 mt-2 bg-slate-50/50">
                            <div className="py-6">
                              <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Message Content
                              </p>
                              <div 
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-base text-slate-800 overflow-x-auto min-h-[100px]"
                                dangerouslySetInnerHTML={{ __html: broadcast.content }}
                              />
                            </div>
                          </CardContent>
                        )}
                        <CardContent className="bg-white border-t border-slate-100 pt-6">
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl">
                              <span className="text-3xl font-bold">{broadcast.sent_count}</span>
                              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Sent</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                              <span className="text-3xl font-bold text-blue-600">{broadcast.open_count}</span>
                              <span className="text-sm font-medium text-blue-600/80 uppercase tracking-wider mt-1">Opened</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-green-50/50 rounded-xl border border-green-100">
                              <span className="text-3xl font-bold text-green-600">{broadcast.click_count}</span>
                              <span className="text-sm font-medium text-green-600/80 uppercase tracking-wider mt-1">Clicked</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                    <Megaphone className="h-16 w-16 mb-4 text-slate-300" />
                    <p className="text-xl font-medium text-slate-600">No broadcasts sent yet</p>
                    <p className="text-sm mt-2">When you send a broadcast, its history will appear here.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
