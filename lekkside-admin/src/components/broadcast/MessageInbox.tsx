import { useState } from "react";
import { useMessages, ContactMessage } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  MessageSquare, 
  Reply, 
  Mail, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
        name: msg.name
      });
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (id: string, status: string) => {
    if (expandedId === id) {
      setExpandedId(null);
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
    <div className="space-y-4 py-4">
      {messages.map((msg) => (
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
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${msg.status === 'unread' ? "text-gray-900" : "text-gray-600"}`}>
                      {msg.name}
                    </h3>
                    <Badge variant={msg.status === 'replied' ? "default" : msg.status === 'read' ? "secondary" : "outline"}>
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate max-w-[300px]">
                    {msg.subject || "(No Subject)"}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(msg.created_at), "MMM d, h:mm a")}
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
                <CardContent className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-50 mt-2 bg-slate-50/30">
                  <div className="pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Message</p>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-700 whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>

                  {msg.status === 'replied' && msg.reply_content && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Admin Reply
                      </p>
                      <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 text-sm text-slate-700 whitespace-pre-wrap italic">
                        {msg.reply_content}
                      </div>
                    </div>
                  )}

                  {msg.status !== 'replied' && replyingTo !== msg.id && (
                    <Button 
                      size="sm" 
                      onClick={() => setReplyingTo(msg.id)}
                      className="gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      Reply to {msg.name.split(' ')[0]}
                    </Button>
                  )}

                  {replyingTo === msg.id && (
                    <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Compose Reply</p>
                        <Textarea 
                          placeholder="Type your response here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[120px] bg-white"
                        />
                      </div>
                      <div className="flex gap-2">
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
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}
    </div>
  );
}
