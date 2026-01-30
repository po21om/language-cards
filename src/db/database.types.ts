export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generation_logs: {
        Row: {
          cards_accepted: number
          cards_generated: number
          cards_refined: number
          cards_rejected: number
          id: string
          input_length: number
          timestamp: string
          user_id: string
        }
        Insert: {
          cards_accepted?: number
          cards_generated: number
          cards_refined?: number
          cards_rejected?: number
          id?: string
          input_length: number
          timestamp?: string
          user_id: string
        }
        Update: {
          cards_accepted?: number
          cards_generated?: number
          cards_refined?: number
          cards_rejected?: number
          id?: string
          input_length?: number
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deleted_at: string | null
          front: string
          generation_id: string | null
          id: string
          source: string
          status: string
          study_weight: number
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deleted_at?: string | null
          front: string
          generation_id?: string | null
          id?: string
          source: string
          status?: string
          study_weight?: number
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deleted_at?: string | null
          front?: string
          generation_id?: string | null
          id?: string
          source?: string
          status?: string
          study_weight?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_demo_deck_loaded: boolean
          language_preference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_demo_deck_loaded?: boolean
          language_preference?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo_deck_loaded?: boolean
          language_preference?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_reviews: {
        Row: {
          card_id: string
          id: string
          new_weight: number
          outcome: string
          previous_weight: number
          reviewed_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          id?: string
          new_weight: number
          outcome: string
          previous_weight: number
          reviewed_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          id?: string
          new_weight?: number
          outcome?: string
          previous_weight?: number
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "view_flashcards_export"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_flashcards_export: {
        Row: {
          back: string | null
          created_at: string | null
          front: string | null
          id: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          back?: string | null
          created_at?: string | null
          front?: string | null
          id?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          back?: string | null
          created_at?: string | null
          front?: string | null
          id?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_user: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      purge_old_deleted_flashcards: { Args: never; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

