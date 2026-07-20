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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          bucket: string
          count: number
          reset_at: string
        }
        Insert: {
          bucket: string
          count?: number
          reset_at: string
        }
        Update: {
          bucket?: string
          count?: number
          reset_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          chatbot_id: string | null
          created_at: string
          id: string
          page_url: string | null
          updated_at: string
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string
          id?: string
          page_url?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string
          id?: string
          page_url?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "client_chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_leads: {
        Row: {
          budget: string | null
          chatbot_id: string | null
          conversation_id: string | null
          created_at: string
          email: string | null
          follow_up_note: string | null
          id: string
          last_contacted_at: string | null
          message: string | null
          name: string | null
          phone: string | null
          status: string
        }
        Insert: {
          budget?: string | null
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_note?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          budget?: string | null
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_note?: string | null
          id?: string
          last_contacted_at?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_leads_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "client_chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_settings: {
        Row: {
          brand_color: string
          business_knowledge: string
          created_at: string
          enabled: boolean
          greeting: string
          id: string
          model: string
          singleton: boolean
          suggested_prompts: Json
          system_prompt: string
          updated_at: string
        }
        Insert: {
          brand_color?: string
          business_knowledge?: string
          created_at?: string
          enabled?: boolean
          greeting?: string
          id?: string
          model?: string
          singleton?: boolean
          suggested_prompts?: Json
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          brand_color?: string
          business_knowledge?: string
          created_at?: string
          enabled?: boolean
          greeting?: string
          id?: string
          model?: string
          singleton?: boolean
          suggested_prompts?: Json
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_chatbots: {
        Row: {
          allowed_domains: string[]
          boundaries: string
          brand_color: string
          business_description: string
          business_name: string
          created_at: string
          faq_and_policies: string
          greeting: string
          handoff_message: string
          hours_and_contact: string
          id: string
          is_live: boolean
          lead_questions: string
          organization_id: string | null
          owner_user_id: string
          services: string
          tone: string
          updated_at: string
          website_url: string
        }
        Insert: {
          allowed_domains?: string[]
          boundaries?: string
          brand_color?: string
          business_description?: string
          business_name?: string
          created_at?: string
          faq_and_policies?: string
          greeting?: string
          handoff_message?: string
          hours_and_contact?: string
          id?: string
          is_live?: boolean
          lead_questions?: string
          organization_id?: string | null
          owner_user_id: string
          services?: string
          tone?: string
          updated_at?: string
          website_url?: string
        }
        Update: {
          allowed_domains?: string[]
          boundaries?: string
          brand_color?: string
          business_description?: string
          business_name?: string
          created_at?: string
          faq_and_policies?: string
          greeting?: string
          handoff_message?: string
          hours_and_contact?: string
          id?: string
          is_live?: boolean
          lead_questions?: string
          organization_id?: string | null
          owner_user_id?: string
          services?: string
          tone?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          source: string
          status: string
          website_url: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          source?: string
          status?: string
          website_url?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          source?: string
          status?: string
          website_url?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          email: string | null
          environment: string
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          email?: string | null
          environment?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          email?: string | null
          environment?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          industry: string
          name: string
          owner_user_id: string
          service_area: string
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string
          name?: string
          owner_user_id: string
          service_area?: string
          updated_at?: string
          website_url?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          name?: string
          owner_user_id?: string
          service_area?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      perf_metrics: {
        Row: {
          created_at: string
          id: string
          metric: string
          navigation_type: string | null
          rating: string | null
          route: string
          user_agent: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          navigation_type?: string | null
          rating?: string | null
          route: string
          user_agent?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          navigation_type?: string | null
          rating?: string | null
          route?: string
          user_agent?: string | null
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospect_email_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          prospect_id: string
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          prospect_id: string
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          prospect_id?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_email_drafts_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "signal_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_signals: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: string
          label: string
          prospect_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          label: string
          prospect_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          label?: string
          prospect_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "prospect_signals_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "signal_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_campaigns: {
        Row: {
          created_at: string
          id: string
          ideal_customer: string
          intent_phrases: string[]
          is_active: boolean
          match_keywords: string[]
          name: string
          offer: string
          opt_out_email: string | null
          organization_id: string
          postal_address: string | null
          sender_email: string | null
          sender_name: string | null
          service_area: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideal_customer: string
          intent_phrases?: string[]
          is_active?: boolean
          match_keywords?: string[]
          name: string
          offer: string
          opt_out_email?: string | null
          organization_id: string
          postal_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          service_area?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ideal_customer?: string
          intent_phrases?: string[]
          is_active?: boolean
          match_keywords?: string[]
          name?: string
          offer?: string
          opt_out_email?: string | null
          organization_id?: string
          postal_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          service_area?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_opportunities: {
        Row: {
          author_name: string | null
          campaign_id: string
          company_name: string | null
          company_website_url: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          excerpt: string | null
          id: string
          matched_terms: string[]
          posted_at: string | null
          score: number
          source_id: string | null
          source_url: string
          status: string
          title: string
        }
        Insert: {
          author_name?: string | null
          campaign_id: string
          company_name?: string | null
          company_website_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          matched_terms?: string[]
          posted_at?: string | null
          score?: number
          source_id?: string | null
          source_url: string
          status?: string
          title: string
        }
        Update: {
          author_name?: string | null
          campaign_id?: string
          company_name?: string | null
          company_website_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          matched_terms?: string[]
          posted_at?: string | null
          score?: number
          source_id?: string | null
          source_url?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_opportunities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "signal_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_opportunities_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "signal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_opportunity_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          opportunity_id: string
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          opportunity_id: string
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          opportunity_id?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_opportunity_drafts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "signal_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_prospects: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          organization_id: string
          page_description: string | null
          page_title: string | null
          scanned_at: string | null
          score: number
          status: string
          website_url: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          organization_id: string
          page_description?: string | null
          page_title?: string | null
          scanned_at?: string | null
          score?: number
          status?: string
          website_url: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          page_description?: string | null
          page_title?: string | null
          scanned_at?: string | null
          score?: number
          status?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_source_runs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          items_found: number | null
          opportunities_added: number | null
          source_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          items_found?: number | null
          opportunities_added?: number | null
          source_id: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          items_found?: number | null
          opportunities_added?: number | null
          source_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_source_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "signal_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_sources: {
        Row: {
          campaign_id: string
          created_at: string
          feed_url: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          source_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          feed_url: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          source_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          feed_url?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_sources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "signal_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      get_public_chatbot_settings: {
        Args: never
        Returns: {
          brand_color: string
          enabled: boolean
          greeting: string
          suggested_prompts: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type: string
          _organization_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
