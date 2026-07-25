import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Send, Paperclip, SmilePlus, CheckCheck, Check,
  Loader2, MessageSquare, Search, ChevronLeft,
  Info, X, MapPin, Mail, Phone, GraduationCap, Globe, DollarSign, Award, FileText, ExternalLink, BookOpen
} from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';

interface StudentProfile {
  full_name?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  highest_qualification?: string;
  gpa?: string;
  intended_course?: string;
  preferred_destination?: string;
  budget?: string;
  scholarship?: string;
  english_test?: string;
  english_score?: string;
  transcripts_url?: string;
  passport_url?: string;
  cv_url?: string;
}

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
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudentProfile = useCallback(async (studentId: string) => {
    setLoadingProfile(true);
    setStudentProfile(null);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, location, contact_email, contact_phone')
        .eq('id', studentId)
        .maybeSingle();
      
      const { data: screeningData } = await supabase
        .from('student_screenings')
        .select('highest_qualification, gpa, intended_course, preferred_destination, budget, scholarship, english_test, english_score, transcripts_url, passport_url, cv_url')
        .eq('user_id', studentId)
        .maybeSingle();
      
      if (profileData || screeningData) {
        setStudentProfile({ ...(profileData || {}), ...(screeningData || {}) });
      } else {
        setStudentProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

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
    if (!selectedConv) {
      setShowProfilePanel(false);
      return;
    }
    fetchMessages(selectedConv.id);
    markMessagesRead(selectedConv.id);
    fetchStudentProfile(selectedConv.student_id);

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
      <div className="flex gap-0 bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left: Conversation List */}
        <div className={`flex-shrink-0 border-r border-gray-800 flex-col w-full md:w-80 bg-black ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Conversations</h3>
              {totalUnread > 0 && (
                <span className="px-2.5 py-1 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-full shadow-inner">{totalUnread} NEW</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm bg-gray-900 border border-gray-800 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-[1.25rem] flex items-center justify-center mb-4 text-gray-600 border border-gray-800">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-5 flex items-center gap-4 border-b border-gray-800 hover:bg-gray-900 transition-colors group ${
                    selectedConv?.id === conv.id ? 'bg-gray-900 border-l-4 border-l-white' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 font-bold text-base border shadow-inner transition-colors ${
                     selectedConv?.id === conv.id ? 'bg-white text-black border-white' : 'bg-gray-800 text-white border-gray-700 group-hover:border-gray-600'
                  }`}>
                    {(conv.student_name?.[0] || conv.student_email?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <PresenceIndicator userId={conv.student_id} />
                        <p className={`font-bold text-sm truncate ${selectedConv?.id === conv.id ? 'text-white' : 'text-gray-300'}`}>{conv.student_name || conv.student_email}</p>
                      </div>
                      {(conv.unread_count || 0) > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-[20px] bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-inner">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${selectedConv?.id === conv.id ? 'text-gray-400' : 'text-gray-500'}`}>{conv.last_message || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Thread */}
        {selectedConv ? (
          <div className={`flex-1 flex-col min-w-0 bg-gray-900 ${selectedConv && !showProfilePanel ? 'flex' : 'hidden md:flex'}`}>
            {/* Thread Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedConv(null)} 
                  className="md:hidden p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-[1rem] bg-gray-800 text-white border border-gray-700 flex items-center justify-center font-bold text-base flex-shrink-0 shadow-inner">
                  {(selectedConv.student_name?.[0] || selectedConv.student_email?.[0] || 'S').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <p className="font-bold text-white text-base tracking-wide">{selectedConv.student_name || selectedConv.student_email}</p>
                    <PresenceIndicator userId={selectedConv.student_id} showText={true} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{selectedConv.student_email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfilePanel(!showProfilePanel)}
                className={`p-2.5 rounded-xl transition-all border ${showProfilePanel ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700 shadow-inner'}`}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-black rounded-[1.5rem] flex items-center justify-center mb-6 text-gray-600 border border-gray-800 shadow-inner">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <p className="text-base text-gray-400 font-medium">No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-black border border-gray-800 px-4 py-1.5 rounded-xl shadow-inner">
                          {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[75%] md:max-w-[65%]">
                        <div className={`px-5 py-3.5 rounded-[1.25rem] text-sm leading-relaxed shadow-sm ${
                          isMe ? 'bg-white text-black rounded-br-sm border border-gray-200 font-medium' : 'bg-black border border-gray-800 text-white rounded-bl-sm'
                        }`}>
                          {msg.file_url ? (
                            isImage(msg.file_type)
                              ? <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-xl max-h-56 object-cover border border-gray-800/20" />
                              : <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline ${isMe ? 'text-black' : 'text-gray-300'} font-bold`}><Paperclip className="w-4 h-4" />{msg.file_name}</a>
                          ) : msg.content}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] font-bold text-gray-500">{format(new Date(msg.created_at), 'HH:mm')}</span>
                          {isMe && (msg.is_read
                            ? <CheckCheck className="w-3.5 h-3.5 text-white bg-black rounded-full p-0.5" />
                            : <Check className="w-3 h-3 text-gray-500" />
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
                    <div className="bg-black border border-gray-800 px-5 py-4 rounded-[1.25rem] rounded-bl-sm flex items-center gap-2 shadow-sm">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  className="px-4 py-3 bg-black border-t border-gray-800 flex flex-wrap gap-2"
                >
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewMessage(p => p + e)} className="text-xl hover:scale-125 transition-transform p-1">{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-5 py-4 border-t border-gray-800 flex items-center gap-3 bg-black rounded-br-[2.5rem]">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shadow-inner">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2.5 rounded-xl border transition-colors shadow-inner ${showEmoji ? 'bg-white text-black border-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <SmilePlus className="w-5 h-5" />
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                className="flex-1 px-5 py-3.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium shadow-inner"
              />
              <button type="submit" disabled={!newMessage.trim() || sending}
                className="p-3.5 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center bg-gray-900 rounded-r-[2.5rem]">
            <div className="w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center mb-6 text-gray-600 border border-gray-800 shadow-inner">
              <MessageSquare className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">SELECT A CONVERSATION</h3>
            <p className="text-sm font-medium text-gray-400 max-w-xs">Choose a student from the list to start chatting and viewing their profile.</p>
          </div>
        )}

        {/* Profile Side Panel */}
        <AnimatePresence>
          {showProfilePanel && selectedConv && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }} 
              animate={{ width: 340, opacity: 1 }} 
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-800 bg-black overflow-hidden flex-shrink-0 z-20 md:static absolute inset-y-0 right-0 h-full w-full md:w-[340px] shadow-2xl md:shadow-none rounded-r-[2.5rem]"
            >
              <div className="w-full md:w-[340px] h-full flex flex-col bg-gray-900/50">
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-black">
                  <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" /> STUDENT PROFILE
                  </h3>
                  <button onClick={() => setShowProfilePanel(false)} className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {loadingProfile ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                  ) : studentProfile ? (
                    <div className="space-y-8">
                      {/* Basic Info */}
                      <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-24 h-24 rounded-3xl bg-black border border-gray-800 text-white flex items-center justify-center font-bold text-3xl mb-4 shadow-inner">
                          {(studentProfile.full_name?.[0] || selectedConv.student_email?.[0] || 'S').toUpperCase()}
                        </div>
                        <h4 className="font-bold text-white text-xl tracking-wide">{studentProfile.full_name || selectedConv.student_name}</h4>
                        {studentProfile.location && (
                          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
                            <MapPin className="w-3.5 h-3.5" /> {studentProfile.location}
                          </p>
                        )}
                      </div>

                      {/* Contact */}
                      <div className="space-y-4 bg-black rounded-2xl p-5 border border-gray-800 shadow-inner">
                        {studentProfile.contact_email && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-gray-900 rounded-lg border border-gray-800"><Mail className="w-4 h-4 text-gray-400" /></div>
                            <span className="text-gray-300 font-medium break-all">{studentProfile.contact_email}</span>
                          </div>
                        )}
                        {studentProfile.contact_phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 bg-gray-900 rounded-lg border border-gray-800"><Phone className="w-4 h-4 text-gray-400" /></div>
                            <span className="text-gray-300 font-medium">{studentProfile.contact_phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Academics */}
                      <div className="bg-black rounded-2xl p-5 border border-gray-800 shadow-inner">
                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Academic Background</h5>
                        <div className="space-y-4">
                          {studentProfile.highest_qualification && (
                            <div className="flex items-start gap-3 text-sm">
                              <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Highest Qualification</p>
                                <p className="font-medium text-white">{studentProfile.highest_qualification}</p>
                              </div>
                            </div>
                          )}
                          {studentProfile.gpa && (
                            <div className="flex items-start gap-3 text-sm">
                              <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GPA / Grades</p>
                                <p className="font-medium text-white">{studentProfile.gpa}</p>
                              </div>
                            </div>
                          )}
                          {studentProfile.intended_course && (
                            <div className="flex items-start gap-3 text-sm">
                              <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Intended Course</p>
                                <p className="font-medium text-white">{studentProfile.intended_course}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Study Preferences */}
                      <div className="bg-black rounded-2xl p-5 border border-gray-800 shadow-inner">
                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Study Preferences</h5>
                        <div className="space-y-4">
                          {studentProfile.preferred_destination && (
                            <div className="flex items-start gap-3 text-sm">
                              <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destination</p>
                                <p className="font-medium text-white">{studentProfile.preferred_destination}</p>
                              </div>
                            </div>
                          )}
                          {studentProfile.budget && (
                            <div className="flex items-start gap-3 text-sm">
                              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Budget</p>
                                <p className="font-medium text-white">{studentProfile.budget}</p>
                              </div>
                            </div>
                          )}
                          {studentProfile.scholarship && (
                            <div className="flex items-start gap-3 text-sm">
                              <Award className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scholarship</p>
                                <p className="font-medium text-white">{studentProfile.scholarship}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* English Proficiency */}
                      {(studentProfile.english_test || studentProfile.english_score) && (
                        <div className="bg-black rounded-2xl p-5 border border-gray-800 shadow-inner">
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Language</h5>
                          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800">
                            <span className="font-bold text-white text-sm tracking-wide">{studentProfile.english_test || 'English Test'}</span>
                            <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]">{studentProfile.english_score || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {(studentProfile.transcripts_url || studentProfile.passport_url || studentProfile.cv_url) && (
                        <div className="bg-black rounded-2xl p-5 border border-gray-800 shadow-inner">
                          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Documents</h5>
                          <div className="space-y-3">
                            {studentProfile.transcripts_url && (
                              <a href={studentProfile.transcripts_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-white">Transcripts</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                              </a>
                            )}
                            {studentProfile.passport_url && (
                              <a href={studentProfile.passport_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-white">Passport</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                              </a>
                            )}
                            {studentProfile.cv_url && (
                              <a href={studentProfile.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-white">CV / Resume</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black rounded-2xl border border-gray-800 m-4">
                      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800">
                        <Info className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium px-4">Student profile data is incomplete or unavailable.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
