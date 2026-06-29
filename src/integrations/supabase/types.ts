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
          session_id: string | null
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
          session_id?: string | null
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
          session_id?: string | null
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
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "halaqa_sessions"
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          halaqa_id: string | null
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_message_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          halaqa_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          halaqa_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          behavior_score: number | null
          created_at: string
          fluency_score: number | null
          halaqa_id: string | null
          id: string
          memorization_score: number | null
          notes: string | null
          participation_score: number | null
          session_id: string | null
          student_id: string
          tajweed_score: number | null
          teacher_id: string
        }
        Insert: {
          behavior_score?: number | null
          created_at?: string
          fluency_score?: number | null
          halaqa_id?: string | null
          id?: string
          memorization_score?: number | null
          notes?: string | null
          participation_score?: number | null
          session_id?: string | null
          student_id: string
          tajweed_score?: number | null
          teacher_id: string
        }
        Update: {
          behavior_score?: number | null
          created_at?: string
          fluency_score?: number | null
          halaqa_id?: string | null
          id?: string
          memorization_score?: number | null
          notes?: string | null
          participation_score?: number | null
          session_id?: string | null
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
            foreignKeyName: "evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "halaqa_sessions"
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
      halaqa_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          halaqa_id: string
          id: string
          meeting_url_override: string | null
          notes: string | null
          scheduled_at: string | null
          started_at: string | null
          started_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          halaqa_id: string
          id?: string
          meeting_url_override?: string | null
          notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          started_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          halaqa_id?: string
          id?: string
          meeting_url_override?: string | null
          notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          started_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaqa_sessions_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "halaqa_sessions_started_by_fkey"
            columns: ["started_by"]
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
          live_session_active: boolean
          live_session_started_at: string | null
          live_session_started_by: string | null
          max_students: number | null
          meeting_id: string | null
          meeting_link: string | null
          meeting_passcode: string | null
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
          live_session_active?: boolean
          live_session_started_at?: string | null
          live_session_started_by?: string | null
          max_students?: number | null
          meeting_id?: string | null
          meeting_link?: string | null
          meeting_passcode?: string | null
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
          live_session_active?: boolean
          live_session_started_at?: string | null
          live_session_started_by?: string | null
          max_students?: number | null
          meeting_id?: string | null
          meeting_link?: string | null
          meeting_passcode?: string | null
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
            foreignKeyName: "halaqas_live_session_started_by_fkey"
            columns: ["live_session_started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      payment_settings: {
        Row: {
          account_holder: string
          benefits_ar: Json
          benefits_en: Json
          benefits_fr: Json
          ccp_key: string | null
          ccp_number: string
          created_at: string
          currency: string
          description_ar: string
          description_en: string
          description_fr: string
          id: string
          price_dzd: number
          qr_code_url: string | null
          rip_number: string | null
          subscription_duration_days: number
          subscription_name_ar: string
          subscription_name_en: string
          subscription_name_fr: string
          updated_at: string
        }
        Insert: {
          account_holder?: string
          benefits_ar?: Json
          benefits_en?: Json
          benefits_fr?: Json
          ccp_key?: string | null
          ccp_number?: string
          created_at?: string
          currency?: string
          description_ar?: string
          description_en?: string
          description_fr?: string
          id?: string
          price_dzd?: number
          qr_code_url?: string | null
          rip_number?: string | null
          subscription_duration_days?: number
          subscription_name_ar?: string
          subscription_name_en?: string
          subscription_name_fr?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          benefits_ar?: Json
          benefits_en?: Json
          benefits_fr?: Json
          ccp_key?: string | null
          ccp_number?: string
          created_at?: string
          currency?: string
          description_ar?: string
          description_en?: string
          description_fr?: string
          id?: string
          price_dzd?: number
          qr_code_url?: string | null
          rip_number?: string | null
          subscription_duration_days?: number
          subscription_name_ar?: string
          subscription_name_en?: string
          subscription_name_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          client_ip: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_ref: string | null
          phone: string | null
          qr_expires_at: string | null
          qr_payload: Json | null
          qr_token: string | null
          receipt_file_url: string
          receipt_sha256: string | null
          rejected_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          transaction_number: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          client_ip?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          payment_date: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          phone?: string | null
          qr_expires_at?: string | null
          qr_payload?: Json | null
          qr_token?: string | null
          receipt_file_url: string
          receipt_sha256?: string | null
          rejected_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          transaction_number: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          client_ip?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          phone?: string | null
          qr_expires_at?: string | null
          qr_payload?: Json | null
          qr_token?: string | null
          receipt_file_url?: string
          receipt_sha256?: string | null
          rejected_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          transaction_number?: string
          updated_at?: string
        }
        Relationships: []
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
      session_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_path: string
          halaqa_id: string
          id: string
          session_id: string | null
          size_bytes: number | null
          title: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_path: string
          halaqa_id: string
          id?: string
          session_id?: string | null
          size_bytes?: number | null
          title?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_path?: string
          halaqa_id?: string
          id?: string
          session_id?: string | null
          size_bytes?: number | null
          title?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "halaqa_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_recordings_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          payment_id: string | null
          reminders_sent: Json
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          payment_id?: string | null
          reminders_sent?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          payment_id?: string | null
          reminders_sent?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      process_subscription_reminders: { Args: never; Returns: undefined }
    }
    Enums: {
      app_language: "ar" | "fr" | "en"
      app_role:
        | "student"
        | "teacher"
        | "halaqa_supervisor"
        | "general_supervisor"
        | "director"
        | "parent"
      attendance_status: "present" | "absent" | "late"
      conversation_kind: "direct" | "group" | "halaqa"
      gender_type: "male" | "female"
      halaqa_status: "active" | "archived" | "inactive"
      payment_method: "edahabia" | "baridimob"
      payment_status: "pending" | "approved" | "rejected"
      quran_level: "beginner" | "intermediate" | "advanced"
      student_status: "pending_review" | "approved" | "rejected" | "suspended"
      subscription_status:
        | "pending"
        | "active"
        | "expired"
        | "rejected"
        | "cancelled"
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
        "parent",
      ],
      attendance_status: ["present", "absent", "late"],
      conversation_kind: ["direct", "group", "halaqa"],
      gender_type: ["male", "female"],
      halaqa_status: ["active", "archived", "inactive"],
      payment_method: ["edahabia", "baridimob"],
      payment_status: ["pending", "approved", "rejected"],
      quran_level: ["beginner", "intermediate", "advanced"],
      student_status: ["pending_review", "approved", "rejected", "suspended"],
      subscription_status: [
        "pending",
        "active",
        "expired",
        "rejected",
        "cancelled",
      ],
      supervisor_note_category: [
        "behavior",
        "attendance",
        "technical",
        "follow_up",
      ],
    },
  },
} as const
