import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

type Event = Tables<"events">;
type EventInsert = TablesInsert<"events">;
type EventUpdate = TablesUpdate<"events">;

export function useEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });
}

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["events", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: EventInsert) => {
      if (!user) throw new Error("User must be logged in to create an event");

      const { data, error } = await supabase
        .from("events")
        .insert({ ...event, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
