export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      booth_leads: {
        Row: {
          booth_id: string;
          created_at: string;
          guest_id: string;
          id: string;
          is_relevant: boolean;
          lead_score: number | null;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: {
          booth_id: string;
          created_at?: string;
          guest_id: string;
          id?: string;
          is_relevant?: boolean;
          lead_score?: number | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Update: {
          booth_id?: string;
          created_at?: string;
          guest_id?: string;
          id?: string;
          is_relevant?: boolean;
          lead_score?: number | null;
          tags?: string[] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booth_leads_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "exhibition_booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booth_leads_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
      broadcast_logs: {
        Row: {
          broadcast_id: string;
          clicked_at: string | null;
          created_at: string | null;
          email: string;
          error_message: string | null;
          guest_id: string | null;
          id: string;
          opened_at: string | null;
          sent_at: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          broadcast_id: string;
          clicked_at?: string | null;
          created_at?: string | null;
          email: string;
          error_message?: string | null;
          guest_id?: string | null;
          id?: string;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          broadcast_id?: string;
          clicked_at?: string | null;
          created_at?: string | null;
          email?: string;
          error_message?: string | null;
          guest_id?: string | null;
          id?: string;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "broadcast_logs_broadcast_id_fkey";
            columns: ["broadcast_id"];
            isOneToOne: false;
            referencedRelation: "broadcasts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_logs_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
      broadcasts: {
        Row: {
          click_count: number | null;
          content: string;
          created_at: string | null;
          event_id: string;
          id: string;
          open_count: number | null;
          sent_count: number | null;
          status: string;
          subject: string;
          updated_at: string | null;
        };
        Insert: {
          click_count?: number | null;
          content: string;
          created_at?: string | null;
          event_id: string;
          id?: string;
          open_count?: number | null;
          sent_count?: number | null;
          status?: string;
          subject: string;
          updated_at?: string | null;
        };
        Update: {
          click_count?: number | null;
          content?: string;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          open_count?: number | null;
          sent_count?: number | null;
          status?: string;
          subject?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "broadcasts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      checkin_stations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkin_stations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      email_verifications: {
        Row: {
          code: string;
          created_at: string | null;
          email: string;
          expires_at: string;
          form_id: string | null;
          id: string;
          purpose: string;
          verified: boolean | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          email: string;
          expires_at?: string;
          form_id?: string | null;
          id?: string;
          purpose?: string;
          verified?: boolean | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          form_id?: string | null;
          id?: string;
          purpose?: string;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_verifications_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "event_forms";
            referencedColumns: ["id"];
          },
        ];
      };
      event_forms: {
        Row: {
          created_at: string;
          custom_fields: Json | null;
          event_id: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          custom_fields?: Json | null;
          event_id: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          custom_fields?: Json | null;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_forms_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number | null;
          created_at: string;
          created_by: string | null;
          date: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          date?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          created_by?: string | null;
          date?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Relationships: [];
      };
      exhibition_booths: {
        Row: {
          booth_name: string;
          booth_number: string;
          created_at: string;
          event_id: string;
          id: string;
          invitation_token: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          booth_name: string;
          booth_number: string;
          created_at?: string;
          event_id: string;
          id?: string;
          invitation_token?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          booth_name?: string;
          booth_number?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          invitation_token?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exhibition_booths_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      exhibitors: {
        Row: {
          booth_id: string;
          company_name: string | null;
          company_position: string | null;
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          is_primary: boolean;
          last_name: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          booth_id: string;
          company_name?: string | null;
          company_position?: string | null;
          created_at?: string;
          email: string;
          first_name?: string | null;
          id?: string;
          is_primary?: boolean;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          booth_id?: string;
          company_name?: string | null;
          company_position?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          is_primary?: boolean;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exhibitors_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "exhibition_booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exhibitors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: {
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string | null;
          checked_in_by_station: string | null;
          created_at: string;
          custom_fields: Json | null;
          email: string | null;
          event_id: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          registered_via: string | null;
          ticket_number: string | null;
          ticket_type: string | null;
          updated_at: string;
        };
        Insert: {
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          checked_in_by_station?: string | null;
          created_at?: string;
          custom_fields?: Json | null;
          email?: string | null;
          event_id: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          registered_via?: string | null;
          ticket_number?: string | null;
          ticket_type?: string | null;
          updated_at?: string;
        };
        Update: {
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          checked_in_by_station?: string | null;
          created_at?: string;
          custom_fields?: Json | null;
          email?: string | null;
          event_id?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          registered_via?: string | null;
          ticket_number?: string | null;
          ticket_type?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guests_checked_in_by_station_fkey";
            columns: ["checked_in_by_station"];
            isOneToOne: false;
            referencedRelation: "checkin_stations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guests_registered_via_fkey";
            columns: ["registered_via"];
            isOneToOne: false;
            referencedRelation: "event_forms";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_notes: {
        Row: {
          booth_lead_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string;
          updated_at: string;
        };
        Insert: {
          booth_lead_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note: string;
          updated_at?: string;
        };
        Update: {
          booth_lead_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_booth_lead_id_fkey";
            columns: ["booth_lead_id"];
            isOneToOne: false;
            referencedRelation: "booth_leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      exec_sql: { Args: { query: string }; Returns: undefined };
      get_booth_attendees: {
        Args: { p_booth_id: string };
        Returns: {
          checked_in: boolean;
          email: string;
          first_name: string;
          guest_id: string;
          is_lead: boolean;
          is_relevant: boolean;
          last_name: string;
          lead_score: number;
          notes_count: number;
          phone: string;
          tags: string[];
          ticket_type: string;
        }[];
      };
      increment_broadcast_stats: {
        Args: { field: string; row_id: string };
        Returns: undefined;
      };
      is_form_active: { Args: { form_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  DefaultSchemaCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends DefaultSchemaCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = DefaultSchemaCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : DefaultSchemaCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][DefaultSchemaCompositeTypeNameOrOptions]
    : never;
