import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  MessageSquare, Search, Send, User, CheckCheck, Check, Clock,
  Trash2, Archive
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";

interface Conversation {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  status: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const SUPPORT_ID = '00000000-0000-0000-0000-000000000000';

export default function SupportInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [matchingMessageConvIds, setMatchingMessageConvIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingMessageConvIds(new Set());
      return;
    }
    const search = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('conversation_id')
        .ilike('content', `%${searchQuery}%`);
      if (data) {
        setMatchingMessageConvIds(new Set(data.map(d => d.conversation_id)));
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
    loadConversations();

    // Subscribe to conversation updates
    const convChannel = supabase
      .channel('support-convs')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_conversations',
        filter: `university_id=eq.${SUPPORT_ID}`
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv.id);

    const msgChannel = supabase
      .channel(`admin-chat-${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 100);
        
        // Mark as read if from student
        if (payload.new.sender_id === activeConv.student_id) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', payload.new.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as Message) : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [activeConv]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('university_id', SUPPORT_ID)
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data as Message[]);
      setTimeout(scrollToBottom, 100);
      
      // Mark student messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUser?.id)
        .eq('is_read', false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || !currentUser) return;
    
    const content = newMessage.trim();
    setNewMessage('');

    await supabase.from('chat_messages').insert({
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      content,
    });
    
    await supabase.from('chat_conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', activeConv.id);
  };

  const updateStatus = async (status: string) => {
    if (!activeConv) return;
    await supabase.from('chat_conversations').update({ status }).eq('id', activeConv.id);
    setActiveConv({ ...activeConv, status });
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    await supabase.from('chat_messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const filteredConversations = conversations.filter(c => {
    const matchesTab = (c.status || 'active') === activeTab;
    const matchesSearch = !searchQuery.trim() || 
      c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matchingMessageConvIds.has(c.id);
    return matchesTab && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-10rem)] bg-white rounded-3xl border shadow-sm overflow-hidden">
          {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-slate-50/50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Support Inbox
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search students or messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-100/50 border-none rounded-xl"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1 text-xs">Active</TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 text-xs">Resolved</TabsTrigger>
              <TabsTrigger value="archived" className="flex-1 text-xs">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full text-left p-4 border-b hover:bg-slate-100 transition-colors ${activeConv?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate pr-2">{conv.student_name}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(conv.last_message_at || conv.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'New conversation started'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{activeConv.student_name}</h3>
                <p className="text-xs text-muted-foreground">{activeConv.student_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(activeConv.status || 'active') !== 'resolved' && (
                <Button variant="outline" size="sm" onClick={() => updateStatus('resolved')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 h-8">
                  <CheckCheck className="w-4 h-4 mr-1.5" /> Resolve
                </Button>
              )}
              {(activeConv.status || 'active') !== 'archived' && (
                <Button variant="outline" size="sm" onClick={() => updateStatus('archived')} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 h-8">
                  <Archive className="w-4 h-4 mr-1.5" /> Archive
                </Button>
              )}
              {(activeConv.status || 'active') !== 'active' && (
                <Button variant="outline" size="sm" onClick={() => updateStatus('active')} className="h-8">
                  Move to Active
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map(msg => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] group rounded-2xl p-3 shadow-sm relative ${isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-white border rounded-bl-sm'}`}>
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <button 
                        onClick={() => deleteMessage(msg.id)} 
                        className={`opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isMine ? 'text-primary-foreground/70 hover:text-white' : 'text-muted-foreground hover:text-destructive'}`}
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                      {isMine && (
                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={`Reply to ${activeConv.student_name}...`}
                className="rounded-full bg-slate-100/50 border-none px-4"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0 shadow-md transition-transform hover:scale-105" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
          <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
          <p className="font-medium">Select a conversation to view messages</p>
        </div>
      )}
      </div>
      </div>
    </AppLayout>
  );
}
