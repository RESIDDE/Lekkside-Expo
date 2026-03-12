import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface EventForm {
  id: string;
  event_id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  custom_fields: CustomField[];
  created_at: string;
  updated_at: string;
}

// Standalone mutation functions to break type recursion
const performCreateForm = async (eventId: string, name: string): Promise<EventForm> => {
  const { data, error } = await (supabase.from("event_forms") as any)
    .insert({ event_id: eventId, name, is_default: false })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    custom_fields: (data.custom_fields as unknown as CustomField[]) || [],
  } as EventForm;
};

const performToggleFormActive = async (formId: string, isActive: boolean): Promise<void> => {
  const { error } = await (supabase.from("event_forms") as any)
    .update({ is_active: isActive })
    .eq("id", formId);

  if (error) throw error;
};

const performDeleteForm = async (formId: string): Promise<void> => {
  const { error } = await (supabase.from("event_forms") as any)
    .delete()
    .eq("id", formId)
    .eq("is_default", false);

  if (error) throw error;
};

const performUpdateFormFields = async (formId: string, customFields: CustomField[]): Promise<void> => {
  const { error } = await (supabase.from("event_forms") as any)
    .update({ custom_fields: customFields as any })
    .eq("id", formId);

  if (error) throw error;
};

export const useForms = (eventId: string) => {
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["forms", eventId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("event_forms") as any)
        .select("*")
        .eq("event_id", eventId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((form: any) => ({
        ...form,
        custom_fields: (form.custom_fields as unknown as CustomField[]) || [],
      })) as EventForm[];
    },
    enabled: !!eventId,
  });

  const createForm = useMutation<EventForm, Error, string>({
    mutationFn: (name: string) => performCreateForm(eventId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", eventId] });
      toast.success("Form created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create form: " + error.message);
    },
  });

  const toggleFormActive = useMutation<void, Error, { formId: string; isActive: boolean }>({
    mutationFn: ({ formId, isActive }) => performToggleFormActive(formId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", eventId] });
      toast.success("Form updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update form: " + error.message);
    },
  });

  const deleteForm = useMutation<void, Error, string>({
    mutationFn: (formId: string) => performDeleteForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", eventId] });
      toast.success("Form deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete form: " + error.message);
    },
  });

  const updateFormFields = useMutation<void, Error, { formId: string; customFields: CustomField[] }>({
    mutationFn: ({ formId, customFields }) => performUpdateFormFields(formId, customFields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", eventId] });
      toast.success("Form fields updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update form fields: " + error.message);
    },
  });

  return {
    forms,
    isLoading,
    createForm,
    toggleFormActive,
    deleteForm,
    updateFormFields,
  };
};

// Hook for public form page (no auth required)
export const usePublicForm = (formId: string) => {
  const { data: form, isLoading, error } = useQuery({
    queryKey: ["public-form", formId],
    queryFn: async () => {
      // First fetch the form from DB
      const { data: formData, error: formError } = await supabase
        .from("event_forms")
        .select("*")
        .eq("id", formId)
        .maybeSingle();

      if (formError) throw formError;
      if (!formData) throw new Error("Form not found");

      // Then fetch the event separately (works better with RLS for anon users)
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", formData.event_id)
        .single();

      return {
        ...formData,
        custom_fields: (formData.custom_fields as unknown as CustomField[]) || [],
        events: eventData,
      } as EventForm & { events: any };
    },
    enabled: !!formId,
  });

  return { form, isLoading, error };
};

// Get count of registrations via a specific form
export const useFormRegistrationCount = (formId: string) => {
  const { data: count = 0 } = useQuery({
    queryKey: ["form-registrations", formId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("registered_via", formId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!formId,
  });

  return count;
};
