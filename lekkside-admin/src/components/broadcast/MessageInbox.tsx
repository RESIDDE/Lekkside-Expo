import { useState } from "react";
import { useMessages, ContactMessage, ThreadReply } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Loader2, 
  Mail, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Send,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_AVATAR_COLOR = "bg-indigo-100 text-indigo-600";
const GUEST_AVATAR_COLOR = "bg-slate-100 text-slate-500";

function ThreadMessage({ reply, isLast }: { reply: ThreadReply; isLast: boolean }) {
  const isAdmin = reply.from === "admin";
  return (
    <div className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isAdmin ? ADMIN_AVATAR_COLOR : GUEST_AVATAR_COLOR}`}>
        {isAdmin ? "A" : <User className="h-4 w-4" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
          isAdmin 
            ? "bg-indigo-500 text-white rounded-tr-sm" 
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
        }`}>
          {reply.text}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {reply.name || (isAdmin ? "Admin" : "Guest")} · {format(new Date(reply.timestamp), "MMM d, h:mm a")}
        </span>
      </div>
    </div>
  );
}

export function MessageInbox() {
  const { messages, isLoading, replyToMessage, markAsRead } = useMessages();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleReply = async (msg: ContactMessage) => {
    if (!replyText.trim()) return;
    
    try {
      await replyToMessage.mutateAsync({
        messageId: msg.id,
        toEmail: msg.email,
        subject: msg.subject || "Lekkside Support",
        replyText: replyText,
        originalMessage: msg.message,
        name: msg.name,
        currentReplies: msg.replies || [],
      });
      setReplyText("");
      // Keep the thread open after replying
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (id: string, status: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setReplyingTo(null);
      setReplyText("");
    } else {
      setExpandedId(id);
      if (status === 'unread') {
        markAsRead.mutate(id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Your inbox is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4">
      {messages.map((msg) => {
        const totalMessages = 1 + (msg.replies?.length || 0);
        const lastActivity = msg.replies?.length 
          ? msg.replies[msg.replies.length - 1].timestamp 
          : msg.created_at;

        return (
          <Card 
            key={msg.id} 
            className={`overflow-hidden transition-all duration-200 ${
              expandedId === msg.id ? "ring-1 ring-primary/20 shadow-md" : "hover:bg-slate-50/50"
            } ${msg.status === 'unread' ? "border-l-4 border-l-primary" : ""}`}
          >
            <CardHeader 
              className="p-4 cursor-pointer select-none"
              onClick={() => toggleExpand(msg.id, msg.status)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.status === 'unread' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium ${msg.status === 'unread' ? "text-gray-900" : "text-gray-600"}`}>
                        {msg.name}
                      </h3>
                      <Badge variant={msg.status === 'replied' ? "default" : msg.status === 'read' ? "secondary" : "outline"} className="text-[10px]">
                        {msg.status}
                      </Badge>
                      {totalMessages > 1 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-slate-100 rounded-full px-2 py-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {totalMessages}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-[300px]">
                      {msg.subject || "(No Subject)"}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(lastActivity), "MMM d, h:mm a")}
                  </div>
                  {expandedId === msg.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedId === msg.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="px-4 pb-4 pt-0 border-t border-slate-100">
                    {/* Thread conversation view */}
                    <div className="mt-4 space-y-4 bg-slate-50/60 rounded-xl p-4 min-h-[80px]">
                      {/* Original message as first bubble */}
                      <ThreadMessage
                        reply={{
                          from: "guest",
                          name: msg.name,
                          text: msg.message,
                          timestamp: msg.created_at,
                        }}
                        isLast={!msg.replies?.length}
                      />

                      {/* All subsequent replies */}
                      {(msg.replies || []).map((reply, idx) => (
                        <ThreadMessage
                          key={idx}
                          reply={reply}
                          isLast={idx === (msg.replies?.length || 0) - 1}
                        />
                      ))}
                    </div>

                    {/* Reply composer — always visible when expanded */}
                    <div className="mt-4 space-y-2">
                      <Textarea
                        id={`reply-textarea-${msg.id}`}
                        placeholder={`Reply to ${msg.name.split(' ')[0]}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleReply(msg);
                          }
                        }}
                        className="min-h-[90px] bg-white resize-none text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">⌘ + Enter to send</p>
                        <Button 
                          size="sm" 
                          onClick={() => handleReply(msg)}
                          disabled={replyToMessage.isPending || !replyText.trim()}
                          className="gap-2"
                        >
                          {replyToMessage.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
