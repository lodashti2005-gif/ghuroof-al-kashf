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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      case_purchases: {
        Row: {
          amount: number | null
          amount_kwd: number | null
          case_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          provider: string | null
          provider_invoice_id: string | null
          provider_ref: string | null
          purchased_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          amount_kwd?: number | null
          case_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          provider?: string | null
          provider_invoice_id?: string | null
          provider_ref?: string | null
          purchased_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          amount_kwd?: number | null
          case_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          provider?: string | null
          provider_invoice_id?: string | null
          provider_ref?: string | null
          purchased_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_purchases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          code: string
          created_at: string
          difficulty: string
          id: string
          is_free: boolean
          max_players: number
          min_players: number
          play_minutes: number
          price_kwd: number | null
          sort_order: number
          status: string
          teaser: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          difficulty?: string
          id: string
          is_free?: boolean
          max_players?: number
          min_players?: number
          play_minutes?: number
          price_kwd?: number | null
          sort_order?: number
          status?: string
          teaser: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_free?: boolean
          max_players?: number
          min_players?: number
          play_minutes?: number
          price_kwd?: number | null
          sort_order?: number
          status?: string
          teaser?: string
          title?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied: boolean
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied?: boolean
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied?: boolean
          subject?: string
        }
        Relationships: []
      }
      paddle_webhook_events: {
        Row: {
          amount: number | null
          case_id: string | null
          created_at: string
          currency: string | null
          detail: string | null
          event_id: string | null
          event_type: string
          id: string
          outcome: string
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          case_id?: string | null
          created_at?: string
          currency?: string | null
          detail?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          outcome: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          case_id?: string | null
          created_at?: string
          currency?: string | null
          detail?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          outcome?: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          id: string
          is_host: boolean
          joined_at: string
          name: string
          player_id: string
          room_code: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          joined_at?: string
          name: string
          player_id: string
          room_code: string
        }
        Update: {
          id?: string
          is_host?: boolean
          joined_at?: string
          name?: string
          player_id?: string
          room_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_code_fkey"
            columns: ["room_code"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["code"]
          },
        ]
      }
      room_votes: {
        Row: {
          created_at: string
          id: string
          player_id: string
          room_code: string
          suspect_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          room_code: string
          suspect_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          room_code?: string
          suspect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_votes_room_code_fkey"
            columns: ["room_code"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["code"]
          },
        ]
      }
      rooms: {
        Row: {
          case_id: string
          code: string
          created_at: string
          host_player_id: string
          owner_user_id: string | null
          phase: string
          state: Json
          updated_at: string
        }
        Insert: {
          case_id: string
          code: string
          created_at?: string
          host_player_id: string
          owner_user_id?: string | null
          phase?: string
          state?: Json
          updated_at?: string
        }
        Update: {
          case_id?: string
          code?: string
          created_at?: string
          host_player_id?: string
          owner_user_id?: string | null
          phase?: string
          state?: Json
          updated_at?: string
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
      has_case_entitlement: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      room_cast_vote: {
        Args: { _code: string; _player_id: string; _suspect_id: string }
        Returns: boolean
      }
      room_create: {
        Args: {
          _case_id: string
          _code: string
          _host_name: string
          _host_player_id: string
          _state: Json
        }
        Returns: string
      }
      room_is_member: {
        Args: { _code: string; _player_id: string }
        Returns: boolean
      }
      room_join: {
        Args: { _code: string; _name: string; _player_id: string }
        Returns: string
      }
      room_leave: {
        Args: { _code: string; _player_id: string }
        Returns: undefined
      }
      room_reset_votes: {
        Args: { _code: string; _player_id: string }
        Returns: boolean
      }
      room_set_state: {
        Args: {
          _code: string
          _expected_updated_at: string
          _phase: string
          _player_id: string
          _state: Json
        }
        Returns: string
      }
      room_snapshot: {
        Args: { _code: string; _player_id: string }
        Returns: Json
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
