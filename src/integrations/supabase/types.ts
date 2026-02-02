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
      account_deletion_feedback: {
        Row: {
          data_exported: boolean | null
          deleted_at: string
          display_name: string | null
          feedback: string | null
          id: string
          other_reason: string | null
          reasons: string[] | null
          user_email: string
          would_return: boolean | null
        }
        Insert: {
          data_exported?: boolean | null
          deleted_at?: string
          display_name?: string | null
          feedback?: string | null
          id?: string
          other_reason?: string | null
          reasons?: string[] | null
          user_email: string
          would_return?: boolean | null
        }
        Update: {
          data_exported?: boolean | null
          deleted_at?: string
          display_name?: string | null
          feedback?: string | null
          id?: string
          other_reason?: string | null
          reasons?: string[] | null
          user_email?: string
          would_return?: boolean | null
        }
        Relationships: []
      }
      account_deletion_requests: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          id: string
          processed_at: string | null
          scheduled_at: string
          status: string
          user_email: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          scheduled_at?: string
          status?: string
          user_email: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          scheduled_at?: string
          status?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      achievement_templates: {
        Row: {
          badge_id: string | null
          category: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean | null
          name: string
          sort_order: number | null
          xp_reward: number | null
        }
        Insert: {
          badge_id?: string | null
          category?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Update: {
          badge_id?: string | null
          category?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name?: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievement_templates_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_direct_messages: {
        Row: {
          body: string
          context_quest_id: string | null
          context_squad_id: string | null
          context_ticket_id: string | null
          created_at: string
          email_sent: boolean
          from_admin_id: string
          id: string
          message_type: Database["public"]["Enums"]["admin_message_type"]
          read_at: string | null
          reply_allowed: boolean
          subject: string
          to_user_id: string
        }
        Insert: {
          body: string
          context_quest_id?: string | null
          context_squad_id?: string | null
          context_ticket_id?: string | null
          created_at?: string
          email_sent?: boolean
          from_admin_id: string
          id?: string
          message_type?: Database["public"]["Enums"]["admin_message_type"]
          read_at?: string | null
          reply_allowed?: boolean
          subject: string
          to_user_id: string
        }
        Update: {
          body?: string
          context_quest_id?: string | null
          context_squad_id?: string | null
          context_ticket_id?: string | null
          created_at?: string
          email_sent?: boolean
          from_admin_id?: string
          id?: string
          message_type?: Database["public"]["Enums"]["admin_message_type"]
          read_at?: string | null
          reply_allowed?: boolean
          subject?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_direct_messages_context_quest_id_fkey"
            columns: ["context_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_direct_messages_context_squad_id_fkey"
            columns: ["context_squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_direct_messages_context_ticket_id_fkey"
            columns: ["context_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_dm_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          message_id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message_id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message_id?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_dm_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_shadow_sessions: {
        Row: {
          accessed_tables: string[] | null
          actions_taken: Json | null
          admin_user_id: string
          ended_at: string | null
          id: string
          reason: string
          started_at: string | null
          target_user_id: string
        }
        Insert: {
          accessed_tables?: string[] | null
          actions_taken?: Json | null
          admin_user_id: string
          ended_at?: string | null
          id?: string
          reason: string
          started_at?: string | null
          target_user_id: string
        }
        Update: {
          accessed_tables?: string[] | null
          actions_taken?: Json | null
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          reason?: string
          started_at?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      ai_inference_log: {
        Row: {
          admin_triggered_by: string | null
          created_at: string | null
          decision_traces: Json
          id: string
          input_snapshot: Json
          model_used: string
          prompt_version: string
          raw_output: Json
          run_type: string
          source_id: string | null
          tokens_used: number | null
          traits_suggested: string[]
          user_id: string
        }
        Insert: {
          admin_triggered_by?: string | null
          created_at?: string | null
          decision_traces: Json
          id?: string
          input_snapshot: Json
          model_used: string
          prompt_version: string
          raw_output: Json
          run_type: string
          source_id?: string | null
          tokens_used?: number | null
          traits_suggested: string[]
          user_id: string
        }
        Update: {
          admin_triggered_by?: string | null
          created_at?: string | null
          decision_traces?: Json
          id?: string
          input_snapshot?: Json
          model_used?: string
          prompt_version?: string
          raw_output?: Json
          run_type?: string
          source_id?: string | null
          tokens_used?: number | null
          traits_suggested?: string[]
          user_id?: string
        }
        Relationships: []
      }
      ai_prompt_variables: {
        Row: {
          created_at: string | null
          description: string | null
          example_value: Json | null
          id: string
          prompt_id: string | null
          variable_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          example_value?: Json | null
          id?: string
          prompt_id?: string | null
          variable_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          example_value?: Json | null
          id?: string
          prompt_id?: string | null
          variable_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_variables_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          created_by: string | null
          id: string
          personality_context: string | null
          prompt_id: string | null
          prompt_template: string
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          personality_context?: string | null
          prompt_id?: string | null
          prompt_template: string
          version: number
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          personality_context?: string | null
          prompt_id?: string | null
          prompt_template?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          personality_context: string | null
          prompt_key: string
          prompt_name: string
          prompt_template: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          personality_context?: string | null
          prompt_key: string
          prompt_name: string
          prompt_template: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          personality_context?: string | null
          prompt_key?: string
          prompt_name?: string
          prompt_template?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_rate_monitor: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          identifier: string
          identifier_type: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          identifier: string
          identifier_type: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          identifier?: string
          identifier_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      badge_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          rarity: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          rarity?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      clique_applications: {
        Row: {
          answers: Json | null
          created_at: string | null
          decline_reason: string | null
          id: string
          intro_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          squad_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          intro_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          squad_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          intro_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          squad_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_applications_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_lore_entries: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          entry_type: string
          id: string
          is_ai_generated: boolean | null
          is_pinned: boolean | null
          media_url: string | null
          quest_id: string | null
          squad_id: string
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_type: string
          id?: string
          is_ai_generated?: boolean | null
          is_pinned?: boolean | null
          media_url?: string | null
          quest_id?: string | null
          squad_id: string
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_type?: string
          id?: string
          is_ai_generated?: boolean | null
          is_pinned?: boolean | null
          media_url?: string | null
          quest_id?: string | null
          squad_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clique_lore_entries_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clique_lore_entries_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_poll_votes: {
        Row: {
          id: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clique_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "clique_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_polls: {
        Row: {
          closed_at: string | null
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_anonymous: boolean | null
          options: Json
          poll_type: string | null
          question: string
          squad_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          options?: Json
          poll_type?: string | null
          question: string
          squad_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          options?: Json
          poll_type?: string | null
          question?: string
          squad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_polls_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_ready_check_responses: {
        Row: {
          id: string
          ready_check_id: string
          responded_at: string | null
          response: string
          user_id: string
        }
        Insert: {
          id?: string
          ready_check_id: string
          responded_at?: string | null
          response: string
          user_id: string
        }
        Update: {
          id?: string
          ready_check_id?: string
          responded_at?: string | null
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_ready_check_responses_ready_check_id_fkey"
            columns: ["ready_check_id"]
            isOneToOne: false
            referencedRelation: "clique_ready_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_ready_checks: {
        Row: {
          context_quest_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          squad_id: string
          title: string
          triggered_by: string
        }
        Insert: {
          context_quest_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          squad_id: string
          title: string
          triggered_by: string
        }
        Update: {
          context_quest_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          squad_id?: string
          title?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_ready_checks_context_quest_id_fkey"
            columns: ["context_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clique_ready_checks_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_removal_votes: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          squad_id: string
          target_user_id: string
          vote: string
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          squad_id: string
          target_user_id: string
          vote: string
          voter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          squad_id?: string
          target_user_id?: string
          vote?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_removal_votes_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      clique_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          clique_id: string
          created_at: string
          declined_at: string | null
          expires_at: string | null
          id: string
          role: string
          rotation_enabled: boolean | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          clique_id: string
          created_at?: string
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          role: string
          rotation_enabled?: boolean | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          clique_id?: string
          created_at?: string
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          role?: string
          rotation_enabled?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clique_role_assignments_clique_id_fkey"
            columns: ["clique_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_messages: {
        Row: {
          attachments: Json | null
          collaboration_id: string
          collaboration_type: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json | null
          collaboration_id: string
          collaboration_type: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachments?: Json | null
          collaboration_id?: string
          collaboration_type?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: []
      }
      comms_log: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          provider_message_id: string | null
          quest_id: string | null
          sent_at: string
          status: string | null
          subject: string | null
          type: Database["public"]["Enums"]["comms_type"]
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          quest_id?: string | null
          sent_at?: string
          status?: string | null
          subject?: string | null
          type: Database["public"]["Enums"]["comms_type"]
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_message_id?: string | null
          quest_id?: string | null
          sent_at?: string
          status?: string | null
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
      creator_invites: {
        Row: {
          application_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          redeemed_at: string | null
          token: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          redeemed_at?: string | null
          token?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          redeemed_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_invites_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "creator_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          display_name: string
          id: string
          invited_at: string | null
          onboarded_at: string | null
          payout_placeholder: Json | null
          photo_url: string | null
          seeking: string[] | null
          slug: string | null
          socials: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name: string
          id?: string
          invited_at?: string | null
          onboarded_at?: string | null
          payout_placeholder?: Json | null
          photo_url?: string | null
          seeking?: string[] | null
          slug?: string | null
          socials?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          invited_at?: string | null
          onboarded_at?: string | null
          payout_placeholder?: Json | null
          photo_url?: string | null
          seeking?: string[] | null
          slug?: string | null
          socials?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_export_history: {
        Row: {
          content_snapshot: Json | null
          document_count: number
          expires_at: string | null
          export_format: string
          exported_at: string
          exported_by: string
          file_path: string | null
          file_url: string | null
          id: string
          included_categories: string[]
          metadata: Json | null
          pack_type: string
          total_size_bytes: number | null
        }
        Insert: {
          content_snapshot?: Json | null
          document_count?: number
          expires_at?: string | null
          export_format: string
          exported_at?: string
          exported_by: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          included_categories: string[]
          metadata?: Json | null
          pack_type: string
          total_size_bytes?: number | null
        }
        Update: {
          content_snapshot?: Json | null
          document_count?: number
          expires_at?: string | null
          export_format?: string
          exported_at?: string
          exported_by?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          included_categories?: string[]
          metadata?: Json | null
          pack_type?: string
          total_size_bytes?: number | null
        }
        Relationships: []
      }
      draft_traits: {
        Row: {
          ai_model: string | null
          ai_prompt_version: string | null
          confidence: number | null
          created_at: string | null
          decided_at: string | null
          decision_trace: Json | null
          explanation: string | null
          id: string
          source: string
          source_id: string | null
          status: string | null
          trait_slug: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_prompt_version?: string | null
          confidence?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision_trace?: Json | null
          explanation?: string | null
          id?: string
          source: string
          source_id?: string | null
          status?: string | null
          trait_slug: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          ai_prompt_version?: string | null
          confidence?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision_trace?: Json | null
          explanation?: string | null
          id?: string
          source?: string
          source_id?: string | null
          status?: string | null
          trait_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_traits_trait_slug_fkey"
            columns: ["trait_slug"]
            isOneToOne: false
            referencedRelation: "trait_library"
            referencedColumns: ["slug"]
          },
        ]
      }
      emerging_trait_proposals: {
        Row: {
          ai_confidence_gaps: Json | null
          created_at: string
          created_trait_id: string | null
          detection_source: string
          evidence_samples: Json | null
          frequency_count: number | null
          id: string
          merged_into_trait_slug: string | null
          potential_user_count: number | null
          proposed_category: string
          proposed_description: string | null
          proposed_display_name: string
          proposed_emoji: string | null
          proposed_slug: string
          retroactive_drafts_created: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          similar_existing_traits: string[] | null
          status: string
          trigger_criteria: string[] | null
          updated_at: string
        }
        Insert: {
          ai_confidence_gaps?: Json | null
          created_at?: string
          created_trait_id?: string | null
          detection_source: string
          evidence_samples?: Json | null
          frequency_count?: number | null
          id?: string
          merged_into_trait_slug?: string | null
          potential_user_count?: number | null
          proposed_category: string
          proposed_description?: string | null
          proposed_display_name: string
          proposed_emoji?: string | null
          proposed_slug: string
          retroactive_drafts_created?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similar_existing_traits?: string[] | null
          status?: string
          trigger_criteria?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_confidence_gaps?: Json | null
          created_at?: string
          created_trait_id?: string | null
          detection_source?: string
          evidence_samples?: Json | null
          frequency_count?: number | null
          id?: string
          merged_into_trait_slug?: string | null
          potential_user_count?: number | null
          proposed_category?: string
          proposed_description?: string | null
          proposed_display_name?: string
          proposed_emoji?: string | null
          proposed_slug?: string
          retroactive_drafts_created?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similar_existing_traits?: string[] | null
          status?: string
          trigger_criteria?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emerging_trait_proposals_created_trait_id_fkey"
            columns: ["created_trait_id"]
            isOneToOne: false
            referencedRelation: "trait_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emerging_trait_proposals_merged_into_trait_slug_fkey"
            columns: ["merged_into_trait_slug"]
            isOneToOne: false
            referencedRelation: "trait_library"
            referencedColumns: ["slug"]
          },
        ]
      }
      eventbrite_connections: {
        Row: {
          access_token: string
          connected_at: string
          eventbrite_email: string | null
          eventbrite_user_id: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          org_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          eventbrite_email?: string | null
          eventbrite_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          org_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          eventbrite_email?: string | null
          eventbrite_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          org_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventbrite_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventbrite_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventbrite_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      eventbrite_events: {
        Row: {
          capacity: number | null
          created_at: string | null
          currency: string | null
          eventbrite_event_id: string
          eventbrite_url: string
          id: string
          is_free: boolean | null
          last_synced_at: string | null
          max_ticket_price: number | null
          min_ticket_price: number | null
          organizer_id: string | null
          organizer_name: string | null
          quest_id: string | null
          raw_event_data: Json | null
          sync_error: string | null
          ticket_classes: Json | null
          ticket_url: string | null
          tickets_sold: number | null
          updated_at: string | null
          venue_address: Json | null
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          currency?: string | null
          eventbrite_event_id: string
          eventbrite_url: string
          id?: string
          is_free?: boolean | null
          last_synced_at?: string | null
          max_ticket_price?: number | null
          min_ticket_price?: number | null
          organizer_id?: string | null
          organizer_name?: string | null
          quest_id?: string | null
          raw_event_data?: Json | null
          sync_error?: string | null
          ticket_classes?: Json | null
          ticket_url?: string | null
          tickets_sold?: number | null
          updated_at?: string | null
          venue_address?: Json | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          currency?: string | null
          eventbrite_event_id?: string
          eventbrite_url?: string
          id?: string
          is_free?: boolean | null
          last_synced_at?: string | null
          max_ticket_price?: number | null
          min_ticket_price?: number | null
          organizer_id?: string | null
          organizer_name?: string | null
          quest_id?: string | null
          raw_event_data?: Json | null
          sync_error?: string | null
          ticket_classes?: Json | null
          ticket_url?: string | null
          tickets_sold?: number | null
          updated_at?: string | null
          venue_address?: Json | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventbrite_events_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_audit: {
        Row: {
          changed_by: string
          created_at: string | null
          flag_id: string | null
          id: string
          new_state: Json | null
          old_state: Json | null
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          flag_id?: string | null
          id?: string
          new_state?: Json | null
          old_state?: Json | null
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          flag_id?: string | null
          id?: string
          new_state?: Json | null
          old_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_audit_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          key: string
          name: string
          rollout_percentage: number | null
          target_org_ids: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          target_user_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          key: string
          name: string
          rollout_percentage?: number | null
          target_org_ids?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_user_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          name?: string
          rollout_percentage?: number | null
          target_org_ids?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_user_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          belonging_delta: number | null
          best_part: string | null
          consent_type: string | null
          feelings: string[] | null
          friction_point: string | null
          id: string
          interview_opt_in: boolean | null
          is_testimonial_approved: boolean | null
          private_notes: string | null
          quest_id: string
          rating_1_5: number | null
          recommendation_text: string | null
          submitted_at: string
          testimonial_text: string | null
          user_id: string
          would_do_again: boolean | null
        }
        Insert: {
          belonging_delta?: number | null
          best_part?: string | null
          consent_type?: string | null
          feelings?: string[] | null
          friction_point?: string | null
          id?: string
          interview_opt_in?: boolean | null
          is_testimonial_approved?: boolean | null
          private_notes?: string | null
          quest_id: string
          rating_1_5?: number | null
          recommendation_text?: string | null
          submitted_at?: string
          testimonial_text?: string | null
          user_id: string
          would_do_again?: boolean | null
        }
        Update: {
          belonging_delta?: number | null
          best_part?: string | null
          consent_type?: string | null
          feelings?: string[] | null
          friction_point?: string | null
          id?: string
          interview_opt_in?: boolean | null
          is_testimonial_approved?: boolean | null
          private_notes?: string | null
          quest_id?: string
          rating_1_5?: number | null
          recommendation_text?: string | null
          submitted_at?: string
          testimonial_text?: string | null
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
      feedback_pricing: {
        Row: {
          created_at: string
          expensive_price: string | null
          fair_price: string | null
          feedback_id: string
          id: string
          pricing_model_preference: string | null
          too_cheap_price: string | null
          too_expensive_price: string | null
          value_drivers: string[] | null
        }
        Insert: {
          created_at?: string
          expensive_price?: string | null
          fair_price?: string | null
          feedback_id: string
          id?: string
          pricing_model_preference?: string | null
          too_cheap_price?: string | null
          too_expensive_price?: string | null
          value_drivers?: string[] | null
        }
        Update: {
          created_at?: string
          expensive_price?: string | null
          fair_price?: string | null
          feedback_id?: string
          id?: string
          pricing_model_preference?: string | null
          too_cheap_price?: string | null
          too_expensive_price?: string | null
          value_drivers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_pricing_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_pulses: {
        Row: {
          context_quest_id: string | null
          context_squad_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          page_path: string
          reaction: string
          user_id: string | null
        }
        Insert: {
          context_quest_id?: string | null
          context_squad_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_path: string
          reaction: string
          user_id?: string | null
        }
        Update: {
          context_quest_id?: string | null
          context_squad_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_path?: string
          reaction?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_pulses_context_quest_id_fkey"
            columns: ["context_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_pulses_context_squad_id_fkey"
            columns: ["context_squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_quest_design: {
        Row: {
          comfort_score: number | null
          confusion_notes: string | null
          created_at: string
          feedback_id: string
          group_fit: string | null
          id: string
          length_rating: string | null
          reconnect_intent: string | null
          worked_poorly: string[] | null
          worked_well: string[] | null
        }
        Insert: {
          comfort_score?: number | null
          confusion_notes?: string | null
          created_at?: string
          feedback_id: string
          group_fit?: string | null
          id?: string
          length_rating?: string | null
          reconnect_intent?: string | null
          worked_poorly?: string[] | null
          worked_well?: string[] | null
        }
        Update: {
          comfort_score?: number | null
          confusion_notes?: string | null
          created_at?: string
          feedback_id?: string
          group_fit?: string | null
          id?: string
          length_rating?: string | null
          reconnect_intent?: string | null
          worked_poorly?: string[] | null
          worked_well?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_quest_design_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          admin_message: string | null
          completed_at: string | null
          created_at: string
          id: string
          quest_id: string
          status: string
          user_id: string
          xp_basic: number
          xp_extended: number
          xp_pricing: number
          xp_testimonial: number
        }
        Insert: {
          admin_message?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id: string
          status?: string
          user_id: string
          xp_basic?: number
          xp_extended?: number
          xp_pricing?: number
          xp_testimonial?: number
        }
        Update: {
          admin_message?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          quest_id?: string
          status?: string
          user_id?: string
          xp_basic?: number
          xp_extended?: number
          xp_pricing?: number
          xp_testimonial?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_invites: {
        Row: {
          code: string
          created_at: string | null
          id: string
          quest_id: string
          redeemed_at: string | null
          referred_user_id: string | null
          referrer_user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          quest_id: string
          redeemed_at?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          quest_id?: string
          redeemed_at?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_invites_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_snapshots: {
        Row: {
          created_at: string | null
          id: string
          milestone_key: string | null
          narrative: string | null
          snapshot_data: Json
          snapshot_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          milestone_key?: string | null
          narrative?: string | null
          snapshot_data: Json
          snapshot_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          milestone_key?: string | null
          narrative?: string | null
          snapshot_data?: Json
          snapshot_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          notes: string | null
          type: Database["public"]["Enums"]["invite_code_type"]
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          notes?: string | null
          type?: Database["public"]["Enums"]["invite_code_type"]
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          notes?: string | null
          type?: Database["public"]["Enums"]["invite_code_type"]
          uses_count?: number
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          referral_source: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          referral_source?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          referral_source?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          requires_escalation: boolean
          severity_default: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          requires_escalation?: boolean
          severity_default?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          requires_escalation?: boolean
          severity_default?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_thresholds: {
        Row: {
          created_at: string | null
          id: string
          level: number
          min_xp: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: number
          min_xp: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      listing_applications: {
        Row: {
          availability: string | null
          created_at: string | null
          creator_id: string
          id: string
          listing_id: string
          pitch_message: string
          proposed_concept: string | null
          response_at: string | null
          sponsor_notes: string | null
          status: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          listing_id: string
          pitch_message: string
          proposed_concept?: string | null
          response_at?: string | null
          sponsor_notes?: string | null
          status?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          listing_id?: string
          pitch_message?: string
          proposed_concept?: string | null
          response_at?: string | null
          sponsor_notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "sponsor_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          available_placeholders: string[] | null
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean | null
          name: string
          subject: string | null
          template_key: string
          updated_at: string
        }
        Insert: {
          available_placeholders?: string[] | null
          body: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          subject?: string | null
          template_key: string
          updated_at?: string
        }
        Update: {
          available_placeholders?: string[] | null
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          subject?: string | null
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      moderation_flags: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
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
      onboarding_feedback: {
        Row: {
          clarity_rating: number | null
          created_at: string
          excitement_rating: number | null
          id: string
          redemption_id: string | null
          signup_experience_rating: number | null
          suggestions: string | null
          user_id: string
          what_confused_you: string | null
          what_excited_you: string | null
          would_recommend: boolean | null
        }
        Insert: {
          clarity_rating?: number | null
          created_at?: string
          excitement_rating?: number | null
          id?: string
          redemption_id?: string | null
          signup_experience_rating?: number | null
          suggestions?: string | null
          user_id: string
          what_confused_you?: string | null
          what_excited_you?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          clarity_rating?: number | null
          created_at?: string
          excitement_rating?: number | null
          id?: string
          redemption_id?: string | null
          signup_experience_rating?: number | null
          suggestions?: string | null
          user_id?: string
          what_confused_you?: string | null
          what_excited_you?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_feedback_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "invite_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_events: {
        Row: {
          actor_type: string | null
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          correlation_id: string | null
          created_at: string | null
          creator_id: string | null
          event_type: Database["public"]["Enums"]["ops_event_type"]
          id: string
          listing_id: string | null
          metadata: Json | null
          org_id: string | null
          quest_id: string | null
          signup_id: string | null
          sponsor_id: string | null
          squad_id: string | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          actor_type?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          event_type: Database["public"]["Enums"]["ops_event_type"]
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          org_id?: string | null
          quest_id?: string | null
          signup_id?: string | null
          sponsor_id?: string | null
          squad_id?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          actor_type?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          event_type?: Database["public"]["Enums"]["ops_event_type"]
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          org_id?: string | null
          quest_id?: string | null
          signup_id?: string | null
          sponsor_id?: string | null
          squad_id?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      org_applications: {
        Row: {
          agreed_to_terms: boolean
          applicant_id: string
          category: string | null
          created_at: string
          decline_reason: string | null
          description: string | null
          id: string
          intended_audience: string | null
          name: string
          parent_org_id: string | null
          requested_admins: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          visibility: string
        }
        Insert: {
          agreed_to_terms?: boolean
          applicant_id: string
          category?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          id?: string
          intended_audience?: string | null
          name: string
          parent_org_id?: string | null
          requested_admins?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          visibility?: string
        }
        Update: {
          agreed_to_terms?: boolean
          applicant_id?: string
          category?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          id?: string
          intended_audience?: string | null
          name?: string
          parent_org_id?: string | null
          requested_admins?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_applications_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      org_creator_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          creator_id: string
          creator_response_at: string | null
          decline_reason: string | null
          description: string | null
          estimated_participants: number | null
          id: string
          notes: string | null
          org_id: string
          preferred_dates: string | null
          quest_theme: string | null
          requester_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          creator_id: string
          creator_response_at?: string | null
          decline_reason?: string | null
          description?: string | null
          estimated_participants?: number | null
          id?: string
          notes?: string | null
          org_id: string
          preferred_dates?: string | null
          quest_theme?: string | null
          requester_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          creator_id?: string
          creator_response_at?: string | null
          decline_reason?: string | null
          description?: string | null
          estimated_participants?: number | null
          id?: string
          notes?: string | null
          org_id?: string
          preferred_dates?: string | null
          quest_theme?: string | null
          requester_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_creator_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_creator_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invite_codes: {
        Row: {
          auto_assign_role: string | null
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          org_id: string
          uses_count: number
        }
        Insert: {
          auto_assign_role?: string | null
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          org_id: string
          uses_count?: number
        }
        Update: {
          auto_assign_role?: string | null
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          org_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invite_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_sponsor_requests: {
        Row: {
          budget_ask: string | null
          created_at: string
          decline_reason: string | null
          description: string | null
          event_type: string | null
          expected_attendance: number | null
          id: string
          offering_request: Json | null
          org_id: string
          preferred_dates: string | null
          quest_id: string | null
          requester_id: string
          sponsor_id: string
          sponsor_response_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_ask?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          event_type?: string | null
          expected_attendance?: number | null
          id?: string
          offering_request?: Json | null
          org_id: string
          preferred_dates?: string | null
          quest_id?: string | null
          requester_id: string
          sponsor_id: string
          sponsor_response_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_ask?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          event_type?: string | null
          expected_attendance?: number | null
          id?: string
          offering_request?: Json | null
          org_id?: string
          preferred_dates?: string | null
          quest_id?: string | null
          requester_id?: string
          sponsor_id?: string
          sponsor_response_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_sponsor_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsor_requests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsor_requests_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_verified_emails: {
        Row: {
          domain: string
          email: string
          id: string
          is_verified: boolean | null
          org_id: string
          token_expires_at: string | null
          user_id: string
          verification_token: string | null
          verified_at: string
        }
        Insert: {
          domain: string
          email: string
          id?: string
          is_verified?: boolean | null
          org_id: string
          token_expires_at?: string | null
          user_id: string
          verification_token?: string | null
          verified_at?: string
        }
        Update: {
          domain?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          org_id?: string
          token_expires_at?: string | null
          user_id?: string
          verification_token?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_verified_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_verified_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_verified_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_tier: Database["public"]["Enums"]["account_tier"] | null
          admin_notes: string | null
          annual_commit: number | null
          billing_contact_email: string | null
          billing_status: Database["public"]["Enums"]["billing_status"] | null
          category: string | null
          cohort_cap: number | null
          contact_email: string | null
          contract_notes: string | null
          created_at: string
          description: string | null
          enterprise_type: Database["public"]["Enums"]["enterprise_type"] | null
          estimated_arr: number | null
          id: string
          intended_plan: string | null
          is_active: boolean
          is_umbrella: boolean
          is_verified: boolean
          logo_url: string | null
          member_limit: number | null
          name: string
          overage_policy: Database["public"]["Enums"]["overage_policy"] | null
          parent_org_id: string | null
          pilot_end_date: string | null
          pilot_signup_date: string | null
          price_per_cohort: number | null
          price_per_seat: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          primary_color: string | null
          school_affiliation: string | null
          seat_cap: number | null
          seeking: string[] | null
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          suspend_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          verified_domains: string[] | null
          visibility: string
          website_url: string | null
        }
        Insert: {
          account_tier?: Database["public"]["Enums"]["account_tier"] | null
          admin_notes?: string | null
          annual_commit?: number | null
          billing_contact_email?: string | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          category?: string | null
          cohort_cap?: number | null
          contact_email?: string | null
          contract_notes?: string | null
          created_at?: string
          description?: string | null
          enterprise_type?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          estimated_arr?: number | null
          id?: string
          intended_plan?: string | null
          is_active?: boolean
          is_umbrella?: boolean
          is_verified?: boolean
          logo_url?: string | null
          member_limit?: number | null
          name: string
          overage_policy?: Database["public"]["Enums"]["overage_policy"] | null
          parent_org_id?: string | null
          pilot_end_date?: string | null
          pilot_signup_date?: string | null
          price_per_cohort?: number | null
          price_per_seat?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          primary_color?: string | null
          school_affiliation?: string | null
          seat_cap?: number | null
          seeking?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          suspend_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verified_domains?: string[] | null
          visibility?: string
          website_url?: string | null
        }
        Update: {
          account_tier?: Database["public"]["Enums"]["account_tier"] | null
          admin_notes?: string | null
          annual_commit?: number | null
          billing_contact_email?: string | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          category?: string | null
          cohort_cap?: number | null
          contact_email?: string | null
          contract_notes?: string | null
          created_at?: string
          description?: string | null
          enterprise_type?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          estimated_arr?: number | null
          id?: string
          intended_plan?: string | null
          is_active?: boolean
          is_umbrella?: boolean
          is_verified?: boolean
          logo_url?: string | null
          member_limit?: number | null
          name?: string
          overage_policy?: Database["public"]["Enums"]["overage_policy"] | null
          parent_org_id?: string | null
          pilot_end_date?: string | null
          pilot_signup_date?: string | null
          price_per_cohort?: number | null
          price_per_seat?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          primary_color?: string | null
          school_affiliation?: string | null
          seat_cap?: number | null
          seeking?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          suspend_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verified_domains?: string[] | null
          visibility?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_proofs: {
        Row: {
          admin_notes: string | null
          created_at: string
          file_url: string | null
          id: string
          instance_id: string
          objective_index: number | null
          proof_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          signup_id: string | null
          status: Database["public"]["Enums"]["proof_status"]
          text_content: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          instance_id: string
          objective_index?: number | null
          proof_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signup_id?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          text_content?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          instance_id?: string
          objective_index?: number | null
          proof_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signup_id?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          text_content?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_proofs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_proofs_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "quest_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_proofs_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "quest_signups_public"
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
      personality_type_mappings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          quest_affinities: string[] | null
          role_tendencies: string[] | null
          suggested_energy: Json | null
          system: string
          type_value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          quest_affinities?: string[] | null
          role_tendencies?: string[] | null
          suggested_energy?: Json | null
          system: string
          type_value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          quest_affinities?: string[] | null
          role_tendencies?: string[] | null
          suggested_energy?: Json | null
          system?: string
          type_value?: string
        }
        Relationships: []
      }
      pii_access_log: {
        Row: {
          access_type: string
          accessed_fields: string[] | null
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          reason: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_fields?: string[] | null
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_fields?: string[] | null
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      pilot_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          note_type: string | null
          pilot_id: string
          related_quest_id: string | null
          related_user_id: string | null
          tags: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_type?: string | null
          pilot_id: string
          related_quest_id?: string | null
          related_user_id?: string | null
          tags?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_type?: string | null
          pilot_id?: string
          related_quest_id?: string | null
          related_user_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_notes_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_notes_related_quest_id_fkey"
            columns: ["related_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          hypothesis: string | null
          id: string
          name: string
          org_id: string | null
          slug: string
          start_date: string
          status: string | null
          success_criteria: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          hypothesis?: string | null
          id?: string
          name: string
          org_id?: string | null
          slug: string
          start_date: string
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          hypothesis?: string | null
          id?: string
          name?: string
          org_id?: string | null
          slug?: string
          start_date?: string
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_duration_days: number | null
          description: string | null
          hypothesis_template: string | null
          id: string
          name: string
          success_criteria_template: Json | null
          suggested_metrics: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_duration_days?: number | null
          description?: string | null
          hypothesis_template?: string | null
          id?: string
          name: string
          success_criteria_template?: Json | null
          suggested_metrics?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_duration_days?: number | null
          description?: string | null
          hypothesis_template?: string | null
          id?: string
          name?: string
          success_criteria_template?: Json | null
          suggested_metrics?: string[] | null
        }
        Relationships: []
      }
      pinned_quests: {
        Row: {
          id: string
          notes: string | null
          pinned_at: string
          quest_id: string
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          pinned_at?: string
          quest_id: string
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          pinned_at?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_interest: {
        Row: {
          acknowledged_pricing: boolean | null
          billing_status: Database["public"]["Enums"]["billing_status"] | null
          created_at: string | null
          feature_usage: Json | null
          id: string
          intended_plan: string | null
          pilot_opt_in_date: string | null
          ready_to_convert: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_pricing?: boolean | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          created_at?: string | null
          feature_usage?: Json | null
          id?: string
          intended_plan?: string | null
          pilot_opt_in_date?: string | null
          ready_to_convert?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_pricing?: boolean | null
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          created_at?: string | null
          feature_usage?: Json | null
          id?: string
          intended_plan?: string | null
          pilot_opt_in_date?: string | null
          ready_to_convert?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_page_events: {
        Row: {
          created_at: string | null
          cta_label: string | null
          enterprise_type_clicked:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          tier_clicked: Database["public"]["Enums"]["account_tier"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          cta_label?: string | null
          enterprise_type_clicked?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          tier_clicked?: Database["public"]["Enums"]["account_tier"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          cta_label?: string | null
          enterprise_type_clicked?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          tier_clicked?: Database["public"]["Enums"]["account_tier"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_page_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_page_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_organizations: {
        Row: {
          joined_at: string
          onboarded_at: string | null
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["org_member_role"]
        }
        Insert: {
          joined_at?: string
          onboarded_at?: string | null
          org_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Update: {
          joined_at?: string
          onboarded_at?: string | null
          org_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_organizations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_organizations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          consent_given_at: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          notification_preferences: Json | null
          preferences: Json | null
          privacy_settings: Json | null
          tutorial_completed_at: string | null
          tutorial_steps_completed: Json | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          consent_given_at?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          notification_preferences?: Json | null
          preferences?: Json | null
          privacy_settings?: Json | null
          tutorial_completed_at?: string | null
          tutorial_steps_completed?: Json | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          consent_given_at?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          notification_preferences?: Json | null
          preferences?: Json | null
          privacy_settings?: Json | null
          tutorial_completed_at?: string | null
          tutorial_steps_completed?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      quest_constraints: {
        Row: {
          accessibility_level: Database["public"]["Enums"]["quest_accessibility_level"]
          age_requirement: Database["public"]["Enums"]["quest_age_requirement"]
          alcohol: Database["public"]["Enums"]["quest_alcohol_level"]
          budget_level: Database["public"]["Enums"]["quest_budget_level"]
          created_at: string
          id: string
          indoor_outdoor: Database["public"]["Enums"]["quest_indoor_outdoor"]
          noise_level: Database["public"]["Enums"]["quest_noise_level"]
          physical_intensity: Database["public"]["Enums"]["quest_intensity_level"]
          quest_id: string
          social_intensity: Database["public"]["Enums"]["quest_social_intensity"]
          time_of_day: Database["public"]["Enums"]["quest_time_of_day"]
          updated_at: string
        }
        Insert: {
          accessibility_level?: Database["public"]["Enums"]["quest_accessibility_level"]
          age_requirement?: Database["public"]["Enums"]["quest_age_requirement"]
          alcohol?: Database["public"]["Enums"]["quest_alcohol_level"]
          budget_level?: Database["public"]["Enums"]["quest_budget_level"]
          created_at?: string
          id?: string
          indoor_outdoor?: Database["public"]["Enums"]["quest_indoor_outdoor"]
          noise_level?: Database["public"]["Enums"]["quest_noise_level"]
          physical_intensity?: Database["public"]["Enums"]["quest_intensity_level"]
          quest_id: string
          social_intensity?: Database["public"]["Enums"]["quest_social_intensity"]
          time_of_day?: Database["public"]["Enums"]["quest_time_of_day"]
          updated_at?: string
        }
        Update: {
          accessibility_level?: Database["public"]["Enums"]["quest_accessibility_level"]
          age_requirement?: Database["public"]["Enums"]["quest_age_requirement"]
          alcohol?: Database["public"]["Enums"]["quest_alcohol_level"]
          budget_level?: Database["public"]["Enums"]["quest_budget_level"]
          created_at?: string
          id?: string
          indoor_outdoor?: Database["public"]["Enums"]["quest_indoor_outdoor"]
          noise_level?: Database["public"]["Enums"]["quest_noise_level"]
          physical_intensity?: Database["public"]["Enums"]["quest_intensity_level"]
          quest_id?: string
          social_intensity?: Database["public"]["Enums"]["quest_social_intensity"]
          time_of_day?: Database["public"]["Enums"]["quest_time_of_day"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_constraints_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: true
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_event_log: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          event_type: Database["public"]["Enums"]["quest_event_type"]
          id: string
          instance_id: string | null
          payload: Json | null
          target_user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          created_at?: string
          event_type: Database["public"]["Enums"]["quest_event_type"]
          id?: string
          instance_id?: string | null
          payload?: Json | null
          target_user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["quest_event_type"]
          id?: string
          instance_id?: string | null
          payload?: Json | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_event_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_instances: {
        Row: {
          archived_at: string | null
          briefing_html: string | null
          capacity: number
          check_in_closes_at: string | null
          check_in_opens_at: string | null
          created_at: string
          created_by: string | null
          current_signup_count: number | null
          description: string | null
          end_time: string | null
          icon: string | null
          id: string
          instance_slug: string
          meeting_point_address: string | null
          meeting_point_coords: unknown
          meeting_point_name: string | null
          objectives: Json | null
          operator_notes: string | null
          paused_at: string | null
          paused_reason: string | null
          previous_status: Database["public"]["Enums"]["instance_status"] | null
          progression_tree: string | null
          quest_card_token: string
          quest_id: string | null
          required_proof_types: string[] | null
          safety_notes: string | null
          scheduled_date: string
          squads_locked: boolean | null
          start_time: string
          status: Database["public"]["Enums"]["instance_status"]
          target_squad_size: number | null
          timezone: string | null
          title: string
          updated_at: string
          what_to_bring: string | null
          whatsapp_invite_link: string | null
          xp_rules: Json | null
        }
        Insert: {
          archived_at?: string | null
          briefing_html?: string | null
          capacity?: number
          check_in_closes_at?: string | null
          check_in_opens_at?: string | null
          created_at?: string
          created_by?: string | null
          current_signup_count?: number | null
          description?: string | null
          end_time?: string | null
          icon?: string | null
          id?: string
          instance_slug: string
          meeting_point_address?: string | null
          meeting_point_coords?: unknown
          meeting_point_name?: string | null
          objectives?: Json | null
          operator_notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          previous_status?:
            | Database["public"]["Enums"]["instance_status"]
            | null
          progression_tree?: string | null
          quest_card_token?: string
          quest_id?: string | null
          required_proof_types?: string[] | null
          safety_notes?: string | null
          scheduled_date: string
          squads_locked?: boolean | null
          start_time: string
          status?: Database["public"]["Enums"]["instance_status"]
          target_squad_size?: number | null
          timezone?: string | null
          title: string
          updated_at?: string
          what_to_bring?: string | null
          whatsapp_invite_link?: string | null
          xp_rules?: Json | null
        }
        Update: {
          archived_at?: string | null
          briefing_html?: string | null
          capacity?: number
          check_in_closes_at?: string | null
          check_in_opens_at?: string | null
          created_at?: string
          created_by?: string | null
          current_signup_count?: number | null
          description?: string | null
          end_time?: string | null
          icon?: string | null
          id?: string
          instance_slug?: string
          meeting_point_address?: string | null
          meeting_point_coords?: unknown
          meeting_point_name?: string | null
          objectives?: Json | null
          operator_notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          previous_status?:
            | Database["public"]["Enums"]["instance_status"]
            | null
          progression_tree?: string | null
          quest_card_token?: string
          quest_id?: string | null
          required_proof_types?: string[] | null
          safety_notes?: string | null
          scheduled_date?: string
          squads_locked?: boolean | null
          start_time?: string
          status?: Database["public"]["Enums"]["instance_status"]
          target_squad_size?: number | null
          timezone?: string | null
          title?: string
          updated_at?: string
          what_to_bring?: string | null
          whatsapp_invite_link?: string | null
          xp_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_instances_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_objectives: {
        Row: {
          ai_generated: boolean
          completion_rule: Database["public"]["Enums"]["quest_completion_rule"]
          created_at: string
          id: string
          is_required: boolean
          objective_order: number
          objective_text: string
          objective_type: Database["public"]["Enums"]["quest_objective_type"]
          proof_type: Database["public"]["Enums"]["quest_proof_type"]
          quest_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          completion_rule?: Database["public"]["Enums"]["quest_completion_rule"]
          created_at?: string
          id?: string
          is_required?: boolean
          objective_order?: number
          objective_text: string
          objective_type?: Database["public"]["Enums"]["quest_objective_type"]
          proof_type?: Database["public"]["Enums"]["quest_proof_type"]
          quest_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          completion_rule?: Database["public"]["Enums"]["quest_completion_rule"]
          created_at?: string
          id?: string
          is_required?: boolean
          objective_order?: number
          objective_text?: string
          objective_type?: Database["public"]["Enums"]["quest_objective_type"]
          proof_type?: Database["public"]["Enums"]["quest_proof_type"]
          quest_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_objectives_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_personality_affinity: {
        Row: {
          ai_generated: boolean
          created_at: string
          explanation: string | null
          id: string
          quest_id: string
          trait_key: string
          trait_weight: number
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          quest_id: string
          trait_key: string
          trait_weight?: number
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          quest_id?: string
          trait_key?: string
          trait_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_personality_affinity_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_roles: {
        Row: {
          ai_generated: boolean
          created_at: string
          id: string
          quest_id: string
          role_description: string | null
          role_name: Database["public"]["Enums"]["quest_role_name"]
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          id?: string
          quest_id: string
          role_description?: string | null
          role_name: Database["public"]["Enums"]["quest_role_name"]
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          id?: string
          quest_id?: string
          role_description?: string | null
          role_name?: Database["public"]["Enums"]["quest_role_name"]
        }
        Relationships: [
          {
            foreignKeyName: "quest_roles_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_signups: {
        Row: {
          cancellation_reason: string | null
          checked_in_at: string | null
          completed_at: string | null
          id: string
          instance_id: string | null
          last_activity_at: string | null
          notes_private: string | null
          participant_token: string | null
          phone: string | null
          proof_submitted_at: string | null
          quest_id: string
          reenlist_answered_at: string | null
          signed_up_at: string
          status: Database["public"]["Enums"]["signup_status"] | null
          updated_at: string
          user_id: string
          wants_reenlist: boolean | null
          whatsapp_joined: boolean | null
        }
        Insert: {
          cancellation_reason?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          id?: string
          instance_id?: string | null
          last_activity_at?: string | null
          notes_private?: string | null
          participant_token?: string | null
          phone?: string | null
          proof_submitted_at?: string | null
          quest_id: string
          reenlist_answered_at?: string | null
          signed_up_at?: string
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string
          user_id: string
          wants_reenlist?: boolean | null
          whatsapp_joined?: boolean | null
        }
        Update: {
          cancellation_reason?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          id?: string
          instance_id?: string | null
          last_activity_at?: string | null
          notes_private?: string | null
          participant_token?: string | null
          phone?: string | null
          proof_submitted_at?: string | null
          quest_id?: string
          reenlist_answered_at?: string | null
          signed_up_at?: string
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string
          user_id?: string
          wants_reenlist?: boolean | null
          whatsapp_joined?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_signups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
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
          archived_at: string | null
          archived_reason: string | null
          compatibility_score: number | null
          confirmed_at: string | null
          created_at: string
          formation_reason: Json | null
          id: string
          locked_at: string | null
          locked_by: string | null
          quest_id: string
          referral_bonds: number | null
          squad_name: string
          status: Database["public"]["Enums"]["squad_status"]
          whatsapp_link: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_reason?: string | null
          compatibility_score?: number | null
          confirmed_at?: string | null
          created_at?: string
          formation_reason?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          quest_id: string
          referral_bonds?: number | null
          squad_name?: string
          status?: Database["public"]["Enums"]["squad_status"]
          whatsapp_link?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_reason?: string | null
          compatibility_score?: number | null
          confirmed_at?: string | null
          created_at?: string
          formation_reason?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          quest_id?: string
          referral_bonds?: number | null
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
          admin_notes: string | null
          age_restriction: string | null
          ai_draft_applied_at: string | null
          ai_generated: boolean | null
          ai_version: string | null
          base_xp: number | null
          briefing_html: string | null
          capacity_total: number | null
          city: string | null
          cost_description: string | null
          created_at: string
          created_via: string | null
          creator_id: string | null
          creator_name: string | null
          creator_notes: string | null
          creator_social_url: string | null
          creator_type: string | null
          default_capacity: number | null
          default_duration_minutes: number | null
          default_squad_size: number | null
          deleted_at: string | null
          dress_code: string | null
          duration_notes: string | null
          emergency_contact: string | null
          end_datetime: string | null
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          event_source: Database["public"]["Enums"]["quest_event_source"] | null
          eventbrite_event_id: string | null
          external_ticket_url: string | null
          full_description: string | null
          highlights: Json | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_repeatable: boolean | null
          is_sponsored: boolean | null
          is_ticketed: boolean | null
          meeting_address: string | null
          meeting_location_name: string | null
          min_level: number | null
          min_tree_xp: number | null
          objectives: string | null
          org_id: string | null
          paused_at: string | null
          paused_by: string | null
          paused_reason: string | null
          physical_requirements: string | null
          previous_status: Database["public"]["Enums"]["quest_status"] | null
          price_type: Database["public"]["Enums"]["quest_price_type"] | null
          priority_flag: boolean | null
          progression_tree: string | null
          published_at: string | null
          required_achievement_id: string | null
          required_proof_types: string[] | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          revision_count: number | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          rewards: string | null
          safety_level: Database["public"]["Enums"]["quest_safety_level"] | null
          safety_notes: string | null
          short_description: string | null
          short_teaser: string | null
          slug: string
          sponsor_id: string | null
          sponsor_offering: Json | null
          start_datetime: string | null
          status: Database["public"]["Enums"]["quest_status"] | null
          submitted_at: string | null
          success_criteria: string | null
          tags: string[] | null
          theme: string | null
          theme_color: string | null
          timeline_prompts: Json | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["quest_visibility"]
          what_to_bring: string | null
          whatsapp_invite_link: string | null
          xp_rules: Json | null
        }
        Insert: {
          admin_notes?: string | null
          age_restriction?: string | null
          ai_draft_applied_at?: string | null
          ai_generated?: boolean | null
          ai_version?: string | null
          base_xp?: number | null
          briefing_html?: string | null
          capacity_total?: number | null
          city?: string | null
          cost_description?: string | null
          created_at?: string
          created_via?: string | null
          creator_id?: string | null
          creator_name?: string | null
          creator_notes?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          default_capacity?: number | null
          default_duration_minutes?: number | null
          default_squad_size?: number | null
          deleted_at?: string | null
          dress_code?: string | null
          duration_notes?: string | null
          emergency_contact?: string | null
          end_datetime?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          event_source?:
            | Database["public"]["Enums"]["quest_event_source"]
            | null
          eventbrite_event_id?: string | null
          external_ticket_url?: string | null
          full_description?: string | null
          highlights?: Json | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_repeatable?: boolean | null
          is_sponsored?: boolean | null
          is_ticketed?: boolean | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          min_level?: number | null
          min_tree_xp?: number | null
          objectives?: string | null
          org_id?: string | null
          paused_at?: string | null
          paused_by?: string | null
          paused_reason?: string | null
          physical_requirements?: string | null
          previous_status?: Database["public"]["Enums"]["quest_status"] | null
          price_type?: Database["public"]["Enums"]["quest_price_type"] | null
          priority_flag?: boolean | null
          progression_tree?: string | null
          published_at?: string | null
          required_achievement_id?: string | null
          required_proof_types?: string[] | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          revision_count?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          rewards?: string | null
          safety_level?:
            | Database["public"]["Enums"]["quest_safety_level"]
            | null
          safety_notes?: string | null
          short_description?: string | null
          short_teaser?: string | null
          slug: string
          sponsor_id?: string | null
          sponsor_offering?: Json | null
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          submitted_at?: string | null
          success_criteria?: string | null
          tags?: string[] | null
          theme?: string | null
          theme_color?: string | null
          timeline_prompts?: Json | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
          what_to_bring?: string | null
          whatsapp_invite_link?: string | null
          xp_rules?: Json | null
        }
        Update: {
          admin_notes?: string | null
          age_restriction?: string | null
          ai_draft_applied_at?: string | null
          ai_generated?: boolean | null
          ai_version?: string | null
          base_xp?: number | null
          briefing_html?: string | null
          capacity_total?: number | null
          city?: string | null
          cost_description?: string | null
          created_at?: string
          created_via?: string | null
          creator_id?: string | null
          creator_name?: string | null
          creator_notes?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          default_capacity?: number | null
          default_duration_minutes?: number | null
          default_squad_size?: number | null
          deleted_at?: string | null
          dress_code?: string | null
          duration_notes?: string | null
          emergency_contact?: string | null
          end_datetime?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          event_source?:
            | Database["public"]["Enums"]["quest_event_source"]
            | null
          eventbrite_event_id?: string | null
          external_ticket_url?: string | null
          full_description?: string | null
          highlights?: Json | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_repeatable?: boolean | null
          is_sponsored?: boolean | null
          is_ticketed?: boolean | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          min_level?: number | null
          min_tree_xp?: number | null
          objectives?: string | null
          org_id?: string | null
          paused_at?: string | null
          paused_by?: string | null
          paused_reason?: string | null
          physical_requirements?: string | null
          previous_status?: Database["public"]["Enums"]["quest_status"] | null
          price_type?: Database["public"]["Enums"]["quest_price_type"] | null
          priority_flag?: boolean | null
          progression_tree?: string | null
          published_at?: string | null
          required_achievement_id?: string | null
          required_proof_types?: string[] | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          revision_count?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          rewards?: string | null
          safety_level?:
            | Database["public"]["Enums"]["quest_safety_level"]
            | null
          safety_notes?: string | null
          short_description?: string | null
          short_teaser?: string | null
          slug?: string
          sponsor_id?: string | null
          sponsor_offering?: Json | null
          start_datetime?: string | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          submitted_at?: string | null
          success_criteria?: string | null
          tags?: string[] | null
          theme?: string | null
          theme_color?: string | null
          timeline_prompts?: Json | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
          what_to_bring?: string | null
          whatsapp_invite_link?: string | null
          xp_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_required_achievement_id_fkey"
            columns: ["required_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_count?: number | null
          action_type: string
          id?: string
          user_id: string
          window_start: string
        }
        Update: {
          action_count?: number | null
          action_type?: string
          id?: string
          user_id?: string
          window_start?: string
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
      reward_redemptions: {
        Row: {
          id: string
          quest_id: string | null
          redeemed_at: string
          reward_id: string
          user_id: string
        }
        Insert: {
          id?: string
          quest_id?: string | null
          redeemed_at?: string
          reward_id: string
          user_id: string
        }
        Update: {
          id?: string
          quest_id?: string | null
          redeemed_at?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          fulfillment_data: string | null
          fulfillment_type: string
          id: string
          max_redemptions: number | null
          name: string
          quest_requirements: Json | null
          redemptions_count: number | null
          sponsor_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          fulfillment_data?: string | null
          fulfillment_type?: string
          id?: string
          max_redemptions?: number | null
          name: string
          quest_requirements?: Json | null
          redemptions_count?: number | null
          sponsor_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          fulfillment_data?: string | null
          fulfillment_type?: string
          id?: string
          max_redemptions?: number | null
          name?: string
          quest_requirements?: Json | null
          redemptions_count?: number | null
          sponsor_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_applications: {
        Row: {
          business_name: string
          contact_email: string
          contact_name: string
          created_at: string | null
          description: string | null
          id: string
          internal_notes: string | null
          message: string | null
          preferred_quest_types: string[] | null
          sponsor_type: string
          status: string | null
          target_audience: Json | null
          website: string | null
        }
        Insert: {
          business_name: string
          contact_email: string
          contact_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          preferred_quest_types?: string[] | null
          sponsor_type?: string
          status?: string | null
          target_audience?: Json | null
          website?: string | null
        }
        Update: {
          business_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          preferred_quest_types?: string[] | null
          sponsor_type?: string
          status?: string | null
          target_audience?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      sponsor_invites: {
        Row: {
          application_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          redeemed_at: string | null
          token: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          redeemed_at?: string | null
          token?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          redeemed_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_invites_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "sponsor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_listings: {
        Row: {
          applications_count: number | null
          budget_range: string | null
          created_at: string | null
          creator_requirements: string | null
          description: string | null
          expected_attendance: string | null
          expires_at: string | null
          id: string
          includes_branding: boolean | null
          preferred_dates: string | null
          quest_type: string | null
          rewards_offered: Json | null
          sponsor_id: string
          status: string
          target_audience: Json | null
          title: string
          updated_at: string | null
          venue_offered: string | null
        }
        Insert: {
          applications_count?: number | null
          budget_range?: string | null
          created_at?: string | null
          creator_requirements?: string | null
          description?: string | null
          expected_attendance?: string | null
          expires_at?: string | null
          id?: string
          includes_branding?: boolean | null
          preferred_dates?: string | null
          quest_type?: string | null
          rewards_offered?: Json | null
          sponsor_id: string
          status?: string
          target_audience?: Json | null
          title: string
          updated_at?: string | null
          venue_offered?: string | null
        }
        Update: {
          applications_count?: number | null
          budget_range?: string | null
          created_at?: string | null
          creator_requirements?: string | null
          description?: string | null
          expected_attendance?: string | null
          expires_at?: string | null
          id?: string
          includes_branding?: boolean | null
          preferred_dates?: string | null
          quest_type?: string | null
          rewards_offered?: Json | null
          sponsor_id?: string
          status?: string
          target_audience?: Json | null
          title?: string
          updated_at?: string | null
          venue_offered?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_listings_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_listings_venue_offered_fkey"
            columns: ["venue_offered"]
            isOneToOne: false
            referencedRelation: "venue_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_org_requests: {
        Row: {
          created_at: string
          decline_reason: string | null
          description: string | null
          id: string
          offering: Json | null
          org_id: string
          org_response_at: string | null
          preferred_dates: string | null
          requester_id: string
          sponsor_id: string
          status: string
          target_demographics: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          id?: string
          offering?: Json | null
          org_id: string
          org_response_at?: string | null
          preferred_dates?: string | null
          requester_id: string
          sponsor_id: string
          status?: string
          target_demographics?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          description?: string | null
          id?: string
          offering?: Json | null
          org_id?: string
          org_response_at?: string | null
          preferred_dates?: string | null
          requester_id?: string
          sponsor_id?: string
          status?: string
          target_demographics?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_org_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_org_requests_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_profiles: {
        Row: {
          brand_tone: string | null
          budget_range: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          id: string
          listing_templates: Json | null
          logo_url: string | null
          name: string
          preferred_quest_types: string[] | null
          proposal_templates: Json | null
          seeking: string[] | null
          slug: string | null
          sponsor_type: string
          status: string
          target_audience: Json | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          brand_tone?: string | null
          budget_range?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_templates?: Json | null
          logo_url?: string | null
          name: string
          preferred_quest_types?: string[] | null
          proposal_templates?: Json | null
          seeking?: string[] | null
          slug?: string | null
          sponsor_type?: string
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          brand_tone?: string | null
          budget_range?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_templates?: Json | null
          logo_url?: string | null
          name?: string
          preferred_quest_types?: string[] | null
          proposal_templates?: Json | null
          seeking?: string[] | null
          slug?: string | null
          sponsor_type?: string
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      sponsored_quests: {
        Row: {
          analytics_access_level: string | null
          created_at: string
          id: string
          proposal_id: string | null
          quest_id: string
          rewards_attached: string[] | null
          sponsor_id: string
        }
        Insert: {
          analytics_access_level?: string | null
          created_at?: string
          id?: string
          proposal_id?: string | null
          quest_id: string
          rewards_attached?: string[] | null
          sponsor_id: string
        }
        Update: {
          analytics_access_level?: string | null
          created_at?: string
          id?: string
          proposal_id?: string | null
          quest_id?: string
          rewards_attached?: string[] | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_quests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_quests_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_proposals: {
        Row: {
          admin_approved_at: string | null
          admin_notes: string | null
          budget_or_reward: string | null
          created_at: string
          creator_id: string | null
          creator_response_at: string | null
          decline_reason: string | null
          id: string
          message: string | null
          proposal_type: string
          quest_id: string | null
          reward_ids: string[] | null
          sponsor_id: string
          status: string
          venue_offering_id: string | null
        }
        Insert: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          budget_or_reward?: string | null
          created_at?: string
          creator_id?: string | null
          creator_response_at?: string | null
          decline_reason?: string | null
          id?: string
          message?: string | null
          proposal_type: string
          quest_id?: string | null
          reward_ids?: string[] | null
          sponsor_id: string
          status?: string
          venue_offering_id?: string | null
        }
        Update: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          budget_or_reward?: string | null
          created_at?: string
          creator_id?: string | null
          creator_response_at?: string | null
          decline_reason?: string | null
          id?: string
          message?: string | null
          proposal_type?: string
          quest_id?: string | null
          reward_ids?: string[] | null
          sponsor_id?: string
          status?: string
          venue_offering_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_proposals_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_proposals_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_proposals_venue_offering_id_fkey"
            columns: ["venue_offering_id"]
            isOneToOne: false
            referencedRelation: "venue_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_appreciations: {
        Row: {
          appreciation_type: string
          created_at: string | null
          free_text: string | null
          from_user_id: string | null
          id: string
          quest_id: string | null
          squad_id: string | null
          to_user_id: string | null
        }
        Insert: {
          appreciation_type: string
          created_at?: string | null
          free_text?: string | null
          from_user_id?: string | null
          id?: string
          quest_id?: string | null
          squad_id?: string | null
          to_user_id?: string | null
        }
        Update: {
          appreciation_type?: string
          created_at?: string | null
          free_text?: string | null
          from_user_id?: string | null
          id?: string
          quest_id?: string | null
          squad_id?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_appreciations_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_appreciations_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_appreciations_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_appreciations_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_appreciations_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_appreciations_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_archive_reports: {
        Row: {
          created_at: string
          created_by: string | null
          export_format: string
          file_url: string | null
          id: string
          report_data: Json
          squad_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_format?: string
          file_url?: string | null
          id?: string
          report_data?: Json
          squad_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_format?: string
          file_url?: string | null
          id?: string
          report_data?: Json
          squad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_archive_reports_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_chat_messages: {
        Row: {
          created_at: string | null
          hidden_at: string | null
          hidden_by: string | null
          hide_reason: string | null
          id: string
          is_pinned: boolean | null
          message: string
          reactions: Json | null
          sender_id: string
          sender_type: string | null
          squad_id: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          hide_reason?: string | null
          id?: string
          is_pinned?: boolean | null
          message: string
          reactions?: Json | null
          sender_id: string
          sender_type?: string | null
          squad_id: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          hide_reason?: string | null
          id?: string
          is_pinned?: boolean | null
          message?: string
          reactions?: Json | null
          sender_id?: string
          sender_type?: string | null
          squad_id?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_chat_messages_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_chat_messages_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_chat_messages_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "squad_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_invite_responses: {
        Row: {
          id: string
          invite_id: string
          responded_at: string | null
          response: string
          user_id: string
        }
        Insert: {
          id?: string
          invite_id: string
          responded_at?: string | null
          response: string
          user_id: string
        }
        Update: {
          id?: string
          invite_id?: string
          responded_at?: string | null
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_invite_responses_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "squad_quest_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_invite_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_invite_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
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
          clique_role: string | null
          id: string
          persistent_squad_id: string | null
          role: string | null
          role_assigned_at: string | null
          role_assigned_by: string | null
          role_declined_at: string | null
          signup_id: string | null
          squad_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          clique_role?: string | null
          id?: string
          persistent_squad_id?: string | null
          role?: string | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
          role_declined_at?: string | null
          signup_id?: string | null
          squad_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          clique_role?: string | null
          id?: string
          persistent_squad_id?: string | null
          role?: string | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
          role_declined_at?: string | null
          signup_id?: string | null
          squad_id?: string | null
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
            foreignKeyName: "squad_members_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "quest_signups_public"
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
          proposal_message: string | null
          proposed_at: string | null
          proposed_by: string
          quest_id: string
          squad_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposal_message?: string | null
          proposed_at?: string | null
          proposed_by: string
          quest_id: string
          squad_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          proposal_message?: string | null
          proposed_at?: string | null
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
          ai_vibe_summary: string | null
          application_prompts: Json | null
          archived_at: string | null
          clique_rules: string | null
          commitment_style: string | null
          created_at: string
          id: string
          invite_code: string | null
          invite_link_enabled: boolean | null
          lfc_bio: string | null
          lfc_enabled: boolean | null
          lfc_listing_enabled: boolean | null
          lfc_looking_for: string[] | null
          lfc_scope: string | null
          max_members: number | null
          name: string
          org_code: string | null
          origin_quest_id: string | null
          role_rotation_mode: string | null
          theme_tags: string[] | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          ai_vibe_summary?: string | null
          application_prompts?: Json | null
          archived_at?: string | null
          clique_rules?: string | null
          commitment_style?: string | null
          created_at?: string
          id?: string
          invite_code?: string | null
          invite_link_enabled?: boolean | null
          lfc_bio?: string | null
          lfc_enabled?: boolean | null
          lfc_listing_enabled?: boolean | null
          lfc_looking_for?: string[] | null
          lfc_scope?: string | null
          max_members?: number | null
          name?: string
          org_code?: string | null
          origin_quest_id?: string | null
          role_rotation_mode?: string | null
          theme_tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          ai_vibe_summary?: string | null
          application_prompts?: Json | null
          archived_at?: string | null
          clique_rules?: string | null
          commitment_style?: string | null
          created_at?: string
          id?: string
          invite_code?: string | null
          invite_link_enabled?: boolean | null
          lfc_bio?: string | null
          lfc_enabled?: boolean | null
          lfc_listing_enabled?: boolean | null
          lfc_looking_for?: string[] | null
          lfc_scope?: string | null
          max_members?: number | null
          name?: string
          org_code?: string | null
          origin_quest_id?: string | null
          role_rotation_mode?: string | null
          theme_tags?: string[] | null
          updated_at?: string
          visibility?: string | null
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
      streak_rules: {
        Row: {
          created_at: string | null
          grace_periods: number | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          xp_bonus: number | null
        }
        Insert: {
          created_at?: string | null
          grace_periods?: number | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          xp_bonus?: number | null
        }
        Update: {
          created_at?: string | null
          grace_periods?: number | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          xp_bonus?: number | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_admin_id: string | null
          category_id: string
          created_at: string
          description: string
          first_response_at: string | null
          first_response_sla_breached_at: string | null
          id: string
          incident_id: string | null
          internal_notes: string | null
          metadata: Json | null
          parent_ticket_id: string | null
          related_quest_id: string | null
          related_squad_id: string | null
          related_user_id: string | null
          resolution_sla_breached_at: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          submitted_from_page: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["ticket_urgency"]
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          category_id: string
          created_at?: string
          description: string
          first_response_at?: string | null
          first_response_sla_breached_at?: string | null
          id?: string
          incident_id?: string | null
          internal_notes?: string | null
          metadata?: Json | null
          parent_ticket_id?: string | null
          related_quest_id?: string | null
          related_squad_id?: string | null
          related_user_id?: string | null
          resolution_sla_breached_at?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          submitted_from_page?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["ticket_urgency"]
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          category_id?: string
          created_at?: string
          description?: string
          first_response_at?: string | null
          first_response_sla_breached_at?: string | null
          id?: string
          incident_id?: string | null
          internal_notes?: string | null
          metadata?: Json | null
          parent_ticket_id?: string | null
          related_quest_id?: string | null
          related_squad_id?: string | null
          related_user_id?: string | null
          resolution_sla_breached_at?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          submitted_from_page?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["ticket_urgency"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "issue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_parent_ticket_id_fkey"
            columns: ["parent_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_quest_id_fkey"
            columns: ["related_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_squad_id_fkey"
            columns: ["related_squad_id"]
            isOneToOne: false
            referencedRelation: "quest_squads"
            referencedColumns: ["id"]
          },
        ]
      }
      system_docs: {
        Row: {
          category: string
          content_hash: string | null
          content_markdown: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          last_edited_by: string | null
          last_exported_at: string | null
          mermaid_diagram: string | null
          slug: string
          sort_order: number | null
          subcategory: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          content_hash?: string | null
          content_markdown?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          last_edited_by?: string | null
          last_exported_at?: string | null
          mermaid_diagram?: string | null
          slug: string
          sort_order?: number | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          content_hash?: string | null
          content_markdown?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          last_edited_by?: string | null
          last_exported_at?: string | null
          mermaid_diagram?: string | null
          slug?: string
          sort_order?: number | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number
          file_type: string
          file_url: string
          id: string
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes: number
          file_type: string
          file_url: string
          id?: string
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          file_url?: string
          id?: string
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_satisfaction: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_satisfaction_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_applications: {
        Row: {
          applicant_email: string
          applicant_id: string | null
          applicant_name: string
          city_name: string | null
          city_region: string | null
          created_at: string | null
          decline_reason: string | null
          demo_completed_at: string | null
          demo_requested: boolean | null
          demo_scheduled_at: string | null
          enterprise_type: Database["public"]["Enums"]["enterprise_type"] | null
          estimated_arr: number | null
          estimated_headcount: number | null
          estimated_population: number | null
          id: string
          intended_plan: string | null
          intended_pricing_model:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          notes: string | null
          organization_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tier: Database["public"]["Enums"]["account_tier"]
          updated_at: string | null
          use_case_description: string | null
        }
        Insert: {
          applicant_email: string
          applicant_id?: string | null
          applicant_name: string
          city_name?: string | null
          city_region?: string | null
          created_at?: string | null
          decline_reason?: string | null
          demo_completed_at?: string | null
          demo_requested?: boolean | null
          demo_scheduled_at?: string | null
          enterprise_type?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          estimated_arr?: number | null
          estimated_headcount?: number | null
          estimated_population?: number | null
          id?: string
          intended_plan?: string | null
          intended_pricing_model?:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          notes?: string | null
          organization_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tier: Database["public"]["Enums"]["account_tier"]
          updated_at?: string | null
          use_case_description?: string | null
        }
        Update: {
          applicant_email?: string
          applicant_id?: string | null
          applicant_name?: string
          city_name?: string | null
          city_region?: string | null
          created_at?: string | null
          decline_reason?: string | null
          demo_completed_at?: string | null
          demo_requested?: boolean | null
          demo_scheduled_at?: string | null
          enterprise_type?:
            | Database["public"]["Enums"]["enterprise_type"]
            | null
          estimated_arr?: number | null
          estimated_headcount?: number | null
          estimated_population?: number | null
          id?: string
          intended_plan?: string | null
          intended_pricing_model?:
            | Database["public"]["Enums"]["pricing_model"]
            | null
          notes?: string | null
          organization_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tier?: Database["public"]["Enums"]["account_tier"]
          updated_at?: string | null
          use_case_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trait_library: {
        Row: {
          category: string
          changelog: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          emoji: string | null
          id: string
          is_active: boolean | null
          is_negative: boolean | null
          last_modified_by: string | null
          slug: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          changelog?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_negative?: boolean | null
          last_modified_by?: string | null
          slug: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          changelog?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_negative?: boolean | null
          last_modified_by?: string | null
          slug?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          avg_rating: number | null
          cancelled_quests: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          flags_received: number | null
          id: string
          last_calculated_at: string | null
          score: number | null
          successful_quests: number | null
          warnings_issued: number | null
        }
        Insert: {
          avg_rating?: number | null
          cancelled_quests?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          flags_received?: number | null
          id?: string
          last_calculated_at?: string | null
          score?: number | null
          successful_quests?: number | null
          warnings_issued?: number | null
        }
        Update: {
          avg_rating?: number | null
          cancelled_quests?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          flags_received?: number | null
          id?: string
          last_calculated_at?: string | null
          score?: number | null
          successful_quests?: number | null
          warnings_issued?: number | null
        }
        Relationships: []
      }
      ugc_submissions: {
        Row: {
          caption: string | null
          consent_marketing: boolean
          consent_social_media: boolean
          created_at: string
          file_type: string
          file_url: string
          id: string
          instance_id: string | null
          quest_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          consent_marketing?: boolean
          consent_social_media?: boolean
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          instance_id?: string | null
          quest_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          consent_marketing?: boolean
          consent_social_media?: boolean
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          instance_id?: string | null
          quest_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_submissions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_submissions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          progress: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          is_featured: boolean | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          is_featured?: boolean | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          is_featured?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent_log: {
        Row: {
          consent_given: boolean
          consent_type: string
          consent_version: string
          created_at: string
          id: string
          ip_address_hash: string | null
          user_agent_summary: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_given: boolean
          consent_type: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address_hash?: string | null
          user_agent_summary?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_type?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address_hash?: string | null
          user_agent_summary?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          is_active: boolean | null
          scope: Database["public"]["Enums"]["entitlement_scope"]
          source_org_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          scope: Database["public"]["Enums"]["entitlement_scope"]
          source_org_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: Database["public"]["Enums"]["entitlement_scope"]
          source_org_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_source_org_id_fkey"
            columns: ["source_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personality_types: {
        Row: {
          created_at: string | null
          id: string
          system: string
          type_value: string
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          system: string
          type_value: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          system?: string
          type_value?: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_personality_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_personality_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_rankings: {
        Row: {
          created_at: string | null
          id: string
          rank_1: string
          rank_2: string
          rank_3: string
          rank_4: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rank_1: string
          rank_2: string
          rank_3: string
          rank_4: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rank_1?: string
          rank_2?: string
          rank_3?: string
          rank_4?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_signals: {
        Row: {
          created_at: string | null
          id: string
          role_type: string
          signal_source: string
          source_id: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_type: string
          signal_source: string
          source_id?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_type?: string
          signal_source?: string
          source_id?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
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
      user_social_energy: {
        Row: {
          created_at: string | null
          energy_axis: number | null
          energy_weight: number | null
          focus_axis: number | null
          focus_weight: number | null
          id: string
          is_locked: boolean | null
          source: string | null
          structure_axis: number | null
          structure_weight: number | null
          updated_at: string | null
          use_for_matching: boolean | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          energy_axis?: number | null
          energy_weight?: number | null
          focus_axis?: number | null
          focus_weight?: number | null
          id?: string
          is_locked?: boolean | null
          source?: string | null
          structure_axis?: number | null
          structure_weight?: number | null
          updated_at?: string | null
          use_for_matching?: boolean | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          energy_axis?: number | null
          energy_weight?: number | null
          focus_axis?: number | null
          focus_weight?: number | null
          id?: string
          is_locked?: boolean | null
          source?: string | null
          structure_axis?: number | null
          structure_weight?: number | null
          updated_at?: string | null
          use_for_matching?: boolean | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_social_energy_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_social_energy_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          last_activity_at: string | null
          longest_count: number | null
          streak_broken_at: string | null
          streak_rule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          last_activity_at?: string | null
          longest_count?: number | null
          streak_broken_at?: string | null
          streak_rule_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          last_activity_at?: string | null
          longest_count?: number | null
          streak_broken_at?: string | null
          streak_rule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_streak_rule_id_fkey"
            columns: ["streak_rule_id"]
            isOneToOne: false
            referencedRelation: "streak_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_traits: {
        Row: {
          created_at: string | null
          id: string
          importance: number | null
          source: string
          source_draft_id: string | null
          trait_slug: string
          updated_at: string | null
          use_for_matching: boolean | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          importance?: number | null
          source: string
          source_draft_id?: string | null
          trait_slug: string
          updated_at?: string | null
          use_for_matching?: boolean | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          importance?: number | null
          source?: string
          source_draft_id?: string | null
          trait_slug?: string
          updated_at?: string | null
          use_for_matching?: boolean | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_traits_source_draft_id_fkey"
            columns: ["source_draft_id"]
            isOneToOne: false
            referencedRelation: "draft_traits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_traits_trait_slug_fkey"
            columns: ["trait_slug"]
            isOneToOne: false
            referencedRelation: "trait_library"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_tree_xp: {
        Row: {
          created_at: string | null
          id: string
          tree_id: string
          tree_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tree_id: string
          tree_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tree_id?: string
          tree_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string
          id: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venue_offerings: {
        Row: {
          address: string | null
          amenities: string[] | null
          approval_required: boolean | null
          available_days: string[] | null
          available_time_blocks: Json | null
          capacity: number | null
          created_at: string
          id: string
          ideal_quest_types: string[] | null
          sponsor_id: string
          status: string
          venue_name: string
          venue_rules: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          approval_required?: boolean | null
          available_days?: string[] | null
          available_time_blocks?: Json | null
          capacity?: number | null
          created_at?: string
          id?: string
          ideal_quest_types?: string[] | null
          sponsor_id: string
          status?: string
          venue_name: string
          venue_rules?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          approval_required?: boolean | null
          available_days?: string[] | null
          available_time_blocks?: Json | null
          capacity?: number | null
          created_at?: string
          id?: string
          ideal_quest_types?: string[] | null
          sponsor_id?: string
          status?: string
          venue_name?: string
          venue_rules?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_offerings_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wrapped_cards: {
        Row: {
          card_data: Json
          card_narrative: string | null
          card_type: string
          generated_at: string | null
          id: string
          is_included_in_share: boolean | null
          milestone_trigger: string | null
          period_end: string | null
          period_start: string | null
          user_id: string | null
        }
        Insert: {
          card_data: Json
          card_narrative?: string | null
          card_type: string
          generated_at?: string | null
          id?: string
          is_included_in_share?: boolean | null
          milestone_trigger?: string | null
          period_end?: string | null
          period_start?: string | null
          user_id?: string | null
        }
        Update: {
          card_data?: Json
          card_narrative?: string | null
          card_type?: string
          generated_at?: string | null
          id?: string
          is_included_in_share?: boolean | null
          milestone_trigger?: string | null
          period_end?: string | null
          period_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wrapped_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wrapped_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      eventbrite_connections_safe: {
        Row: {
          connected_at: string | null
          eventbrite_email: string | null
          eventbrite_user_id: string | null
          id: string | null
          is_active: boolean | null
          last_sync_at: string | null
          org_id: string | null
          token_expires_at: string | null
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          eventbrite_email?: string | null
          eventbrite_user_id?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          org_id?: string | null
          token_expires_at?: string | null
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          eventbrite_email?: string | null
          eventbrite_user_id?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          org_id?: string | null
          token_expires_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventbrite_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventbrite_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventbrite_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          visibility_level: string | null
        }
        Insert: {
          city?: never
          created_at?: string | null
          display_name?: never
          id?: string | null
          visibility_level?: never
        }
        Update: {
          city?: never
          created_at?: string | null
          display_name?: never
          id?: string | null
          visibility_level?: never
        }
        Relationships: []
      }
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
      quest_signups_public: {
        Row: {
          checked_in_at: string | null
          completed_at: string | null
          id: string | null
          instance_id: string | null
          last_activity_at: string | null
          proof_submitted_at: string | null
          quest_id: string | null
          signed_up_at: string | null
          status: Database["public"]["Enums"]["signup_status"] | null
          updated_at: string | null
          user_id: string | null
          whatsapp_joined: boolean | null
        }
        Insert: {
          checked_in_at?: string | null
          completed_at?: string | null
          id?: string | null
          instance_id?: string | null
          last_activity_at?: string | null
          proof_submitted_at?: string | null
          quest_id?: string | null
          signed_up_at?: string | null
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_joined?: boolean | null
        }
        Update: {
          checked_in_at?: string | null
          completed_at?: string | null
          id?: string | null
          instance_id?: string | null
          last_activity_at?: string | null
          proof_submitted_at?: string | null
          quest_id?: string | null
          signed_up_at?: string | null
          status?: Database["public"]["Enums"]["signup_status"] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_joined?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_signups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_signups_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_squad: {
        Args: { p_force?: boolean; p_notes?: string; p_squad_id: string }
        Returns: undefined
      }
      archive_clique: { Args: { p_clique_id: string }; Returns: undefined }
      assign_clique_role: {
        Args: {
          p_clique_id: string
          p_expires_at?: string
          p_role: string
          p_user_id: string
        }
        Returns: string
      }
      auto_archive_instances: { Args: never; Returns: number }
      auto_archive_squads: { Args: never; Returns: number }
      award_quest_xp: {
        Args: { p_quest_id: string; p_user_id: string }
        Returns: number
      }
      award_tree_xp: {
        Args: { p_amount: number; p_tree_id: string; p_user_id: string }
        Returns: number
      }
      award_xp: {
        Args: {
          p_amount: number
          p_source: string
          p_source_id?: string
          p_user_id: string
        }
        Returns: number
      }
      calculate_trust_score: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: number
      }
      can_view_profile: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      check_and_unlock_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          xp_reward: number
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_actions?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_squad_readiness: { Args: { p_squad_id: string }; Returns: Json }
      check_streak_bonus: {
        Args: { p_user_id: string }
        Returns: {
          bonus_xp: number
          current_count: number
          streak_name: string
        }[]
      }
      check_user_entitlement: {
        Args: {
          p_org_id?: string
          p_scope: Database["public"]["Enums"]["entitlement_scope"]
          p_user_id: string
        }
        Returns: boolean
      }
      confirm_warm_up_readiness: {
        Args: { p_squad_id: string }
        Returns: undefined
      }
      create_instance_from_quest: {
        Args: {
          p_end_time?: string
          p_meeting_point_address?: string
          p_meeting_point_name?: string
          p_quest_id: string
          p_scheduled_date: string
          p_start_time: string
        }
        Returns: string
      }
      create_instance_from_template: {
        Args: {
          p_meeting_point_address?: string
          p_meeting_point_name?: string
          p_scheduled_date: string
          p_start_time: string
          p_template_id: string
        }
        Returns: string
      }
      decline_clique_role: {
        Args: { p_clique_id: string; p_role: string }
        Returns: undefined
      }
      delete_clique: { Args: { p_clique_id: string }; Returns: Json }
      generate_friend_invite_code: { Args: never; Returns: string }
      generate_invite_code: {
        Args: {
          p_expires_days?: number
          p_label?: string
          p_max_uses?: number
          p_notes?: string
          p_type?: Database["public"]["Enums"]["invite_code_type"]
        }
        Returns: string
      }
      generate_simple_invite_code: { Args: never; Returns: string }
      get_or_create_friend_invite: {
        Args: { p_quest_id: string }
        Returns: {
          code: string
          created: boolean
        }[]
      }
      get_or_create_instance: {
        Args: { p_quest_id: string }
        Returns: {
          instance_id: string
          instances_available: number
          needs_picker: boolean
        }[]
      }
      get_pilot_metrics: { Args: { p_pilot_id: string }; Returns: Json }
      get_ranked_quests: {
        Args: {
          p_limit?: number
          p_org_id?: string
          p_progression_tree?: string
        }
        Returns: {
          quest_id: string
          rank_score: number
          slug: string
          title: string
        }[]
      }
      get_signup_phone: { Args: { target_signup_id: string }; Returns: string }
      get_upcoming_instances: {
        Args: { p_quest_id: string }
        Returns: {
          capacity: number
          current_signup_count: number
          end_time: string
          id: string
          instance_slug: string
          meeting_point_address: string
          meeting_point_name: string
          scheduled_date: string
          spots_remaining: number
          start_time: string
          status: Database["public"]["Enums"]["instance_status"]
          title: string
        }[]
      }
      get_user_email: { Args: { target_user_id: string }; Returns: string }
      get_user_level: {
        Args: { p_user_id: string }
        Returns: {
          current_xp: number
          level: number
          name: string
          next_level_xp: number
        }[]
      }
      has_org_role: {
        Args: {
          p_org_id: string
          p_roles: Database["public"]["Enums"]["org_member_role"][]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_reward_redemptions: {
        Args: { p_reward_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_clique_member: { Args: { p_clique_id: string }; Returns: boolean }
      is_squad_member: { Args: { p_squad_id: string }; Returns: boolean }
      join_org_via_email: {
        Args: { p_email: string; p_org_id: string }
        Returns: Json
      }
      log_pii_access: {
        Args: {
          p_access_type: string
          p_accessed_fields?: string[]
          p_reason?: string
          p_target_table?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      log_quest_event: {
        Args: {
          p_actor_id?: string
          p_actor_type: string
          p_event_type: Database["public"]["Enums"]["quest_event_type"]
          p_instance_id: string
          p_payload?: Json
          p_target_user_id?: string
        }
        Returns: string
      }
      reactivate_clique: { Args: { p_clique_id: string }; Returns: undefined }
      record_referral_signup: {
        Args: { p_referral_code: string; p_user_id: string }
        Returns: undefined
      }
      redeem_friend_invite: {
        Args: { p_code: string; p_new_user_id: string }
        Returns: Json
      }
      redeem_invite_code: {
        Args: {
          p_code: string
          p_referral_source?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      redeem_org_invite: { Args: { p_code: string }; Returns: Json }
      start_squad_warm_up: { Args: { p_squad_id: string }; Returns: undefined }
      submit_warm_up_prompt: {
        Args: { p_response: string; p_squad_id: string }
        Returns: undefined
      }
      track_referral_click: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      transfer_clique_leadership: {
        Args: { p_clique_id: string; p_new_leader_id: string }
        Returns: undefined
      }
      update_user_streaks: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      account_tier:
        | "city"
        | "enterprise"
        | "organization"
        | "individual_free"
        | "individual_premium"
      admin_message_type:
        | "support"
        | "announcement"
        | "feedback_request"
        | "quest_related"
      app_role: "admin" | "user" | "quest_creator" | "sponsor"
      billing_status:
        | "pilot_active"
        | "negotiating"
        | "converted"
        | "past_due"
        | "churned"
      comms_type:
        | "email_invite"
        | "email_confirm"
        | "email_reminder"
        | "email_followup"
        | "email_whatsapp"
      enterprise_type: "company" | "university" | "military" | "program"
      entitlement_scope: "city_scope" | "org_scope" | "personal_scope"
      instance_status:
        | "draft"
        | "recruiting"
        | "locked"
        | "live"
        | "completed"
        | "cancelled"
        | "archived"
        | "paused"
      invite_code_type:
        | "admin"
        | "tester"
        | "early_access"
        | "creator"
        | "organization"
        | "sponsor"
      message_sender_role: "user" | "admin" | "system"
      notification_type:
        | "quest_recommendation"
        | "quest_shared"
        | "referral_accepted"
        | "signup_confirmed"
        | "quest_reminder"
        | "general"
        | "feedback_request"
        | "quest_submitted"
        | "quest_approved"
        | "quest_changes_requested"
        | "quest_rejected"
        | "creator_invite"
        | "sponsorship_proposal_received"
        | "sponsorship_proposal_accepted"
        | "sponsorship_proposal_declined"
        | "sponsored_quest_approved"
        | "sponsor_quest_completed"
        | "org_quest_announcement"
        | "org_creator_request"
        | "org_creator_message"
        | "org_sponsor_request"
        | "sponsor_org_request"
        | "collaboration_message"
        | "support_ticket_update"
        | "support_ticket_assigned"
        | "admin_direct_message"
      ops_event_type:
        | "signup_created"
        | "signup_status_changed"
        | "signup_xp_awarded"
        | "squad_created"
        | "squad_member_added"
        | "squad_member_removed"
        | "quest_created"
        | "quest_published"
        | "quest_status_changed"
        | "xp_awarded"
        | "achievement_unlocked"
        | "streak_updated"
        | "notification_sent"
        | "notification_failed"
        | "email_sent"
        | "email_failed"
        | "ticket_created"
        | "ticket_resolved"
        | "admin_action"
        | "manual_override"
        | "feature_flag_changed"
        | "shadow_session_started"
        | "shadow_session_ended"
      org_member_role:
        | "member"
        | "admin"
        | "creator"
        | "social_chair"
        | "org_admin"
      org_status: "pending" | "active" | "suspended" | "disabled"
      organization_type:
        | "university"
        | "fraternity"
        | "sorority"
        | "club"
        | "company"
        | "nonprofit"
        | "other"
      overage_policy: "soft_cap_notify" | "hard_cap_block"
      pricing_model: "per_cohort" | "per_seat" | "annual_platform" | "hybrid"
      proof_status: "pending" | "approved" | "flagged" | "resubmit_requested"
      quest_accessibility_level:
        | "unknown"
        | "wheelchair_friendly"
        | "not_wheelchair_friendly"
        | "mixed"
      quest_age_requirement: "all_ages" | "18_plus" | "21_plus"
      quest_alcohol_level: "none" | "optional" | "primary"
      quest_budget_level: "free" | "low" | "medium" | "high" | "mixed"
      quest_completion_rule:
        | "all_members"
        | "majority"
        | "any_member"
        | "per_member"
      quest_event_source: "manual" | "eventbrite"
      quest_event_type:
        | "instance_created"
        | "status_change"
        | "signup"
        | "confirm"
        | "cancel"
        | "squad_assigned"
        | "squad_moved"
        | "whatsapp_joined"
        | "check_in"
        | "proof_submitted"
        | "proof_approved"
        | "proof_flagged"
        | "completion"
        | "xp_awarded"
        | "message_sent"
        | "admin_override"
        | "no_show_marked"
        | "warm_up_started"
        | "prompt_answered"
        | "readiness_confirmed"
        | "squad_ready_for_review"
        | "squad_approved"
        | "squad_force_approved"
      quest_indoor_outdoor: "indoor" | "outdoor" | "mixed"
      quest_intensity_level: "low" | "medium" | "high"
      quest_noise_level: "quiet" | "moderate" | "loud"
      quest_objective_type:
        | "checkin"
        | "photo"
        | "qr"
        | "task"
        | "discussion"
        | "purchase_optional"
        | "travel"
      quest_price_type: "free" | "paid" | "mixed"
      quest_proof_type: "none" | "photo" | "qr" | "geo" | "text_confirmation"
      quest_role_name:
        | "Navigator"
        | "Timekeeper"
        | "Vibe Curator"
        | "Photographer"
        | "Connector"
        | "Wildcard"
      quest_safety_level: "public_only" | "mixed" | "private_ok_with_host"
      quest_social_intensity: "chill" | "moderate" | "high"
      quest_status:
        | "draft"
        | "open"
        | "closed"
        | "completed"
        | "cancelled"
        | "paused"
        | "revoked"
      quest_time_of_day:
        | "morning"
        | "afternoon"
        | "evening"
        | "late_night"
        | "flex"
      quest_visibility: "public" | "org_only" | "invite_only"
      review_status:
        | "draft"
        | "pending_review"
        | "needs_changes"
        | "approved"
        | "rejected"
      signup_status:
        | "pending"
        | "confirmed"
        | "standby"
        | "dropped"
        | "no_show"
        | "completed"
      squad_status: "draft" | "confirmed" | "active" | "completed"
      ticket_status:
        | "open"
        | "investigating"
        | "waiting_response"
        | "resolved"
        | "closed"
      ticket_urgency: "low" | "medium" | "urgent"
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
      account_tier: [
        "city",
        "enterprise",
        "organization",
        "individual_free",
        "individual_premium",
      ],
      admin_message_type: [
        "support",
        "announcement",
        "feedback_request",
        "quest_related",
      ],
      app_role: ["admin", "user", "quest_creator", "sponsor"],
      billing_status: [
        "pilot_active",
        "negotiating",
        "converted",
        "past_due",
        "churned",
      ],
      comms_type: [
        "email_invite",
        "email_confirm",
        "email_reminder",
        "email_followup",
        "email_whatsapp",
      ],
      enterprise_type: ["company", "university", "military", "program"],
      entitlement_scope: ["city_scope", "org_scope", "personal_scope"],
      instance_status: [
        "draft",
        "recruiting",
        "locked",
        "live",
        "completed",
        "cancelled",
        "archived",
        "paused",
      ],
      invite_code_type: [
        "admin",
        "tester",
        "early_access",
        "creator",
        "organization",
        "sponsor",
      ],
      message_sender_role: ["user", "admin", "system"],
      notification_type: [
        "quest_recommendation",
        "quest_shared",
        "referral_accepted",
        "signup_confirmed",
        "quest_reminder",
        "general",
        "feedback_request",
        "quest_submitted",
        "quest_approved",
        "quest_changes_requested",
        "quest_rejected",
        "creator_invite",
        "sponsorship_proposal_received",
        "sponsorship_proposal_accepted",
        "sponsorship_proposal_declined",
        "sponsored_quest_approved",
        "sponsor_quest_completed",
        "org_quest_announcement",
        "org_creator_request",
        "org_creator_message",
        "org_sponsor_request",
        "sponsor_org_request",
        "collaboration_message",
        "support_ticket_update",
        "support_ticket_assigned",
        "admin_direct_message",
      ],
      ops_event_type: [
        "signup_created",
        "signup_status_changed",
        "signup_xp_awarded",
        "squad_created",
        "squad_member_added",
        "squad_member_removed",
        "quest_created",
        "quest_published",
        "quest_status_changed",
        "xp_awarded",
        "achievement_unlocked",
        "streak_updated",
        "notification_sent",
        "notification_failed",
        "email_sent",
        "email_failed",
        "ticket_created",
        "ticket_resolved",
        "admin_action",
        "manual_override",
        "feature_flag_changed",
        "shadow_session_started",
        "shadow_session_ended",
      ],
      org_member_role: [
        "member",
        "admin",
        "creator",
        "social_chair",
        "org_admin",
      ],
      org_status: ["pending", "active", "suspended", "disabled"],
      organization_type: [
        "university",
        "fraternity",
        "sorority",
        "club",
        "company",
        "nonprofit",
        "other",
      ],
      overage_policy: ["soft_cap_notify", "hard_cap_block"],
      pricing_model: ["per_cohort", "per_seat", "annual_platform", "hybrid"],
      proof_status: ["pending", "approved", "flagged", "resubmit_requested"],
      quest_accessibility_level: [
        "unknown",
        "wheelchair_friendly",
        "not_wheelchair_friendly",
        "mixed",
      ],
      quest_age_requirement: ["all_ages", "18_plus", "21_plus"],
      quest_alcohol_level: ["none", "optional", "primary"],
      quest_budget_level: ["free", "low", "medium", "high", "mixed"],
      quest_completion_rule: [
        "all_members",
        "majority",
        "any_member",
        "per_member",
      ],
      quest_event_source: ["manual", "eventbrite"],
      quest_event_type: [
        "instance_created",
        "status_change",
        "signup",
        "confirm",
        "cancel",
        "squad_assigned",
        "squad_moved",
        "whatsapp_joined",
        "check_in",
        "proof_submitted",
        "proof_approved",
        "proof_flagged",
        "completion",
        "xp_awarded",
        "message_sent",
        "admin_override",
        "no_show_marked",
        "warm_up_started",
        "prompt_answered",
        "readiness_confirmed",
        "squad_ready_for_review",
        "squad_approved",
        "squad_force_approved",
      ],
      quest_indoor_outdoor: ["indoor", "outdoor", "mixed"],
      quest_intensity_level: ["low", "medium", "high"],
      quest_noise_level: ["quiet", "moderate", "loud"],
      quest_objective_type: [
        "checkin",
        "photo",
        "qr",
        "task",
        "discussion",
        "purchase_optional",
        "travel",
      ],
      quest_price_type: ["free", "paid", "mixed"],
      quest_proof_type: ["none", "photo", "qr", "geo", "text_confirmation"],
      quest_role_name: [
        "Navigator",
        "Timekeeper",
        "Vibe Curator",
        "Photographer",
        "Connector",
        "Wildcard",
      ],
      quest_safety_level: ["public_only", "mixed", "private_ok_with_host"],
      quest_social_intensity: ["chill", "moderate", "high"],
      quest_status: [
        "draft",
        "open",
        "closed",
        "completed",
        "cancelled",
        "paused",
        "revoked",
      ],
      quest_time_of_day: [
        "morning",
        "afternoon",
        "evening",
        "late_night",
        "flex",
      ],
      quest_visibility: ["public", "org_only", "invite_only"],
      review_status: [
        "draft",
        "pending_review",
        "needs_changes",
        "approved",
        "rejected",
      ],
      signup_status: [
        "pending",
        "confirmed",
        "standby",
        "dropped",
        "no_show",
        "completed",
      ],
      squad_status: ["draft", "confirmed", "active", "completed"],
      ticket_status: [
        "open",
        "investigating",
        "waiting_response",
        "resolved",
        "closed",
      ],
      ticket_urgency: ["low", "medium", "urgent"],
    },
  },
} as const
