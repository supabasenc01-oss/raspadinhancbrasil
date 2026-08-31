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
      admin_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          external_id: string | null
          id: string
          payment_provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_id?: string | null
          id?: string
          payment_provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string | null
          id?: string
          payment_provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          deposit_id: string | null
          external_id: string | null
          external_reference: string | null
          id: string
          payment_method: string | null
          provider: string
          raw_response: Json | null
          status: string
          status_detail: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deposit_id?: string | null
          external_id?: string | null
          external_reference?: string | null
          id?: string
          payment_method?: string | null
          provider?: string
          raw_response?: Json | null
          status: string
          status_detail?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposit_id?: string | null
          external_id?: string | null
          external_reference?: string | null
          id?: string
          payment_method?: string | null
          provider?: string
          raw_response?: Json | null
          status?: string
          status_detail?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          credits_granted: number
          id: string
          image_url: string
          purchase_date: string | null
          purchase_value: number
          receipt_number: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_id: string | null
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_granted?: number
          id?: string
          image_url: string
          purchase_date?: string | null
          purchase_value?: number
          receipt_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_granted?: number
          id?: string
          image_url?: string
          purchase_date?: string | null
          purchase_value?: number
          receipt_number?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_staff: boolean
          key: Database["public"]["Enums"]["app_role"]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_staff?: boolean
          key: Database["public"]["Enums"]["app_role"]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_staff?: boolean
          key?: Database["public"]["Enums"]["app_role"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scratch_card_prizes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          probability: number
          quantity_remaining: number
          quantity_total: number
          scratch_card_id: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          probability?: number
          quantity_remaining?: number
          quantity_total?: number
          scratch_card_id: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          probability?: number
          quantity_remaining?: number
          quantity_total?: number
          scratch_card_id?: string
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "scratch_card_prizes_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_cards: {
        Row: {
          background_url: string | null
          badge: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_free: boolean
          name: string
          price: number
          scratch_image_url: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["scratch_card_status"]
          store_id: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          badge?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_free?: boolean
          name: string
          price?: number
          scratch_image_url?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["scratch_card_status"]
          store_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          badge?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_free?: boolean
          name?: string
          price?: number
          scratch_image_url?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["scratch_card_status"]
          store_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_cards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_credits: {
        Row: {
          balance: number
          created_at: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_credits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_plays: {
        Row: {
          created_at: string
          id: string
          prize_id: string | null
          prize_title: string | null
          prize_value: number
          result_type: string
          scratch_card_id: string
          used_credit: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_id?: string | null
          prize_title?: string | null
          prize_value?: number
          result_type: string
          scratch_card_id: string
          used_credit?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_id?: string | null
          prize_title?: string | null
          prize_value?: number
          result_type?: string
          scratch_card_id?: string
          used_credit?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_plays_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          thumbnail_url: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          thumbnail_url?: string | null
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          thumbnail_url?: string | null
          updated_at?: string
          value?: Json
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          created_at: string
          id: string
          prize_title: string
          prize_value: number
          scratch_card_id: string
          user_id: string
          winner_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_title: string
          prize_value: number
          scratch_card_id: string
          user_id: string
          winner_name: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_title?: string
          prize_value?: number
          scratch_card_id?: string
          user_id?: string
          winner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_info: Json | null
          created_at: string | null
          id: string
          method: string
          pix_key: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_info?: Json | null
          created_at?: string | null
          id?: string
          method: string
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_info?: Json | null
          created_at?: string | null
          id?: string
          method?: string
          pix_key?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_receipt: {
        Args: {
          _credits?: number
          _notes?: string
          _purchase_value?: number
          _receipt_id: string
          _status: string
          _store_id?: string
        }
        Returns: Json
      }
      draw_scratch_card: {
        Args: { _card_id: string; _user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      mask_name: { Args: { name: string }; Returns: string }
      process_wallet_transaction: {
        Args: {
          _amount: number
          _description: string
          _reference_id: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      review_receipt: {
        Args: {
          _approve: boolean
          _credits?: number
          _notes?: string
          _receipt_id: string
        }
        Returns: Json
      }
      scratch_card_stats: {
        Args: never
        Returns: {
          card_name: string
          last_play_at: string
          prizes_remaining: number
          prizes_total: number
          scratch_card_id: string
          total_plays: number
          total_prize_value: number
          total_wins: number
        }[]
      }
      scratch_user_stats: {
        Args: never
        Returns: {
          email: string
          full_name: string
          last_play_at: string
          total_plays: number
          total_prize_value: number
          total_wins: number
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "OPERADOR"
        | "FINANCEIRO"
        | "SUPORTE"
        | "USER"
      profile_status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING"
      scratch_card_status:
        | "DRAFT"
        | "ACTIVE"
        | "PAUSED"
        | "FINISHED"
        | "ARCHIVED"
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
      app_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "OPERADOR",
        "FINANCEIRO",
        "SUPORTE",
        "USER",
      ],
      profile_status: ["ACTIVE", "INACTIVE", "BLOCKED", "PENDING"],
      scratch_card_status: [
        "DRAFT",
        "ACTIVE",
        "PAUSED",
        "FINISHED",
        "ARCHIVED",
      ],
    },
  },
} as const
