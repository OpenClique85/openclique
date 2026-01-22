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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      comms_log: {
        Row: {
          id: string
          provider_message_id: string | null
          quest_id: string | null
          sent_at: string
          subject: string | null
          type: Database["public"]["Enums"]["comms_type"]
          user_id: string | null
        }
        Insert: {
          id?: string
          provider_message_id?: string | null
          quest_id?: string | null
          sent_at?: string
          subject?: string | null
          type: Database["public"]["Enums"]["comms_type"]
          user_id?: string | null
        }
        Update: {
          id?: string
          provider_message_id?: string | null
          quest_id?: string | null
          sent_at?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["comms_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comms_log_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_applications: {
        Row: {
          created_at: string | null
          creator_type: string | null
          email: string
          id: string
          message: string | null
          name: string
          social_links: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          creator_type?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          social_links?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          creator_type?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          social_links?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          belonging_delta: number | null
          best_part: string | null
          friction_point: string | null
          id: string
          quest_id: string
          rating_1_5: number | null
          submitted_at: string
          user_id: string
          would_do_again: boolean | null
        }
        Insert: {
          belonging_delta?: number | null
          best_part?: string | null
          friction_point?: string | null
          id?: string
          quest_id: string
          rating_1_5?: number | null
          submitted_at?: string
          user_id: string
          would_do_again?: boolean | null
        }
        Update: {
          belonging_delta?: number | null
          best_part?: string | null
          friction_point?: string | null
          id?: string
          quest_id?: string
          rating_1_5?: number | null
          submitted_at?: string
          user_id?: string
          would_do_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          quest_id: string | null
          read_at: string | null
          referrer_user_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          quest_id?: string | null
          read_at?: string | null
          referrer_user_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          quest_id?: string | null
          read_at?: string | null
          referrer_user_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          business_name: string
          category: string | null
          contact_email: string
          contact_name: string
          created_at: string | null
          id: string
          message: string | null
          status: string | null
        }
        Insert: {
          business_name: string
          category?: string | null
          contact_email: string
          contact_name: string
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
        }
        Update: {
          business_name?: string
          category?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_given_at: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          consent_given_at?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          consent_given_at?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      quest_signups: {
        Row: {
          cancellation_reason: string | null
          id: string
          notes_private: string | null
          quest_id: string
          reenlist_answered_at: string | null
          signed_up_at: string
          status: Database["public"]["Enums"]["signup_status"] | null
          updated_at: string
          user_id: string
          wants_reenlist: boolean | null
        }
        Insert: {
          cancellation_reason?: string | null
          id?: string
          notes_private?: string | null
          quest_id: string
          reenlist_answered_at?: string | null
          signed_up_at?: string
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string
          user_id: string
          wants_reenlist?: boolean | null
        }
        Update: {
          cancellation_reason?: string | null
          id?: string
          notes_private?: string | null
          quest_id?: string
          reenlist_answered_at?: string | null
          signed_up_at?: string
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string
          user_id?: string
          wants_reenlist?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_signups_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_squads: {
        Row: {
          compatibility_score: number | null
          confirmed_at: string | null
          created_at: string
          id: string
          quest_id: string
          squad_name: string
          status: Database["public"]["Enums"]["squad_status"]
          whatsapp_link: string | null
        }
        Insert: {
          compatibility_score?: number | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          quest_id: string
          squad_name?: string
          status?: Database["public"]["Enums"]["squad_status"]
          whatsapp_link?: string | null
        }
        Update: {
          compatibility_score?: number | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          quest_id?: string
          squad_name?: string
          status?: Database["public"]["Enums"]["squad_status"]
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_squads_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          briefing_html: string | null
          capacity_total: number | null
          cost_description: string | null
          created_at: string
          creator_name: string | null
          creator_social_url: string | null
          creator_type: string | null
          end_datetime: string | null
          icon: string | null
          id: string
          image_url: string | null
          meeting_address: string | null
          meeting_location_name: string | null
          objectives: string | null
          progression_tree: string | null
          rewards: string | null
          short_description: string | null
          slug: string
          start_datetime: string | null
          status: Database["public"]["Enums"]["quest_status"] | null
          success_criteria: string | null
          tags: string[] | null
          theme: string | null
          theme_color: string | null
          title: string
          updated_at: string
          whatsapp_invite_link: string | null
        }
        Insert: {
          briefing_html?: string | null
          capacity_total?: number | null
          cost_description?: string | null
          created_at?: string
          creator_name?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          end_datetime?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          objectives?: string | null
          progression_tree?: string | null
          rewards?: string | null
          short_description?: string | null
          slug: string
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          success_criteria?: string | null
          tags?: string[] | null
          theme?: string | null
          theme_color?: string | null
          title: string
          updated_at?: string
          whatsapp_invite_link?: string | null
        }
        Update: {
          briefing_html?: string | null
          capacity_total?: number | null
          cost_description?: string | null
          created_at?: string
          creator_name?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          end_datetime?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          objectives?: string | null
          progression_tree?: string | null
          rewards?: string | null
          short_description?: string | null
          slug?: string
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          success_criteria?: string | null
          tags?: string[] | null
          theme?: string | null
          theme_color?: string | null
          title?: string
          updated_at?: string
          whatsapp_invite_link?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          id: string
          quest_id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          signed_up_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          quest_id: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          signed_up_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          id?: string
          quest_id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          signed_up_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_leader_votes: {
        Row: {
          created_at: string
          id: string
          squad_id: string
          voted_for_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          squad_id: string
          voted_for_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          squad_id?: string
          voted_for_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_leader_votes_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          added_at: string
          id: string
          persistent_squad_id: string | null
          role: string | null
          signup_id: string | null
          squad_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          persistent_squad_id?: string | null
          role?: string | null
          signup_id?: string | null
          squad_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          persistent_squad_id?: string | null
          role?: string | null
          signup_id?: string | null
          squad_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_persistent_squad_id_fkey"
            columns: ["persistent_squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "quest_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_quest_invites: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          proposed_by: string
          quest_id: string
          squad_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposed_by: string
          quest_id: string
          squad_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposed_by?: string
          quest_id?: string
          squad_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_quest_invites_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_quest_invites_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_quest_rsvps: {
        Row: {
          id: string
          invite_id: string
          responded_at: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invite_id: string
          responded_at?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invite_id?: string
          responded_at?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_quest_rsvps_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "squad_quest_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          id: string
          name: string
          origin_quest_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          origin_quest_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          origin_quest_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_origin_quest_id_fkey"
            columns: ["origin_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          created_at: string | null
          email: string
          experience: string | null
          id: string
          message: string | null
          name: string
          role_interest: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          experience?: string | null
          id?: string
          message?: string | null
          name: string
          role_interest?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          experience?: string | null
          id?: string
          message?: string | null
          name?: string
          role_interest?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      quest_ratings: {
        Row: {
          avg_rating: number | null
          quest_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      record_referral_signup: {
        Args: { p_referral_code: string; p_user_id: string }
        Returns: undefined
      }
      track_referral_click: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      comms_type:
        | "email_invite"
        | "email_confirm"
        | "email_reminder"
        | "email_followup"
        | "email_whatsapp"
      notification_type:
        | "quest_recommendation"
        | "quest_shared"
        | "referral_accepted"
        | "signup_confirmed"
        | "quest_reminder"
        | "general"
        | "feedback_request"
      quest_status: "draft" | "open" | "closed" | "completed" | "cancelled"
      signup_status:
        | "pending"
        | "confirmed"
        | "standby"
        | "dropped"
        | "no_show"
        | "completed"
      squad_status: "draft" | "confirmed" | "active" | "completed"
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
      app_role: ["admin", "user"],
      comms_type: [
        "email_invite",
        "email_confirm",
        "email_reminder",
        "email_followup",
        "email_whatsapp",
      ],
      notification_type: [
        "quest_recommendation",
        "quest_shared",
        "referral_accepted",
        "signup_confirmed",
        "quest_reminder",
        "general",
        "feedback_request",
      ],
      quest_status: ["draft", "open", "closed", "completed", "cancelled"],
      signup_status: [
        "pending",
        "confirmed",
        "standby",
        "dropped",
        "no_show",
        "completed",
      ],
      squad_status: ["draft", "confirmed", "active", "completed"],
    },
  },
} as const
