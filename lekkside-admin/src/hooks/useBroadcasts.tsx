import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Broadcast {
  id: string;
  event_id: string;
  subject: string;
  content: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
}

export function useBroadcasts(eventId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ["broadcasts", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Broadcast[];
    },
    enabled: !!eventId,
  });

  const createBroadcast = useMutation({
    mutationFn: async ({ subject, content }: { subject: string; content: string }) => {
      if (!eventId) throw new Error("Event ID is required");
      
      // 1. Create broadcast record
      const { data: broadcast, error: createError } = await supabase
        .from("broadcasts")
        .insert({
          event_id: eventId,
          subject,
          content,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Trigger edge function to send
      const { error: funcError } = await supabase.functions.invoke('send-broadcast', {
        body: {
          broadcastId: broadcast.id,
          eventId: eventId
        }
      });

      if (funcError) throw funcError;

      return broadcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts", eventId] });
      toast.success("Broadcast started successfully! Emails are being sent.");
    },
    onError: (error) => {
      toast.error("Failed to send broadcast: " + error.message);
    },
  });

  return {
    broadcasts,
    isLoading,
    createBroadcast
  };
}
