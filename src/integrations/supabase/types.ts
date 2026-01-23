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
        ]
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
      organizations: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          school_affiliation: string | null
          seeking: string[] | null
          slug: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          school_affiliation?: string | null
          seeking?: string[] | null
          slug: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          school_affiliation?: string | null
          seeking?: string[] | null
          slug?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
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
      profile_organizations: {
        Row: {
          joined_at: string
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["org_member_role"]
        }
        Insert: {
          joined_at?: string
          org_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Update: {
          joined_at?: string
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
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          consent_given_at?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          city?: string | null
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
          admin_notes: string | null
          base_xp: number | null
          briefing_html: string | null
          capacity_total: number | null
          cost_description: string | null
          created_at: string
          creator_id: string | null
          creator_name: string | null
          creator_social_url: string | null
          creator_type: string | null
          end_datetime: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_sponsored: boolean | null
          meeting_address: string | null
          meeting_location_name: string | null
          min_level: number | null
          min_tree_xp: number | null
          objectives: string | null
          org_id: string | null
          progression_tree: string | null
          published_at: string | null
          required_achievement_id: string | null
          review_status: Database["public"]["Enums"]["review_status"] | null
          revision_count: number | null
          rewards: string | null
          short_description: string | null
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
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["quest_visibility"]
          whatsapp_invite_link: string | null
        }
        Insert: {
          admin_notes?: string | null
          base_xp?: number | null
          briefing_html?: string | null
          capacity_total?: number | null
          cost_description?: string | null
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          end_datetime?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          min_level?: number | null
          min_tree_xp?: number | null
          objectives?: string | null
          org_id?: string | null
          progression_tree?: string | null
          published_at?: string | null
          required_achievement_id?: string | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          revision_count?: number | null
          rewards?: string | null
          short_description?: string | null
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
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
          whatsapp_invite_link?: string | null
        }
        Update: {
          admin_notes?: string | null
          base_xp?: number | null
          briefing_html?: string | null
          capacity_total?: number | null
          cost_description?: string | null
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          creator_social_url?: string | null
          creator_type?: string | null
          end_datetime?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          meeting_address?: string | null
          meeting_location_name?: string | null
          min_level?: number | null
          min_tree_xp?: number | null
          objectives?: string | null
          org_id?: string | null
          progression_tree?: string | null
          published_at?: string | null
          required_achievement_id?: string | null
          review_status?: Database["public"]["Enums"]["review_status"] | null
          revision_count?: number | null
          rewards?: string | null
          short_description?: string | null
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
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
          whatsapp_invite_link?: string | null
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
      check_and_unlock_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          xp_reward: number
        }[]
      }
      check_streak_bonus: {
        Args: { p_user_id: string }
        Returns: {
          bonus_xp: number
          current_count: number
          streak_name: string
        }[]
      }
      get_user_level: {
        Args: { p_user_id: string }
        Returns: {
          current_xp: number
          level: number
          name: string
          next_level_xp: number
        }[]
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
      record_referral_signup: {
        Args: { p_referral_code: string; p_user_id: string }
        Returns: undefined
      }
      track_referral_click: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      update_user_streaks: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "quest_creator" | "sponsor"
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
      org_member_role: "member" | "admin" | "creator"
      organization_type:
        | "university"
        | "fraternity"
        | "sorority"
        | "club"
        | "company"
        | "nonprofit"
        | "other"
      quest_status: "draft" | "open" | "closed" | "completed" | "cancelled"
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
      app_role: ["admin", "user", "quest_creator", "sponsor"],
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
      ],
      org_member_role: ["member", "admin", "creator"],
      organization_type: [
        "university",
        "fraternity",
        "sorority",
        "club",
        "company",
        "nonprofit",
        "other",
      ],
      quest_status: ["draft", "open", "closed", "completed", "cancelled"],
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
    },
  },
} as const
