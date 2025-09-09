export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          file_url: string | null
          id: string
          message_content: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          quote_request_id: string
          read_status: boolean | null
          recipient_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          file_url?: string | null
          id?: string
          message_content: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          quote_request_id: string
          read_status?: boolean | null
          recipient_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          file_url?: string | null
          id?: string
          message_content?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          quote_request_id?: string
          read_status?: boolean | null
          recipient_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email_change_count: number | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_email_change: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email_change_count?: number | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_email_change?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email_change_count?: number | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_email_change?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      project_vendors: {
        Row: {
          id: string
          project_id: string
          removed_at: string | null
          selected_at: string
          selection_status: string
          vendor_id: string
        }
        Insert: {
          id?: string
          project_id: string
          removed_at?: string | null
          selected_at?: string
          selection_status?: string
          vendor_id: string
        }
        Update: {
          id?: string
          project_id?: string
          removed_at?: string | null
          selected_at?: string
          selection_status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_vendors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_range: string | null
          client_id: string
          created_at: string
          description: string
          form_data: Json | null
          id: string
          is_active: boolean | null
          location: string | null
          project_name: string | null
          project_type: string | null
          service_groups: string[] | null
          status: Database["public"]["Enums"]["project_status"] | null
          timeline: string | null
          title: string
          updated_at: string
          vendor_selections: Json | null
        }
        Insert: {
          budget_range?: string | null
          client_id: string
          created_at?: string
          description: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          service_groups?: string[] | null
          status?: Database["public"]["Enums"]["project_status"] | null
          timeline?: string | null
          title: string
          updated_at?: string
          vendor_selections?: Json | null
        }
        Update: {
          budget_range?: string | null
          client_id?: string
          created_at?: string
          description?: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          service_groups?: string[] | null
          status?: Database["public"]["Enums"]["project_status"] | null
          timeline?: string | null
          title?: string
          updated_at?: string
          vendor_selections?: Json | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          estimated_timeline: string | null
          id: string
          project_id: string
          quoted_amount: number | null
          responded_at: string | null
          response_deadline: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          updated_at: string
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          estimated_timeline?: string | null
          id?: string
          project_id: string
          quoted_amount?: number | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          estimated_timeline?: string | null
          id?: string
          project_id?: string
          quoted_amount?: number | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          availability_status: boolean | null
          bio: string | null
          business_address: string | null
          business_name: string
          created_at: string
          id: string
          license_number: string | null
          location: string | null
          portfolio_images: Json | null
          rating: number | null
          response_time_hours: number | null
          services_offered: Json | null
          specialty: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          vat_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience: number | null
        }
        Insert: {
          availability_status?: boolean | null
          bio?: string | null
          business_address?: string | null
          business_name: string
          created_at?: string
          id?: string
          license_number?: string | null
          location?: string | null
          portfolio_images?: Json | null
          rating?: number | null
          response_time_hours?: number | null
          services_offered?: Json | null
          specialty?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          vat_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Update: {
          availability_status?: boolean | null
          bio?: string | null
          business_address?: string | null
          business_name?: string
          created_at?: string
          id?: string
          license_number?: string | null
          location?: string | null
          portfolio_images?: Json | null
          rating?: number | null
          response_time_hours?: number | null
          services_offered?: Json | null
          specialty?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          vat_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_vendor_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          business_name: string
          id: string
          location: string
          rating: number
          specialty: string[]
          total_reviews: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      get_public_vendor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: boolean
          bio: string
          business_name: string
          created_at: string
          id: string
          location: string
          portfolio_images: Json
          rating: number
          response_time_hours: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }[]
      }
      get_safe_vendor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: boolean
          bio: string
          business_name: string
          id: string
          location: string
          rating: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_vendor_for_quote_request: {
        Args: { quote_request_id_param: string }
        Returns: {
          bio: string
          business_name: string
          id: string
          location: string
          portfolio_images: Json
          rating: number
          response_time_hours: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          user_id: string
          years_experience: number
        }[]
      }
      log_vendor_profile_access: {
        Args: {
          access_type: string
          accessing_user_id: string
          vendor_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      message_type: "text" | "file" | "quote" | "system"
      project_status:
        | "draft"
        | "active"
        | "in_progress"
        | "completed"
        | "cancelled"
      quote_status: "pending" | "quoted" | "accepted" | "declined" | "expired"
      user_type: "client" | "vendor"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_type: ["text", "file", "quote", "system"],
      project_status: [
        "draft",
        "active",
        "in_progress",
        "completed",
        "cancelled",
      ],
      quote_status: ["pending", "quoted", "accepted", "declined", "expired"],
      user_type: ["client", "vendor"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
