import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send, Paperclip, SmilePlus, CheckCheck, Check,
  Loader2, MessageSquare, Search, ChevronLeft
} from 'lucide-react';

interface Conversation {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  last_message: string;
  last_message_at: string;
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

interface UniversityChatsProps {
  user: any;
}

export function UniversityChats({ user }: UniversityChatsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('university_id', user.id)
      .order('last_message_at', { ascending: false });

    if (data) {
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

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('uni-conversations')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_conversations',
        filter: `university_id=eq.${user.id}`
      }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);
    markMessagesRead(selectedConv.id);

    const msgChannel = supabase
      .channel(`uni-messages-${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 100);
        if (payload.new.sender_id !== user?.id) {
          markMessagesRead(selectedConv.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as Message) : m));
      })
      .subscribe();

    const typingChannel = supabase
      .channel(`uni-typing-${selectedConv.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_typing',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, (payload) => {
        if (payload.new && (payload.new as any).user_id !== user?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        } else if (payload.eventType === 'DELETE') setIsTyping(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [selectedConv, user, fetchMessages, markMessagesRead]);

  const handleTyping = async () => {
    if (!selectedConv || !user) return;
    await supabase.from('chat_typing').upsert({
      conversation_id: selectedConv.id, user_id: user.id, updated_at: new Date().toISOString()
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase.from('chat_typing').delete()
        .eq('conversation_id', selectedConv.id).eq('user_id', user.id);
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
      conversation_id: selectedConv.id, sender_id: user.id, content,
    });
    await supabase.from('chat_conversations').update({
      last_message: content, last_message_at: new Date().toISOString(),
    }).eq('id', selectedConv.id);
    await supabase.from('chat_typing').delete()
      .eq('conversation_id', selectedConv.id).eq('user_id', user.id);
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
        conversation_id: selectedConv.id, sender_id: user.id,
        content: '', file_url: publicUrl, file_name: file.name, file_type: file.type,
      });
      await supabase.from('chat_conversations').update({
        last_message: `📎 ${file.name}`, last_message_at: new Date().toISOString(),
      }).eq('id', selectedConv.id);
    } catch (err) { console.error('Upload failed:', err); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isImage = (type?: string) => type?.startsWith('image/');
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-0 bg-white border border-gray-200 rounded-2xl overflow-hidden flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left: Conversation List */}
        <div className={`flex-shrink-0 border-r border-gray-100 flex-col w-full md:w-72 ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Conversations</h3>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">{totalUnread}</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Students will appear here when they start a chat</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-4 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {(conv.student_name?.[0] || conv.student_email?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900 truncate">{conv.student_name || conv.student_email}</p>
                      {(conv.unread_count || 0) > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Thread */}
        {selectedConv ? (
          <div className={`flex-1 flex-col min-w-0 ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setSelectedConv(null)} 
                className="md:hidden p-1.5 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {(selectedConv.student_name?.[0] || selectedConv.student_email?.[0] || 'S').toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{selectedConv.student_name || selectedConv.student_email}</p>
                <p className="text-xs text-gray-400">{selectedConv.student_email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[70%]">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.file_url ? (
                            isImage(msg.file_type)
                              ? <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-lg max-h-48 object-cover" />
                              : <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline ${isMe ? 'text-white' : 'text-primary'}`}><Paperclip className="w-3.5 h-3.5" />{msg.file_name}</a>
                          ) : msg.content}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
                          {isMe && (msg.is_read
                            ? <CheckCheck className="w-3 h-3 text-primary" />
                            : <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-2"
                >
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewMessage(p => p + e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <SmilePlus className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button type="submit" disabled={!newMessage.trim() || sending}
                className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-base font-semibold">Select a conversation</h3>
            <p className="text-sm mt-1">Choose a student from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
