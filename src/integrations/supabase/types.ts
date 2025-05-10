export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointment_assistant_settings: {
        Row: {
          id: number
          services_list: string | null
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          services_list?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          services_list?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          calendar_event_id: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          end_time: string
          id: string
          payment_status: string | null
          salon_id: string
          service_id: string | null
          start_time: string
          status: string
          stylist_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          end_time: string
          id?: string
          payment_status?: string | null
          salon_id: string
          service_id?: string | null
          start_time: string
          status?: string
          stylist_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          end_time?: string
          id?: string
          payment_status?: string | null
          salon_id?: string
          service_id?: string | null
          start_time?: string
          status?: string
          stylist_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          stylist_id: string
          token_expiry: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          stylist_id: string
          token_expiry: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          stylist_id?: string
          token_expiry?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: true
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_entries: {
        Row: {
          client_name: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          service_name: string | null
          start_time: string
          status: string
          stylist_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          service_name?: string | null
          start_time: string
          status?: string
          stylist_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          service_name?: string | null
          start_time?: string
          status?: string
          stylist_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_entries_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          price_override: number | null
          professional_id: string
          service_id: string
        }
        Insert: {
          price_override?: number | null
          professional_id: string
          service_id: string
        }
        Update: {
          price_override?: number | null
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          availability: Json | null
          bio: string | null
          cal_com_personal_link: string | null
          cal_com_user_id: number | null
          created_at: string | null
          id: string
          name: string
          profile_picture_url: string | null
          salon_id: string | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          cal_com_personal_link?: string | null
          cal_com_user_id?: number | null
          created_at?: string | null
          id?: string
          name: string
          profile_picture_url?: string | null
          salon_id?: string | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          cal_com_personal_link?: string | null
          cal_com_user_id?: number | null
          created_at?: string | null
          id?: string
          name?: string
          profile_picture_url?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      salons: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string
          price: number
          salon_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          name: string
          price: number
          salon_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          bio: string | null
          color: string | null
          created_at: string
          email: string | null
          expertise: string[] | null
          id: string
          name: string
          phone: string | null
          profile_image_url: string | null
          salon_id: string
        }
        Insert: {
          bio?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[] | null
          id?: string
          name: string
          phone?: string | null
          profile_image_url?: string | null
          salon_id: string
        }
        Update: {
          bio?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[] | null
          id?: string
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylists_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          salon_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          salon_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          salon_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          client_whatsapp_number: string
          conversation_data: Json | null
          created_at: string | null
          id: string
          last_message_timestamp: string | null
          salon_id: string | null
          state: string
        }
        Insert: {
          client_whatsapp_number: string
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          last_message_timestamp?: string | null
          salon_id?: string | null
          state?: string
        }
        Update: {
          client_whatsapp_number?: string
          conversation_data?: Json | null
          created_at?: string | null
          id?: string
          last_message_timestamp?: string | null
          salon_id?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          client_phone: string
          created_at: string
          direction: string
          id: string
          message: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_phone: string
          created_at?: string
          direction: string
          id?: string
          message: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_phone?: string
          created_at?: string
          direction?: string
          id?: string
          message?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          id: number
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          booking_duration: number | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_day_off: boolean
          start_time: string
          stylist_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_duration?: number | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_day_off?: boolean
          start_time: string
          stylist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_duration?: number | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_day_off?: boolean
          start_time?: string
          stylist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
