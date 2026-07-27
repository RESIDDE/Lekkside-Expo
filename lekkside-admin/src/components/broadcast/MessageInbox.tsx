import { useState } from "react";
import { useMessages, ContactMessage, ThreadReply } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Mail, 
  User, 
  Send,
  RefreshCcw,
  Search,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Reply,
  CornerUpLeft
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

function MessageItem({ 
  msg, 
  expandedId, 
  toggleExpand, 
  replyText, 
  setReplyText, 
  handleReply, 
  isPending 
}: { 
  msg: ContactMessage, 
  expandedId: string | null, 
  toggleExpand: (id: string, status: string) => void,
  replyText: string,
  setReplyText: (val: string) => void,
  handleReply: (msg: ContactMessage) => void,
  isPending: boolean
}) {
  const isExpanded = expandedId === msg.id;
  const isUnread = msg.status === 'unread';

  const messageDate = new Date(msg.created_at);
  const isToday = new Date().toDateString() === messageDate.toDateString();
  const dateStr = isToday ? format(messageDate, "h:mm a") : format(messageDate, "MMM d");

  return (
    <div className="border-b border-gray-100 last:border-none flex flex-col transition-colors bg-white">
      {!isExpanded ? (
        <div 
          className={`flex items-center gap-4 px-4 py-2.5 cursor-pointer hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] hover:z-10 relative group ${isUnread ? 'bg-white font-bold text-gray-900' : 'bg-gray-50/50 text-gray-700 font-medium'}`}
          onClick={() => toggleExpand(msg.id, msg.status)}
        >
          <div className="flex-none flex items-center gap-3 w-16">
            <div className="w-4 h-4 rounded border border-gray-300 opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <Star className={`h-4 w-4 ${isUnread ? 'text-gray-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors cursor-pointer`} />
          </div>
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className={`w-40 truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {msg.name}
            </div>
            
            <div className="flex-1 truncate">
              <span className={isUnread ? 'text-gray-900' : 'text-gray-800'}>{msg.subject || "(No Subject)"}</span>
              <span className="text-gray-400 mx-2">-</span>
              <span className="text-gray-500 font-normal">{msg.message}</span>
            </div>
          </div>
          
          <div className={`flex-none w-20 text-right text-xs whitespace-nowrap ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-500 font-normal'}`}>
            {dateStr}
          </div>
        </div>
      ) : (
        <div className="bg-white m-4 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-[22px] font-normal text-gray-800">{msg.subject || "(No Subject)"}</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-gray-100"><Archive className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-gray-100"><Trash2 className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                {msg.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-bold text-gray-900 mr-2">{msg.name}</span>
                    <span className="text-xs text-gray-500">&lt;{msg.email}&gt;</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {format(messageDate, "MMM d, yyyy, h:mm a")}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><CornerUpLeft className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mb-6">to me</div>
                <div className="whitespace-pre-wrap text-[15px] text-gray-800 leading-relaxed font-sans">
                  {msg.message}
                </div>
              </div>
            </div>

            {(msg.replies || []).map((reply, idx) => {
              const isAdmin = reply.from === 'admin';
              return (
                <div key={idx} className="flex gap-4 border-t pt-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0 ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {isAdmin ? 'A' : msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-bold text-gray-900 mr-2">{isAdmin ? 'Admin' : msg.name}</span>
                        {!isAdmin && <span className="text-xs text-gray-500">&lt;{msg.email}&gt;</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {format(new Date(reply.timestamp), "MMM d, yyyy, h:mm a")}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><CornerUpLeft className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                    {!isAdmin && <div className="text-sm text-gray-500 mb-6">to me</div>}
                    {isAdmin && <div className="text-sm text-gray-500 mb-6">to {msg.name}</div>}
                    <div className="whitespace-pre-wrap text-[15px] text-gray-800 leading-relaxed font-sans">
                      {reply.text}
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="mt-8 flex gap-4">
               <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                  A
               </div>
               <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white">
                 <div className="bg-gray-50/50 px-4 py-2 border-b text-sm text-gray-600 font-medium flex items-center gap-2">
                   <Reply className="h-4 w-4" />
                   Reply
                 </div>
                 <Textarea
                   placeholder="Write your reply..."
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                       handleReply(msg);
                     }
                   }}
                   className="min-h-[160px] border-none focus-visible:ring-0 rounded-none p-4 resize-none text-[15px]"
                 />
                 <div className="p-3 flex justify-between items-center bg-gray-50/30">
                   <span className="text-xs text-gray-400 px-2 flex items-center gap-1">
                     Press <kbd className="bg-white border rounded px-1.5 py-0.5 font-sans shadow-sm">⌘</kbd> + <kbd className="bg-white border rounded px-1.5 py-0.5 font-sans shadow-sm">Enter</kbd> to send
                   </span>
                   <div className="flex gap-2">
                     <Button 
                       variant="ghost"
                       onClick={() => toggleExpand(msg.id, msg.status)}
                       className="text-gray-600 rounded-full px-6 hover:bg-gray-200"
                     >
                       Discard
                     </Button>
                     <Button 
                       onClick={() => handleReply(msg)}
                       disabled={isPending || !replyText.trim()}
                       className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full shadow-sm"
                     >
                       {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                       Send
                     </Button>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MessageInbox() {
  const queryClient = useQueryClient();
  const { messages, isLoading, replyToMessage, markAsRead } = useMessages();
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
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (id: string, status: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setReplyText("");
    } else {
      setExpandedId(id);
      if (status === 'unread') {
        markAsRead.mutate(id);
      }
    }
  };

  const refreshMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allMessages = messages || [];
  const broadcastReplies = allMessages.filter(m => !m.source || m.source === 'email');
  const contactForms = allMessages.filter(m => m.source === 'contact_form');

  const unreadBroadcasts = broadcastReplies.filter(m => m.status === 'unread').length;
  const unreadContacts = contactForms.filter(m => m.status === 'unread').length;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-120px)] min-h-[600px] bg-white rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden font-sans mt-2">
      
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={refreshMessages} className="text-gray-600 rounded-full hover:bg-gray-100">
            <RefreshCcw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 rounded-full hover:bg-gray-100">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 max-w-2xl px-4">
          <div className="relative bg-gray-100 rounded-full flex items-center px-4 py-2 focus-within:bg-white focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] focus-within:ring-1 focus-within:ring-gray-200 transition-all">
            <Search className="h-5 w-5 text-gray-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search mail" 
              className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 text-[15px]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-20">
        </div>
      </div>

      <Tabs defaultValue="broadcasts" className="w-full flex-1 flex flex-col min-h-0">
        <div className="flex items-center bg-white px-2 border-b border-gray-100 shadow-sm z-10 relative">
          <TabsList className="bg-transparent p-0 h-14 gap-2">
            <TabsTrigger 
              value="broadcasts" 
              className="data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-4 bg-transparent hover:bg-gray-50 gap-3 text-gray-600 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span className="font-medium text-[15px]">Broadcast Replies</span>
              {unreadBroadcasts > 0 && (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full ml-1 border-none">
                  {unreadBroadcasts} new
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-4 bg-transparent hover:bg-gray-50 gap-3 text-gray-600 transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="font-medium text-[15px]">Contact Forms</span>
              {unreadContacts > 0 && (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full ml-1 border-none">
                  {unreadContacts} new
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="broadcasts" className="m-0 flex-1 overflow-y-auto bg-gray-50/30">
          {broadcastReplies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <Mail className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Your inbox is empty</p>
              <p className="text-sm mt-1">Replies to your broadcasts will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col pb-4">
              {broadcastReplies.map(msg => (
                <MessageItem 
                  key={msg.id} 
                  msg={msg} 
                  expandedId={expandedId}
                  toggleExpand={toggleExpand}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleReply={handleReply}
                  isPending={replyToMessage.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="contact" className="m-0 flex-1 overflow-y-auto bg-gray-50/30">
          {contactForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <User className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No contact forms</p>
              <p className="text-sm mt-1">Messages from the contact form will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col pb-4">
              {contactForms.map(msg => (
                <MessageItem 
                  key={msg.id} 
                  msg={msg} 
                  expandedId={expandedId}
                  toggleExpand={toggleExpand}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleReply={handleReply}
                  isPending={replyToMessage.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

