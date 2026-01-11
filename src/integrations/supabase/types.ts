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
      abuse_events: {
        Row: {
          created_at: string
          details: Json | null
          device_id: string | null
          event_type: string
          hourly_count: number | null
          id: string
          ip_address: string | null
          notified: boolean | null
          threshold: number | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          device_id?: string | null
          event_type: string
          hourly_count?: number | null
          id?: string
          ip_address?: string | null
          notified?: boolean | null
          threshold?: number | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          device_id?: string | null
          event_type?: string
          hourly_count?: number | null
          id?: string
          ip_address?: string | null
          notified?: boolean | null
          threshold?: number | null
        }
        Relationships: []
      }
      free_forecasts: {
        Row: {
          animal_sign: string | null
          best_direction: string | null
          birth_date: string
          birth_place: string
          birth_stone: string | null
          birth_symbol: string | null
          birth_time: string
          birth_time_utc: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          deity: string | null
          device_id: string | null
          forecast_text: string
          ganam: string | null
          guest_token: string | null
          id: string
          latitude: number | null
          longitude: number | null
          lucky_color: string | null
          moon_sign: string | null
          moon_sign_id: number | null
          moon_sign_lord: string | null
          nadi: string | null
          nakshatra: string | null
          nakshatra_gender: string | null
          nakshatra_id: number | null
          nakshatra_lord: string | null
          nakshatra_pada: number | null
          pivotal_theme: string | null
          sun_sign: string | null
          sun_sign_id: number | null
          sun_sign_lord: string | null
          syllables: string | null
          zodiac_sign: string | null
        }
        Insert: {
          animal_sign?: string | null
          best_direction?: string | null
          birth_date: string
          birth_place: string
          birth_stone?: string | null
          birth_symbol?: string | null
          birth_time: string
          birth_time_utc?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          deity?: string | null
          device_id?: string | null
          forecast_text: string
          ganam?: string | null
          guest_token?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lucky_color?: string | null
          moon_sign?: string | null
          moon_sign_id?: number | null
          moon_sign_lord?: string | null
          nadi?: string | null
          nakshatra?: string | null
          nakshatra_gender?: string | null
          nakshatra_id?: number | null
          nakshatra_lord?: string | null
          nakshatra_pada?: number | null
          pivotal_theme?: string | null
          sun_sign?: string | null
          sun_sign_id?: number | null
          sun_sign_lord?: string | null
          syllables?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          animal_sign?: string | null
          best_direction?: string | null
          birth_date?: string
          birth_place?: string
          birth_stone?: string | null
          birth_symbol?: string | null
          birth_time?: string
          birth_time_utc?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          deity?: string | null
          device_id?: string | null
          forecast_text?: string
          ganam?: string | null
          guest_token?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lucky_color?: string | null
          moon_sign?: string | null
          moon_sign_id?: number | null
          moon_sign_lord?: string | null
          nadi?: string | null
          nakshatra?: string | null
          nakshatra_gender?: string | null
          nakshatra_id?: number | null
          nakshatra_lord?: string | null
          nakshatra_pada?: number | null
          pivotal_theme?: string | null
          sun_sign?: string | null
          sun_sign_id?: number | null
          sun_sign_lord?: string | null
          syllables?: string | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      nakshatra_pressure_lookup: {
        Row: {
          intensity_reason: string
          moral_cost_limit: string
          nakshatra: string
          strain_accumulation: string
        }
        Insert: {
          intensity_reason: string
          moral_cost_limit: string
          nakshatra: string
          strain_accumulation: string
        }
        Update: {
          intensity_reason?: string
          moral_cost_limit?: string
          nakshatra?: string
          strain_accumulation?: string
        }
        Relationships: []
      }
      paid_forecasts: {
        Row: {
          amount_paid: number | null
          animal_sign: string | null
          best_direction: string | null
          birth_date: string
          birth_place: string
          birth_stone: string | null
          birth_symbol: string | null
          birth_time: string
          birth_time_utc: string | null
          completion_tokens: number | null
          created_at: string | null
          customer_email: string
          customer_name: string | null
          deity: string | null
          device_id: string | null
          free_forecast: string
          ganam: string | null
          generation_error: string | null
          generation_status: string | null
          guest_token: string | null
          id: string
          lucky_color: string | null
          model_used: string | null
          moon_sign_lord: string | null
          nadi: string | null
          nakshatra_gender: string | null
          nakshatra_lord: string | null
          prompt_tokens: number | null
          retry_count: number | null
          shareable_link: string | null
          strategic_forecast: Json
          stripe_session_id: string
          sun_sign_lord: string | null
          syllables: string | null
          total_tokens: number | null
          user_id: string | null
          zodiac_sign: string | null
        }
        Insert: {
          amount_paid?: number | null
          animal_sign?: string | null
          best_direction?: string | null
          birth_date: string
          birth_place: string
          birth_stone?: string | null
          birth_symbol?: string | null
          birth_time: string
          birth_time_utc?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          deity?: string | null
          device_id?: string | null
          free_forecast: string
          ganam?: string | null
          generation_error?: string | null
          generation_status?: string | null
          guest_token?: string | null
          id?: string
          lucky_color?: string | null
          model_used?: string | null
          moon_sign_lord?: string | null
          nadi?: string | null
          nakshatra_gender?: string | null
          nakshatra_lord?: string | null
          prompt_tokens?: number | null
          retry_count?: number | null
          shareable_link?: string | null
          strategic_forecast: Json
          stripe_session_id: string
          sun_sign_lord?: string | null
          syllables?: string | null
          total_tokens?: number | null
          user_id?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          amount_paid?: number | null
          animal_sign?: string | null
          best_direction?: string | null
          birth_date?: string
          birth_place?: string
          birth_stone?: string | null
          birth_symbol?: string | null
          birth_time?: string
          birth_time_utc?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          deity?: string | null
          device_id?: string | null
          free_forecast?: string
          ganam?: string | null
          generation_error?: string | null
          generation_status?: string | null
          guest_token?: string | null
          id?: string
          lucky_color?: string | null
          model_used?: string | null
          moon_sign_lord?: string | null
          nadi?: string | null
          nakshatra_gender?: string | null
          nakshatra_lord?: string | null
          prompt_tokens?: number | null
          retry_count?: number | null
          shareable_link?: string | null
          strategic_forecast?: Json
          stripe_session_id?: string
          sun_sign_lord?: string | null
          syllables?: string | null
          total_tokens?: number | null
          user_id?: string | null
          zodiac_sign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paid_forecasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      theme_cache: {
        Row: {
          birth_datetime_utc: string
          created_at: string
          id: string
          pivotal_theme: string
          target_year: string
        }
        Insert: {
          birth_datetime_utc: string
          created_at?: string
          id?: string
          pivotal_theme: string
          target_year: string
        }
        Update: {
          birth_datetime_utc?: string
          created_at?: string
          id?: string
          pivotal_theme?: string
          target_year?: string
        }
        Relationships: []
      }
      zodiac_signs: {
        Row: {
          end_day: number
          end_month: number
          id: number
          name: string
          start_day: number
          start_month: number
        }
        Insert: {
          end_day: number
          end_month: number
          id?: number
          name: string
          start_day: number
          start_month: number
        }
        Update: {
          end_day?: number
          end_month?: number
          id?: number
          name?: string
          start_day?: number
          start_month?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
