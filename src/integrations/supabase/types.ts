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
      assignment_submissions: {
        Row: {
          assignment_id: string
          file_url: string | null
          id: string
          notes: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          file_url?: string | null
          id?: string
          notes?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          halaqa_id: string | null
          id: string
          student_id: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          halaqa_id?: string | null
          id?: string
          student_id?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          halaqa_id?: string | null
          id?: string
          student_id?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          halaqa_id: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          halaqa_id: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          halaqa_id?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          fluency_score: number | null
          halaqa_id: string | null
          id: string
          memorization_score: number | null
          notes: string | null
          participation_score: number | null
          student_id: string
          tajweed_score: number | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          fluency_score?: number | null
          halaqa_id?: string | null
          id?: string
          memorization_score?: number | null
          notes?: string | null
          participation_score?: number | null
          student_id: string
          tajweed_score?: number | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          fluency_score?: number | null
          halaqa_id?: string | null
          id?: string
          memorization_score?: number | null
          notes?: string | null
          participation_score?: number | null
          student_id?: string
          tajweed_score?: number | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string
          max_participants: number | null
          meeting_link: string | null
          meeting_provider: string | null
          registration_required: boolean
          speaker: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          max_participants?: number | null
          meeting_link?: string | null
          meeting_provider?: string | null
          registration_required?: boolean
          speaker?: string | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          max_participants?: number | null
          meeting_link?: string | null
          meeting_provider?: string | null
          registration_required?: boolean
          speaker?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      halaqas: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          level: Database["public"]["Enums"]["quran_level"]
          max_students: number | null
          meeting_link: string | null
          meeting_provider: string | null
          name: string
          schedule: string | null
          schedule_days: string[] | null
          start_time: string | null
          status: Database["public"]["Enums"]["halaqa_status"]
          supervisor_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          level: Database["public"]["Enums"]["quran_level"]
          max_students?: number | null
          meeting_link?: string | null
          meeting_provider?: string | null
          name: string
          schedule?: string | null
          schedule_days?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["halaqa_status"]
          supervisor_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          level?: Database["public"]["Enums"]["quran_level"]
          max_students?: number | null
          meeting_link?: string | null
          meeting_provider?: string | null
          name?: string
          schedule?: string | null
          schedule_days?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["halaqa_status"]
          supervisor_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaqas_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "halaqas_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          student_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          student_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_links_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_links_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          language: Database["public"]["Enums"]["app_language"]
          parent_name: string | null
          phone: string | null
          preferred_schedule: string | null
          quran_level: Database["public"]["Enums"]["quran_level"] | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          language?: Database["public"]["Enums"]["app_language"]
          parent_name?: string | null
          phone?: string | null
          preferred_schedule?: string | null
          quran_level?: Database["public"]["Enums"]["quran_level"] | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          parent_name?: string | null
          phone?: string | null
          preferred_schedule?: string | null
          quran_level?: Database["public"]["Enums"]["quran_level"] | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: []
      }
      student_halaqas: {
        Row: {
          halaqa_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          halaqa_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          halaqa_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_halaqas_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_halaqas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          emergency_contact: string | null
          enrollment_date: string
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          notes: string | null
          profile_id: string
          student_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_contact?: string | null
          enrollment_date?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_contact?: string | null
          enrollment_date?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          student_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_notes: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["supervisor_note_category"]
          created_at: string
          halaqa_id: string
          id: string
          note: string
          student_id: string
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["supervisor_note_category"]
          created_at?: string
          halaqa_id: string
          id?: string
          note: string
          student_id: string
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["supervisor_note_category"]
          created_at?: string
          halaqa_id?: string
          id?: string
          note?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_notes_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_halaqa: {
        Args: { _halaqa_id: string; _user_id: string }
        Returns: boolean
      }
      primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_language: "ar" | "fr" | "en"
      app_role:
        | "student"
        | "teacher"
        | "halaqa_supervisor"
        | "general_supervisor"
        | "director"
      attendance_status: "present" | "absent" | "late"
      gender_type: "male" | "female"
      halaqa_status: "active" | "archived" | "inactive"
      quran_level: "beginner" | "intermediate" | "advanced"
      student_status: "pending_review" | "approved" | "rejected" | "suspended"
      supervisor_note_category:
        | "behavior"
        | "attendance"
        | "technical"
        | "follow_up"
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
      app_language: ["ar", "fr", "en"],
      app_role: [
        "student",
        "teacher",
        "halaqa_supervisor",
        "general_supervisor",
        "director",
      ],
      attendance_status: ["present", "absent", "late"],
      gender_type: ["male", "female"],
      halaqa_status: ["active", "archived", "inactive"],
      quran_level: ["beginner", "intermediate", "advanced"],
      student_status: ["pending_review", "approved", "rejected", "suspended"],
      supervisor_note_category: [
        "behavior",
        "attendance",
        "technical",
        "follow_up",
      ],
    },
  },
} as const
