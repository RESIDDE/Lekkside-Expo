import { useEffect, useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
  MessageSquare, Send, Paperclip, SmilePlus, Search,
  CheckCheck, Check, User, X, Loader2
} from 'lucide-react';

interface Conversation {
  id: string;
  student_id: string;
  university_id: string;
  student_name: string;
  student_email: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  is_read: boolean;
  created_at: string;
}

const EMOJIS = ['😊', '👍', '🎓', '📚', '✅', '❤️', '🙏', '🤝', '💡', '📋', '🌟', '📩'];

export default function Chats() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all conversations for this university
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('university_id', user.id)
      .order('last_message_at', { ascending: false });

    if (data) {
      // Fetch unread counts
      const convsWithUnread = await Promise.all(
        (data as Conversation[]).map(async (c) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);
          return { ...c, unread_count: count || 0 };
        })
      );
      setConversations(convsWithUnread);
    }
  }, [user]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data as Message[]);
      setTimeout(scrollToBottom, 100);
    }
  }, []);

  // Mark messages as read
  const markMessagesRead = useCallback(async (convId: string) => {
    if (!user) return;
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
    );
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Subscribe to conversation list changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `university_id=eq.${user.id}` },
        () => fetchConversations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  // Subscribe to messages in selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);
    markMessagesRead(selectedConv.id);

    const msgChannel = supabase
      .channel(`messages-${selectedConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
          if (payload.new.sender_id !== user?.id) {
            markMessagesRead(selectedConv.id);
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as Message) : m));
        }
      )
      .subscribe();

    // Subscribe to typing indicator
    const typingChannel = supabase
      .channel(`typing-${selectedConv.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_typing', filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          if (payload.new && (payload.new as any).user_id !== user?.id) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
          } else if (payload.eventType === 'DELETE') {
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [selectedConv, user, fetchMessages, markMessagesRead]);

  const handleTyping = async () => {
    if (!selectedConv || !user) return;
    await supabase.from('chat_typing').upsert({ conversation_id: selectedConv.id, user_id: user.id, updated_at: new Date().toISOString() });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase.from('chat_typing').delete().eq('conversation_id', selectedConv.id).eq('user_id', user.id);
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setShowEmoji(false);

    await supabase.from('chat_messages').insert({
      conversation_id: selectedConv.id,
      sender_id: user.id,
      content,
    });

    await supabase.from('chat_conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', selectedConv.id);

    // Clear typing
    await supabase.from('chat_typing').delete().eq('conversation_id', selectedConv.id).eq('user_id', user.id);
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedConv || !user) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat-files/${selectedConv.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path);

      await supabase.from('chat_messages').insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        content: '',
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
      });

      await supabase.from('chat_conversations').update({
        last_message: `📎 ${file.name}`,
        last_message_at: new Date().toISOString(),
      }).eq('id', selectedConv.id);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isImage = (type?: string) => type?.startsWith('image/');

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Live Chats</h1>
            <p className="text-muted-foreground mt-1">Real-time conversations with prospective students</p>
          </div>
        </div>

        <div className="flex-1 flex gap-0 bg-card border border-border/50 rounded-3xl overflow-hidden min-h-0">
          {/* Left: Conversations List */}
          <div className="w-80 flex-shrink-0 border-r border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Students will appear here when they request to chat</p>
                </div>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 flex items-start gap-3 border-b border-border/30 transition-colors hover:bg-muted/50 ${selectedConv?.id === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      {(conv.student_name?.[0] || conv.student_email?.[0] || 'S').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-foreground truncate">{conv.student_name || conv.student_email}</p>
                        {conv.unread_count ? (
                          <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {conv.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDistanceToNow(new Date(conv.last_message_at || conv.created_at), { addSuffix: true })}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Message Thread */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {(selectedConv.student_name?.[0] || selectedConv.student_email?.[0] || 'S').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedConv.student_name || selectedConv.student_email}</p>
                  <p className="text-xs text-muted-foreground">{selectedConv.student_email}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-2">
                          <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">
                            {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}>
                            {msg.file_url ? (
                              isImage(msg.file_type) ? (
                                <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-lg max-h-48 object-cover" />
                              ) : (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                                  <Paperclip className="w-4 h-4" /> {msg.file_name}
                                </a>
                              )
                            ) : (
                              msg.content
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-muted-foreground/60">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                            {isMe && (
                              msg.is_read
                                ? <CheckCheck className="w-3 h-3 text-primary" />
                                : <Check className="w-3 h-3 text-muted-foreground/60" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="px-4 pb-2 flex flex-wrap gap-2"
                  >
                    {EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => setNewMessage(p => p + emoji)} className="text-xl hover:scale-125 transition-transform">
                        {emoji}
                      </button>
                    ))}
                    <button onClick={() => setShowEmoji(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-border/50 flex items-center gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
                  <SmilePlus className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                  className="flex-1 px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">Select a conversation</h3>
              <p className="text-sm mt-1">Choose a student conversation from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
