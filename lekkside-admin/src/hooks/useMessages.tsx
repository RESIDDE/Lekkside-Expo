import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  reply_content: string | null;
  created_at: string;
}

export function useMessages() {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const replyToMessage = useMutation({
    mutationFn: async ({ 
      messageId, 
      toEmail, 
      subject, 
      replyText, 
      originalMessage, 
      name 
    }: { 
      messageId: string; 
      toEmail: string; 
      subject: string; 
      replyText: string;
      originalMessage: string;
      name: string;
    }) => {
      // 0. Ensure we have a valid session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Send reply via Edge Function
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

      // 2. Update status in database
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          status: 'replied',
          reply_content: replyText
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
    replyToMessage,
    markAsRead
  };
}
