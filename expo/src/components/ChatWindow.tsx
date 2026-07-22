import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  X, Send, Paperclip, SmilePlus, CheckCheck, Check,
  Loader2, MessageSquare
} from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';

interface ChatWindowProps {
  universityId: string;
  universityName: string;
  onClose: () => void;
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

export function ChatWindow({ universityId, universityName, onClose }: ChatWindowProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Get or create conversation
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { onClose(); return; }
      setCurrentUser(user);

      const studentName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
      const studentEmail = user.email || '';

      // Check for existing conversation
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('student_id', user.id)
        .eq('university_id', universityId)
        .maybeSingle();

      let convId: string;
      if (existing) {
        convId = existing.id;
      } else {
        // Create new conversation + notify university
        const { data: created, error } = await supabase
          .from('chat_conversations')
          .insert({
            student_id: user.id,
            university_id: universityId,
            student_name: studentName,
            student_email: studentEmail,
          })
          .select()
          .single();

        if (error || !created) { console.error(error); setLoading(false); return; }
        convId = created.id;

        // Send notification to university
        await supabase.functions.invoke('notify-university', {
          body: { universityId, studentName, studentEmail, requestType: 'chat' }
        });
      }

      setConversationId(convId);

      // Load messages
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (msgs) setMessages(msgs as Message[]);

      // Mark messages from university as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
    init();
  }, [universityId, onClose]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const msgChannel = supabase
      .channel(`student-chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 100);
        // Mark as read if from university
        if (payload.new.sender_id !== currentUser?.id) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', payload.new.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? (payload.new as Message) : m));
      })
      .subscribe();

    const typingChannel = supabase
      .channel(`student-typing-${conversationId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'chat_typing',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new && (payload.new as any).user_id !== currentUser?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        } else if (payload.eventType === 'DELETE') {
          setIsTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUser]);

  const handleTyping = async () => {
    if (!conversationId || !currentUser) return;
    await supabase.from('chat_typing').upsert({
      conversation_id: conversationId,
      user_id: currentUser.id,
      updated_at: new Date().toISOString()
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await supabase.from('chat_typing').delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !currentUser || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setShowEmoji(false);

    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content,
    });
    await supabase.from('chat_conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);
    await supabase.from('chat_typing').delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUser.id);
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !conversationId || !currentUser) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat-files/${conversationId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: '',
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
      });
      await supabase.from('chat_conversations').update({
        last_message: `📎 ${file.name}`,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isImage = (type?: string) => type?.startsWith('image/');

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-4 right-4 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-[100]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {universityName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{universityName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <PresenceIndicator userId={universityId} showText={true} />
            <span className="text-[10px] text-white/70">Live Chat</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Start the conversation</p>
            <p className="text-xs text-gray-400 mt-1">University staff will respond shortly</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUser?.id;
            const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-2">
                    <span className="text-[10px] text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                      {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[75%]">
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                    }`}>
                      {msg.file_url ? (
                        isImage(msg.file_type) ? (
                          <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-lg max-h-40 object-cover" />
                        ) : (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline ${isMe ? 'text-white' : 'text-primary'}`}>
                            <Paperclip className="w-3.5 h-3.5" /> {msg.file_name}
                          </a>
                        )
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
          })
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm border border-gray-100">
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
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-2"
          >
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setNewMessage(p => p + emoji)} className="text-lg hover:scale-125 transition-transform">
                {emoji}
              </button>
            ))}
            <button onClick={() => setShowEmoji(false)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
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
          className="flex-1 px-3.5 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </motion.div>
  );
}
