import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ThreadReply {
  from: "guest" | "admin";
  name?: string;
  text: string;
  timestamp: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  reply_content: string | null;
  replies: ThreadReply[];
  created_at: string;
  updated_at: string | null;
  source: 'email' | 'contact_form' | null;
}

export function useMessages() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('contact-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages',
        },
        () => {
          // Whenever a new message or update arrives, invalidate the query to refresh
          queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: messages, isLoading, isFetching } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data as ContactMessage[]).map(m => ({
        ...m,
        replies: Array.isArray(m.replies) ? m.replies : [],
      }));
    },
  });

  const replyToMessage = useMutation({
    mutationFn: async ({ 
      messageId, 
      toEmail, 
      subject, 
      replyText, 
      originalMessage, 
      name,
      currentReplies,
    }: { 
      messageId: string; 
      toEmail: string; 
      subject: string; 
      replyText: string;
      originalMessage: string;
      name: string;
      currentReplies: ThreadReply[];
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Send the email via Edge Function
      const { error: funcError } = await supabase.functions.invoke('reply-support-email', {
        body: {
          to_email: toEmail,
          subject,
          reply_text: replyText,
          original_message: originalMessage,
          name
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (funcError) throw funcError;

      // 2. Append the admin reply to the thread in the database
      const adminReply: ThreadReply = {
        from: "admin",
        name: "Lekkside Admin",
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          status: 'replied',
          reply_content: replyText,
          replies: [...currentReplies, adminReply],
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
      toast.success("Reply sent successfully!");
    },
    onError: (error) => {
      toast.error("Failed to send reply: " + error.message);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: 'read' })
        .eq("id", id)
        .eq("status", "unread");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
    }
  });

  return {
    messages,
    isLoading,
    isRefetching: isFetching && !isLoading,
    replyToMessage,
    markAsRead
  };
}
