import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExhibitionBooth {
  id: string;
  event_id: string;
  booth_number: string;
  booth_name: string;
  invitation_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exhibitor {
  id: string;
  booth_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoothLead {
  id: string;
  booth_id: string;
  guest_id: string;
  is_relevant: boolean;
  lead_score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  booth_lead_id: string;
  exhibitor_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export function useExhibitionBooths(eventId?: string) {
  return useQuery({
    queryKey: ["exhibition-booths", eventId],
    queryFn: async () => {
      let query = supabase
        .from("exhibition_booths")
        .select("*")
        .order("booth_number");

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ExhibitionBooth[];
    },
    enabled: !!eventId,
  });
}

export function useCreateBooth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booth: {
      event_id: string;
      booth_number: string;
      booth_name: string;
    }) => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .insert(booth)
        .select()
        .single();

      if (error) throw error;
      return data as ExhibitionBooth;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-booths"] });
      toast({
        title: "Booth created",
        description: `Booth ${data.booth_number} has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booth.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBooth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ExhibitionBooth> & { id: string }) => {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ExhibitionBooth;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-booths"] });
      toast({
        title: "Booth updated",
        description: "Booth has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booth.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBooth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (boothId: string) => {
      const { error } = await supabase
        .from("exhibition_booths")
        .delete()
        .eq("id", boothId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-booths"] });
      toast({
        title: "Booth deleted",
        description: "Booth has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete booth.",
        variant: "destructive",
      });
    },
  });
}

export function useBoothLeads(boothId?: string) {
  return useQuery({
    queryKey: ["booth-leads", boothId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_booth_attendees", {
        p_booth_id: boothId,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!boothId,
  });
}

export function useUpdateBoothLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      booth_id,
      guest_id,
      is_relevant,
      lead_score,
      tags,
    }: {
      booth_id: string;
      guest_id: string;
      is_relevant?: boolean;
      lead_score?: number;
      tags?: string[];
    }) => {
      const { data, error } = await supabase
        .from("booth_leads")
        .upsert(
          {
            booth_id,
            guest_id,
            is_relevant,
            lead_score,
            tags,
          },
          {
            onConflict: "booth_id,guest_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as BoothLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booth-leads"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead.",
        variant: "destructive",
      });
    },
  });
}

export function useLeadNotes(boothLeadId?: string) {
  return useQuery({
    queryKey: ["lead-notes", boothLeadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("booth_lead_id", boothLeadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadNote[];
    },
    enabled: !!boothLeadId,
  });
}

export function useCreateLeadNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      booth_lead_id,
      exhibitor_id,
      note,
    }: {
      booth_lead_id: string;
      exhibitor_id: string;
      note: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_notes")
        .insert({
          booth_lead_id,
          exhibitor_id,
          note,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LeadNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes"] });
      toast({
        title: "Note added",
        description: "Note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLeadNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("lead_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes"] });
      toast({
        title: "Note deleted",
        description: "Note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    },
  });
}
