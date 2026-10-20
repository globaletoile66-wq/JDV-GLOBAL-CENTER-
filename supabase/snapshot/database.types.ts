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
      academy_assessment_answer_keys: {
        Row: {
          correct_answer: Json
          grading_notes: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: Json
          grading_notes?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: Json
          grading_notes?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_assessment_answer_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "academy_assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          id: string
          options: Json
          points: number
          prompt: string
          question_order: number
          question_type: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          options?: Json
          points?: number
          prompt: string
          question_order: number
          question_type: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          options?: Json
          points?: number
          prompt?: string
          question_order?: number
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "academy_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_assessment_submissions: {
        Row: {
          answers: Json
          assessment_id: string
          attempt_number: number
          created_at: string
          id: string
          student_user_id: string
          submission_status: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          assessment_id: string
          attempt_number?: number
          created_at?: string
          id?: string
          student_user_id: string
          submission_status?: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          attempt_number?: number
          created_at?: string
          id?: string
          student_user_id?: string
          submission_status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "academy_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_assessments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          max_score: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          max_score?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          max_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_certificates: {
        Row: {
          average_score_percent: number | null
          certificate_code: string
          certificate_status: string
          completion_percent: number
          course_id: string
          id: string
          issued_at: string
          student_user_id: string
        }
        Insert: {
          average_score_percent?: number | null
          certificate_code?: string
          certificate_status?: string
          completion_percent?: number
          course_id: string
          id?: string
          issued_at?: string
          student_user_id: string
        }
        Update: {
          average_score_percent?: number | null
          certificate_code?: string
          certificate_status?: string
          completion_percent?: number
          course_id?: string
          id?: string
          issued_at?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          instructor_user_id: string | null
          program_id: string
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          instructor_user_id?: string | null
          program_id: string
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          instructor_user_id?: string | null
          program_id?: string
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          enrollment_status: string
          id: string
          student_user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          enrollment_status?: string
          id?: string
          student_user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          enrollment_status?: string
          id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position_seconds: number
          lesson_id: string
          progress_status: string
          started_at: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number
          lesson_id: string
          progress_status?: string
          started_at?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number
          lesson_id?: string
          progress_status?: string
          started_at?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          content: string | null
          content_type: string
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          lesson_order: number
          media_url: string | null
          resource_links: Json
          title: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_order: number
          media_url?: string | null
          resource_links?: Json
          title: string
        }
        Update: {
          content?: string | null
          content_type?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_order?: number
          media_url?: string | null
          resource_links?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_live_sessions: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          live_status: string
          location_text: string | null
          meeting_url: string | null
          session_type: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          live_status?: string
          location_text?: string | null
          meeting_url?: string | null
          session_type?: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          live_status?: string
          location_text?: string | null
          meeting_url?: string | null
          session_type?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_programs: {
        Row: {
          created_at: string
          currency_id: string | null
          description: string | null
          duration_hours: number | null
          id: string
          name: string
          organization_id: string | null
          price: number | null
          program_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          name: string
          organization_id?: string | null
          price?: number | null
          program_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          name?: string
          organization_id?: string | null
          price?: number | null
          program_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_programs_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_results: {
        Row: {
          assessment_id: string
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number
          student_user_id: string
        }
        Insert: {
          assessment_id: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score: number
          student_user_id: string
        }
        Update: {
          assessment_id?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "academy_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_crops: {
        Row: {
          actual_harvest_date: string | null
          actual_yield: number | null
          created_at: string
          expected_harvest_date: string | null
          expected_yield: number | null
          farm_id: string
          id: string
          name: string
          planted_area_hectares: number | null
          planting_date: string | null
          season: string | null
          status: string
          unit: string | null
          updated_at: string
          variety: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          actual_yield?: number | null
          created_at?: string
          expected_harvest_date?: string | null
          expected_yield?: number | null
          farm_id: string
          id?: string
          name: string
          planted_area_hectares?: number | null
          planting_date?: string | null
          season?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          variety?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          actual_yield?: number | null
          created_at?: string
          expected_harvest_date?: string | null
          expected_yield?: number | null
          farm_id?: string
          id?: string
          name?: string
          planted_area_hectares?: number | null
          planting_date?: string | null
          season?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agri_crops_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "agri_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_farms: {
        Row: {
          address: string | null
          area_hectares: number | null
          city: string | null
          country_id: string | null
          created_at: string
          farm_type: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string | null
          owner_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_hectares?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          farm_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id?: string | null
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_hectares?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          farm_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string | null
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_farms_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "agri_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "agri_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "agri_products"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_orders: {
        Row: {
          buyer_user_id: string | null
          created_at: string
          currency_id: string | null
          id: string
          organization_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_user_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_orders_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_production_records: {
        Row: {
          activity_type: string
          cost_amount: number | null
          created_at: string
          crop_id: string
          currency_id: string | null
          id: string
          notes: string | null
          quantity: number | null
          record_date: string
          recorded_by: string | null
          unit: string | null
        }
        Insert: {
          activity_type: string
          cost_amount?: number | null
          created_at?: string
          crop_id: string
          currency_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          record_date?: string
          recorded_by?: string | null
          unit?: string | null
        }
        Update: {
          activity_type?: string
          cost_amount?: number | null
          created_at?: string
          crop_id?: string
          currency_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number | null
          record_date?: string
          recorded_by?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agri_production_records_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "agri_crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_production_records_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_products: {
        Row: {
          availability_status: string
          created_at: string
          currency_id: string | null
          farm_id: string | null
          id: string
          name: string
          product_type: string
          quantity: number
          unit: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          created_at?: string
          currency_id?: string | null
          farm_id?: string | null
          id?: string
          name: string
          product_type: string
          quantity?: number
          unit: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          availability_status?: string
          created_at?: string
          currency_id?: string | null
          farm_id?: string | null
          id?: string
          name?: string
          product_type?: string
          quantity?: number
          unit?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_products_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "agri_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_access_log: {
        Row: {
          action_type: string
          conversation_id: string | null
          created_at: string
          id: string
          organization_id: string | null
          result_count: number | null
          scope: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          result_count?: number | null
          scope?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          result_count?: number | null
          scope?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_access_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_access_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context: Json
          created_at: string
          id: string
          organization_id: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          model: string | null
          provider: string | null
          role: string
          token_input: number | null
          token_output: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          provider?: string | null
          role: string
          token_input?: number | null
          token_output?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          provider?: string | null
          role?: string
          token_input?: number | null
          token_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_catalog: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          input_cost_per_1m_tokens: number
          is_enabled: boolean
          model: string
          output_cost_per_1m_tokens: number
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          input_cost_per_1m_tokens?: number
          is_enabled?: boolean
          model: string
          output_cost_per_1m_tokens?: number
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          input_cost_per_1m_tokens?: number
          is_enabled?: boolean
          model?: string
          output_cost_per_1m_tokens?: number
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_org_policies: {
        Row: {
          allowed_models: string[]
          created_at: string
          default_model: string
          is_enabled: boolean
          monthly_cost_limit: number
          monthly_token_limit: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          allowed_models?: string[]
          created_at?: string
          default_model?: string
          is_enabled?: boolean
          monthly_cost_limit?: number
          monthly_token_limit?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          allowed_models?: string[]
          created_at?: string
          default_model?: string
          is_enabled?: boolean
          monthly_cost_limit?: number
          monthly_token_limit?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_org_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_configs: {
        Row: {
          api_key_secret_ref: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          model: string | null
          organization_id: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          api_key_secret_ref?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          organization_id?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          api_key_secret_ref?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          organization_id?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          conversation_id: string | null
          created_at: string
          currency_id: string | null
          estimated_cost: number
          id: string
          model: string | null
          organization_id: string | null
          provider: string
          request_reference: string | null
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          currency_id?: string | null
          estimated_cost?: number
          id?: string
          model?: string | null
          organization_id?: string | null
          provider: string
          request_reference?: string | null
          tokens_input?: number
          tokens_output?: number
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          currency_id?: string | null
          estimated_cost?: number
          id?: string
          model?: string | null
          organization_id?: string | null
          provider?: string
          request_reference?: string | null
          tokens_input?: number
          tokens_output?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      article_categories: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      article_serial_assignments: {
        Row: {
          active: boolean
          article_id: string
          assigned_at: string
          created_by: string | null
          id: string
          organization_id: string
          prospecteur_id: string | null
          released_at: string | null
          serial_number_id: string
          warehouse_id: string | null
        }
        Insert: {
          active?: boolean
          article_id: string
          assigned_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          prospecteur_id?: string | null
          released_at?: string | null
          serial_number_id: string
          warehouse_id?: string | null
        }
        Update: {
          active?: boolean
          article_id?: string
          assigned_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          prospecteur_id?: string | null
          released_at?: string | null
          serial_number_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_serial_assignments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          active: boolean
          cash_price: number
          category: string | null
          code: string
          created_at: string
          credit_price: number
          default_payment_amount: number
          description: string | null
          fixed_price: number
          id: string
          minimum_deposit: number
          name: string
          organization_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cash_price?: number
          category?: string | null
          code: string
          created_at?: string
          credit_price?: number
          default_payment_amount?: number
          description?: string | null
          fixed_price?: number
          id?: string
          minimum_deposit?: number
          name: string
          organization_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cash_price?: number
          category?: string | null
          code?: string
          created_at?: string
          credit_price?: number
          default_payment_amount?: number
          description?: string | null
          fixed_price?: number
          id?: string
          minimum_deposit?: number
          name?: string
          organization_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          module_code: string | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module_code?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module_code?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_id?: string | null
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
      bill_payments: {
        Row: {
          account_number: string
          amount: number
          biller_id: string
          created_at: string
          currency_id: string
          fee_amount: number
          id: string
          idempotency_key: string | null
          metadata: Json | null
          payment_status: Database["public"]["Enums"]["transaction_status"]
          reference: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          account_number: string
          amount: number
          biller_id: string
          created_at?: string
          currency_id: string
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          reference?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          account_number?: string
          amount?: number
          biller_id?: string
          created_at?: string
          currency_id?: string
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          reference?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "billers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      billers: {
        Row: {
          category: string
          code: string
          country_id: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          metadata: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_checkouts: {
        Row: {
          amount: number
          amount_xof: number | null
          created_at: string
          currency: string
          id: string
          module_code: string
          organization_id: string | null
          plan_id: string
          provider: string
          provider_transaction_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_xof?: number | null
          created_at?: string
          currency: string
          id?: string
          module_code: string
          organization_id?: string | null
          plan_id: string
          provider?: string
          provider_transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_xof?: number | null
          created_at?: string
          currency?: string
          id?: string
          module_code?: string
          organization_id?: string | null
          plan_id?: string
          provider?: string
          provider_transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_checkouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_checkouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_checkouts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoice_counters: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          amount_xof: number | null
          buyer: Json
          currency: string
          id: string
          invoice_number: string
          issued_at: string
          lines: Json
          module_code: string
          organization_id: string | null
          payment_id: string | null
          period_end: string | null
          period_start: string | null
          plan_code: string
          plan_name: string
          seller: Json | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          user_id: string | null
        }
        Insert: {
          amount_xof?: number | null
          buyer?: Json
          currency: string
          id?: string
          invoice_number: string
          issued_at?: string
          lines?: Json
          module_code: string
          organization_id?: string | null
          payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_code: string
          plan_name: string
          seller?: Json | null
          status?: string
          subscription_id?: string | null
          subtotal: number
          tax_amount?: number
          tax_rate?: number
          total: number
          user_id?: string | null
        }
        Update: {
          amount_xof?: number | null
          buyer?: Json
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          lines?: Json
          module_code?: string
          organization_id?: string | null
          payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_code?: string
          plan_name?: string
          seller?: Json | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "subscription_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_reminders_sent: {
        Row: {
          expires_at: string
          id: string
          kind: string
          sent_at: string
          subscription_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          kind: string
          sent_at?: string
          subscription_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          kind?: string
          sent_at?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_reminders_sent_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          email: string | null
          footer: string | null
          id: number
          legal_name: string | null
          phone: string | null
          tax_id: string | null
          tax_label: string | null
          tax_rate: number
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          email?: string | null
          footer?: string | null
          id?: number
          legal_name?: string | null
          phone?: string | null
          tax_id?: string | null
          tax_label?: string | null
          tax_rate?: number
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          email?: string | null
          footer?: string | null
          id?: number
          legal_name?: string | null
          phone?: string | null
          tax_id?: string | null
          tax_label?: string | null
          tax_rate?: number
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_appointments: {
        Row: {
          appointment_status: Database["public"]["Enums"]["appointment_status"]
          assigned_to: string | null
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          notes: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_status?: Database["public"]["Enums"]["appointment_status"]
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_status?: Database["public"]["Enums"]["appointment_status"]
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_clients: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          company_name: string | null
          country_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          company_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          company_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_clients_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      business_documents: {
        Row: {
          business_id: string
          created_at: string
          document_type: string | null
          file_size: number | null
          file_url: string
          id: string
          is_public: boolean
          mime_type: string | null
          name: string
          uploaded_by: string
        }
        Insert: {
          business_id: string
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          name: string
          uploaded_by: string
        }
        Update: {
          business_id?: string
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          name?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          business_id: string
          category: string | null
          created_at: string
          created_by: string
          currency_id: string | null
          description: string
          expense_date: string
          expense_status: Database["public"]["Enums"]["expense_status"]
          id: string
          pay_transaction_id: string | null
          receipt_url: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          category?: string | null
          created_at?: string
          created_by: string
          currency_id?: string | null
          description: string
          expense_date?: string
          expense_status?: Database["public"]["Enums"]["expense_status"]
          id?: string
          pay_transaction_id?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          description?: string
          expense_date?: string
          expense_status?: Database["public"]["Enums"]["expense_status"]
          id?: string
          pay_transaction_id?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "business_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invoices: {
        Row: {
          amount_paid: number
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string
          currency_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          invoice_status: Database["public"]["Enums"]["invoice_status"]
          issue_date: string
          notes: string | null
          pay_transaction_id: string | null
          sale_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by: string
          currency_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_status?: Database["public"]["Enums"]["invoice_status"]
          issue_date?: string
          notes?: string | null
          pay_transaction_id?: string | null
          sale_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_status?: Database["public"]["Enums"]["invoice_status"]
          issue_date?: string
          notes?: string | null
          pay_transaction_id?: string | null
          sale_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invoices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_orders: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string
          currency_id: string | null
          delivery_address: string | null
          id: string
          notes: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          ordered_at: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by: string
          currency_id?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_number: string
          order_status?: Database["public"]["Enums"]["order_status"]
          ordered_at?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          ordered_at?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_product_categories: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_product_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_products: {
        Row: {
          business_id: string
          category_id: string | null
          code: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_service: boolean
          min_stock_alert: number | null
          name: string
          price: number
          stock_quantity: number
          tax_rate: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          code?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_service?: boolean
          min_stock_alert?: number | null
          name: string
          price?: number
          stock_quantity?: number
          tax_rate?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          code?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_service?: boolean
          min_stock_alert?: number | null
          name?: string
          price?: number
          stock_quantity?: number
          tax_rate?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          accepts_online_payment: boolean
          address: string | null
          business_status: Database["public"]["Enums"]["business_status"]
          category_id: string | null
          city: string | null
          country_id: string | null
          cover_url: string | null
          created_at: string
          currency_id: string | null
          description: string | null
          email: string | null
          id: string
          is_public: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          organization_id: string
          owner_user_id: string
          phone: string | null
          postal_code: string | null
          region: string | null
          tagline: string | null
          trade_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accepts_online_payment?: boolean
          address?: string | null
          business_status?: Database["public"]["Enums"]["business_status"]
          category_id?: string | null
          city?: string | null
          country_id?: string | null
          cover_url?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          organization_id: string
          owner_user_id: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tagline?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accepts_online_payment?: boolean
          address?: string | null
          business_status?: Database["public"]["Enums"]["business_status"]
          category_id?: string | null
          city?: string | null
          country_id?: string | null
          cover_url?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_public?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          organization_id?: string
          owner_user_id?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          tagline?: string | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sale_items: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          line_total: number
          product_code: string | null
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          id?: string
          line_total?: number
          product_code?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          line_total?: number
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sales: {
        Row: {
          amount_paid: number
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string
          currency_id: string | null
          discount_amount: number
          id: string
          notes: string | null
          pay_transaction_id: string | null
          payment_method: string | null
          sale_date: string
          sale_number: string
          sale_status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by: string
          currency_id?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          pay_transaction_id?: string | null
          payment_method?: string | null
          sale_date?: string
          sale_number: string
          sale_status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          discount_amount?: number
          id?: string
          notes?: string | null
          pay_transaction_id?: string | null
          payment_method?: string | null
          sale_date?: string
          sale_number?: string
          sale_status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sales_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_suppliers: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          contact_name: string | null
          country_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          contact_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          contact_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string
          prospect_id: string | null
          prospecteur_id: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_center_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_date: string
          caller_user_id: string | null
          client_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          organization_id: string
          prospect_id: string | null
          prospecteur_id: string | null
          result: string | null
        }
        Insert: {
          call_date?: string
          caller_user_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          result?: string | null
        }
        Update: {
          call_date?: string
          caller_user_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashback_transactions: {
        Row: {
          amount: number
          cashback_account_id: string
          cashback_type: string
          created_at: string
          expires_at: string | null
          id: string
          percentage: number | null
          source: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          cashback_account_id: string
          cashback_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          percentage?: number | null
          source?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          cashback_account_id?: string
          cashback_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          percentage?: number | null
          source?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_cashback_account_id_fkey"
            columns: ["cashback_account_id"]
            isOneToOne: false
            referencedRelation: "cashback_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portfolios: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_type: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          organization_id: string
          owner_type: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_type?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portfolios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          identity_reference: string | null
          last_activity_at: string | null
          last_contact_at: string | null
          last_name: string | null
          last_payment_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          organization_id: string
          phone: string | null
          portfolio_id: string | null
          prospecteur_id: string | null
          status: string
          temperature: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "client_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          article_id: string | null
          base_amount: number
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          organization_id: string
          paid_at: string | null
          payment_id: string | null
          prospecteur_id: string
          sale_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          organization_id: string
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id: string
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id?: string
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string
          default_currency_id: string | null
          default_language_id: string | null
          flag_emoji: string | null
          id: string
          is_active: boolean
          iso_code: string
          iso3_code: string | null
          name: string
          phone_code: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency_id?: string | null
          default_language_id?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          iso_code: string
          iso3_code?: string | null
          name: string
          phone_code?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency_id?: string | null
          default_language_id?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          iso_code?: string
          iso3_code?: string | null
          name?: string
          phone_code?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_default_currency_id_fkey"
            columns: ["default_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "countries_default_language_id_fkey"
            columns: ["default_language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_appointments: {
        Row: {
          appointment_status: Database["public"]["Enums"]["crm_appointment_status"]
          business_id: string
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          notes: string | null
          prospect_id: string | null
          prospecteur_id: string | null
          scheduled_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          appointment_status?: Database["public"]["Enums"]["crm_appointment_status"]
          business_id: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          prospect_id?: string | null
          prospecteur_id?: string | null
          scheduled_at: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          appointment_status?: Database["public"]["Enums"]["crm_appointment_status"]
          business_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          prospect_id?: string | null
          prospecteur_id?: string | null
          scheduled_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_appointments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_appointments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_alerts: {
        Row: {
          action_url: string | null
          active: boolean
          alert_key: string
          alert_type: string
          created_at: string
          entity_id: string
          id: string
          last_triggered_at: string
          message: string
          organization_id: string | null
          recipient_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          active?: boolean
          alert_key: string
          alert_type: string
          created_at?: string
          entity_id: string
          id?: string
          last_triggered_at?: string
          message: string
          organization_id?: string | null
          recipient_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          active?: boolean
          alert_key?: string
          alert_type?: string
          created_at?: string
          entity_id?: string
          id?: string
          last_triggered_at?: string
          message?: string
          organization_id?: string | null
          recipient_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_deliveries: {
        Row: {
          alert_id: string
          attempt_count: number
          channel: string
          created_at: string
          id: string
          last_error: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_id: string
          attempt_count?: number
          channel: string
          created_at?: string
          id?: string
          last_error?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          attempt_count?: number
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_deliveries_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "crm_automation_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_collection_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_collection_activity_type"]
          actor_user_id: string
          business_id: string
          comment: string | null
          created_at: string
          id: string
          promise_status:
            | Database["public"]["Enums"]["crm_promise_status"]
            | null
          promised_amount: number | null
          promised_date: string | null
          schedule_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_collection_activity_type"]
          actor_user_id: string
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          promise_status?:
            | Database["public"]["Enums"]["crm_promise_status"]
            | null
          promised_amount?: number | null
          promised_date?: string | null
          schedule_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_collection_activity_type"]
          actor_user_id?: string
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          promise_status?:
            | Database["public"]["Enums"]["crm_promise_status"]
            | null
          promised_amount?: number | null
          promised_date?: string | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_collection_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_collection_activities_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "crm_payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_commission_rules: {
        Row: {
          business_id: string
          category_id: string | null
          commission_basis: Database["public"]["Enums"]["crm_commission_basis"]
          created_at: string
          fixed_amount: number | null
          id: string
          is_active: boolean
          name: string
          percentage: number | null
          priority: number
          product_id: string | null
          prospecteur_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          commission_basis?: Database["public"]["Enums"]["crm_commission_basis"]
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
          percentage?: number | null
          priority?: number
          product_id?: string | null
          prospecteur_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          commission_basis?: Database["public"]["Enums"]["crm_commission_basis"]
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
          percentage?: number | null
          priority?: number
          product_id?: string | null
          prospecteur_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_commission_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commission_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commission_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commission_rules_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_commissions: {
        Row: {
          amount: number
          business_id: string
          commission_status: Database["public"]["Enums"]["crm_commission_status"]
          created_at: string
          currency_id: string | null
          id: string
          idempotency_key: string | null
          payment_id: string | null
          prospecteur_id: string
          rule_id: string | null
          sale_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          commission_status?: Database["public"]["Enums"]["crm_commission_status"]
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          payment_id?: string | null
          prospecteur_id: string
          rule_id?: string | null
          sale_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          commission_status?: Database["public"]["Enums"]["crm_commission_status"]
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          payment_id?: string | null
          prospecteur_id?: string
          rule_id?: string | null
          sale_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commissions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "crm_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "crm_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_credit_terms: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          currency_id: string | null
          down_payment: number
          financed_amount: number
          first_due_date: string
          frequency: string
          id: string
          installments_count: number
          last_due_date: string | null
          prospecteur_id: string | null
          sale_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          currency_id?: string | null
          down_payment?: number
          financed_amount: number
          first_due_date: string
          frequency?: string
          id?: string
          installments_count: number
          last_due_date?: string | null
          prospecteur_id?: string | null
          sale_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          currency_id?: string | null
          down_payment?: number
          financed_amount?: number
          first_due_date?: string
          frequency?: string
          id?: string
          installments_count?: number
          last_due_date?: string | null
          prospecteur_id?: string | null
          sale_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_credit_terms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_credit_terms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_credit_terms_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_credit_terms_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_credit_terms_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_documents: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string
          document_type: string | null
          file_url: string
          id: string
          is_public: boolean
          name: string
          prospect_id: string | null
          uploaded_by: string
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string
          document_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          name: string
          prospect_id?: string | null
          uploaded_by: string
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string
          document_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          name?: string
          prospect_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          phone_e164: string | null
          sms_enabled: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          phone_e164?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          phone_e164?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      crm_payment_schedules: {
        Row: {
          amount_due: number
          amount_paid: number
          business_id: string
          client_id: string
          created_at: string
          credit_term_id: string
          currency_id: string | null
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          remaining_amount: number | null
          sale_id: string
          schedule_status: Database["public"]["Enums"]["crm_schedule_status"]
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          business_id: string
          client_id: string
          created_at?: string
          credit_term_id: string
          currency_id?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          remaining_amount?: number | null
          sale_id: string
          schedule_status?: Database["public"]["Enums"]["crm_schedule_status"]
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          business_id?: string
          client_id?: string
          created_at?: string
          credit_term_id?: string
          currency_id?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          remaining_amount?: number | null
          sale_id?: string
          schedule_status?: Database["public"]["Enums"]["crm_schedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_payment_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payment_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payment_schedules_credit_term_id_fkey"
            columns: ["credit_term_id"]
            isOneToOne: false
            referencedRelation: "crm_credit_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payment_schedules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_payments: {
        Row: {
          amount: number
          business_id: string
          client_id: string
          created_at: string
          currency_id: string | null
          id: string
          idempotency_key: string | null
          jdv_pay_transaction_id: string | null
          payment_method: string | null
          recorded_by: string
          sale_id: string | null
          schedule_id: string | null
        }
        Insert: {
          amount: number
          business_id: string
          client_id: string
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          jdv_pay_transaction_id?: string | null
          payment_method?: string | null
          recorded_by: string
          sale_id?: string | null
          schedule_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          client_id?: string
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          jdv_pay_transaction_id?: string | null
          payment_method?: string | null
          recorded_by?: string
          sale_id?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_jdv_pay_transaction_id_fkey"
            columns: ["jdv_pay_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "crm_payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospect_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          actor_user_id: string
          business_id: string
          client_id: string | null
          comment: string | null
          created_at: string
          id: string
          next_action_at: string | null
          prospect_id: string | null
          result: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          actor_user_id: string
          business_id: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          next_action_at?: string | null
          prospect_id?: string | null
          result?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          actor_user_id?: string
          business_id?: string
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          next_action_at?: string | null
          prospect_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospect_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospect_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospecteur_stocks: {
        Row: {
          business_id: string
          id: string
          minimum_quantity: number
          product_id: string
          prospecteur_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          business_id: string
          id?: string
          minimum_quantity?: number
          product_id: string
          prospecteur_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          id?: string
          minimum_quantity?: number
          product_id?: string
          prospecteur_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospecteur_stocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospecteur_stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospecteurs: {
        Row: {
          business_id: string
          code: string | null
          commission_rate: number | null
          created_at: string
          id: string
          monthly_target: number | null
          prospecteur_status: Database["public"]["Enums"]["crm_prospecteur_status"]
          territory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          code?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          monthly_target?: number | null
          prospecteur_status?: Database["public"]["Enums"]["crm_prospecteur_status"]
          territory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          code?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          monthly_target?: number | null
          prospecteur_status?: Database["public"]["Enums"]["crm_prospecteur_status"]
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospecteurs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospects: {
        Row: {
          address: string | null
          appointment_at: string | null
          archived_at: string | null
          assigned_prospecteur_id: string | null
          business_id: string
          city: string | null
          contact_count: number
          converted_at: string | null
          converted_client_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          desired_product: string | null
          desired_product_code: string | null
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          meeting_place: string | null
          next_follow_up_at: string | null
          phone: string | null
          prospect_status: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount: number | null
          temperature: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          appointment_at?: string | null
          archived_at?: string | null
          assigned_prospecteur_id?: string | null
          business_id: string
          city?: string | null
          contact_count?: number
          converted_at?: string | null
          converted_client_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          desired_product?: string | null
          desired_product_code?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_contact_at?: string | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          meeting_place?: string | null
          next_follow_up_at?: string | null
          phone?: string | null
          prospect_status?: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount?: number | null
          temperature?: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          appointment_at?: string | null
          archived_at?: string | null
          assigned_prospecteur_id?: string | null
          business_id?: string
          city?: string | null
          contact_count?: number
          converted_at?: string | null
          converted_client_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          desired_product?: string | null
          desired_product_code?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_contact_at?: string | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          meeting_place?: string | null
          next_follow_up_at?: string | null
          phone?: string | null
          prospect_status?: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount?: number | null
          temperature?: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospects_assigned_prospecteur_id_fkey"
            columns: ["assigned_prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stock_movements: {
        Row: {
          actor_user_id: string
          business_id: string
          created_at: string
          from_prospecteur_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["crm_stock_movement_type"]
          product_id: string
          quantity: number
          reference: string | null
          sale_id: string | null
          to_prospecteur_id: string | null
        }
        Insert: {
          actor_user_id: string
          business_id: string
          created_at?: string
          from_prospecteur_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["crm_stock_movement_type"]
          product_id: string
          quantity: number
          reference?: string | null
          sale_id?: string | null
          to_prospecteur_id?: string | null
        }
        Update: {
          actor_user_id?: string
          business_id?: string
          created_at?: string
          from_prospecteur_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["crm_stock_movement_type"]
          product_id?: string
          quantity?: number
          reference?: string | null
          sale_id?: string | null
          to_prospecteur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stock_movements_from_prospecteur_id_fkey"
            columns: ["from_prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stock_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stock_movements_to_prospecteur_id_fkey"
            columns: ["to_prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_targets: {
        Row: {
          achieved_value: number
          business_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["crm_target_period"]
          prospecteur_id: string | null
          target_type: string
          target_value: number
          updated_at: string
        }
        Insert: {
          achieved_value?: number
          business_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type?: Database["public"]["Enums"]["crm_target_period"]
          prospecteur_id?: string | null
          target_type: string
          target_value: number
          updated_at?: string
        }
        Update: {
          achieved_value?: number
          business_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: Database["public"]["Enums"]["crm_target_period"]
          prospecteur_id?: string | null
          target_type?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_targets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_targets_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "crm_prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          decimal_places: number
          id: string
          is_active: boolean
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          decimal_places?: number
          id?: string
          is_active?: boolean
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          decimal_places?: number
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_tokens: {
        Row: {
          client_id: string | null
          created_at: string
          expected_amount: number
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          prospecteur_id: string | null
          sale_id: string | null
          status: string
          token_date: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string
          token_date?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string
          token_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          created_at: string
          current_number: number
          document_type: string
          id: string
          organization_id: string
          padding: number
          prefix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_number?: number
          document_type: string
          id?: string
          organization_id: string
          padding?: number
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_number?: number
          document_type?: string
          id?: string
          organization_id?: string
          padding?: number
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          code: string
          created_at: string
          document_type: string
          id: string
          name: string
          organization_id: string | null
          template_content: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          document_type: string
          id?: string
          name: string
          organization_id?: string | null
          template_content?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          document_type?: string
          id?: string
          name?: string
          organization_id?: string | null
          template_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_number: string | null
          document_type: string
          id: string
          metadata: Json
          organization_id: string
          related_id: string | null
          related_table: string | null
          status: string
          storage_path: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type: string
          id?: string
          metadata?: Json
          organization_id: string
          related_id?: string | null
          related_table?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          related_id?: string | null
          related_table?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_assets: {
        Row: {
          asset_type: string
          capacity_kw: number | null
          created_at: string
          id: string
          installed_on: string | null
          serial_number: string | null
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          capacity_kw?: number | null
          created_at?: string
          id?: string
          installed_on?: string | null
          serial_number?: string | null
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          capacity_kw?: number | null
          created_at?: string
          id?: string
          installed_on?: string | null
          serial_number?: string | null
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_assets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "energy_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_billing_records: {
        Row: {
          amount: number
          consumption_kwh: number
          created_at: string
          currency_id: string | null
          id: string
          period_end: string
          period_start: string
          site_id: string
          status: string
        }
        Insert: {
          amount?: number
          consumption_kwh?: number
          created_at?: string
          currency_id?: string | null
          id?: string
          period_end: string
          period_start: string
          site_id: string
          status?: string
        }
        Update: {
          amount?: number
          consumption_kwh?: number
          created_at?: string
          currency_id?: string | null
          id?: string
          period_end?: string
          period_start?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_billing_records_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_billing_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "energy_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_meter_readings: {
        Row: {
          created_at: string
          id: string
          reading_at: string
          reading_value: number
          recorded_by: string | null
          site_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          reading_at?: string
          reading_value: number
          recorded_by?: string | null
          site_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          reading_at?: string
          reading_value?: number
          recorded_by?: string | null
          site_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_meter_readings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "energy_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_providers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          country_id: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          provider_type: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          provider_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          provider_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_providers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_sites: {
        Row: {
          address: string | null
          capacity_kw: number | null
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string | null
          owner_user_id: string | null
          provider_id: string | null
          site_type: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity_kw?: number | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id?: string | null
          owner_user_id?: string | null
          provider_id?: string | null
          site_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity_kw?: number | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string | null
          owner_user_id?: string | null
          provider_id?: string | null
          site_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_sites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "energy_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency_id: string
          created_at: string
          effective_at: string
          id: string
          rate: number
          source: string | null
          target_currency_id: string
        }
        Insert: {
          base_currency_id: string
          created_at?: string
          effective_at?: string
          id?: string
          rate: number
          source?: string | null
          target_currency_id: string
        }
        Update: {
          base_currency_id?: string
          created_at?: string
          effective_at?: string
          id?: string
          rate?: number
          source?: string | null
          target_currency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_base_currency_id_fkey"
            columns: ["base_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_target_currency_id_fkey"
            columns: ["target_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_transactions: {
        Row: {
          created_at: string
          destination_amount: number
          destination_currency_id: string
          destination_wallet_id: string
          exchange_rate: number
          exchange_status: Database["public"]["Enums"]["transaction_status"]
          fee_amount: number
          id: string
          idempotency_key: string | null
          rate_source: string | null
          reference: string | null
          source_amount: number
          source_currency_id: string
          source_wallet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_amount: number
          destination_currency_id: string
          destination_wallet_id: string
          exchange_rate: number
          exchange_status?: Database["public"]["Enums"]["transaction_status"]
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          rate_source?: string | null
          reference?: string | null
          source_amount: number
          source_currency_id: string
          source_wallet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination_amount?: number
          destination_currency_id?: string
          destination_wallet_id?: string
          exchange_rate?: number
          exchange_status?: Database["public"]["Enums"]["transaction_status"]
          fee_amount?: number
          id?: string
          idempotency_key?: string | null
          rate_source?: string | null
          reference?: string | null
          source_amount?: number
          source_currency_id?: string
          source_wallet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_transactions_destination_currency_id_fkey"
            columns: ["destination_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_transactions_destination_wallet_id_fkey"
            columns: ["destination_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_transactions_source_currency_id_fkey"
            columns: ["source_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_transactions_source_wallet_id_fkey"
            columns: ["source_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_rules: {
        Row: {
          created_at: string
          currency_id: string | null
          destination_country_id: string | null
          fixed_amount: number
          id: string
          is_active: boolean
          maximum_amount: number | null
          minimum_amount: number | null
          operation_type: string
          percentage: number
          priority: number
          provider_id: string | null
          source_country_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          destination_country_id?: string | null
          fixed_amount?: number
          id?: string
          is_active?: boolean
          maximum_amount?: number | null
          minimum_amount?: number | null
          operation_type: string
          percentage?: number
          priority?: number
          provider_id?: string | null
          source_country_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          destination_country_id?: string | null
          fixed_amount?: number
          id?: string
          is_active?: boolean
          maximum_amount?: number | null
          minimum_amount?: number | null
          operation_type?: string
          percentage?: number
          priority?: number
          provider_id?: string | null
          source_country_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_rules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_rules_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_rules_source_country_id_fkey"
            columns: ["source_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      field_visits: {
        Row: {
          address: string | null
          client_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          prospect_id: string | null
          prospecteur_id: string
          result: string | null
          visit_date: string
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          prospect_id?: string | null
          prospecteur_id: string
          result?: string | null
          visit_date?: string
        }
        Update: {
          address?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          prospect_id?: string | null
          prospecteur_id?: string
          result?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string
          id: string
          message: string | null
          organization_id: string
          prospect_id: string | null
          reminder_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          prospect_id?: string | null
          reminder_at: string
          status?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          prospect_id?: string | null
          reminder_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity_received: number
          receipt_id: string
          unit_cost: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity_received: number
          receipt_id: string
          unit_cost?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity_received?: number
          receipt_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          purchase_order_id: string | null
          receipt_date: string
          receipt_number: string
          received_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      health_appointments: {
        Row: {
          appointment_status: Database["public"]["Enums"]["health_appointment_status"]
          business_id: string | null
          created_at: string
          currency_id: string | null
          duration_minutes: number
          id: string
          idempotency_key: string | null
          notes: string | null
          patient_user_id: string
          price: number | null
          professional_id: string
          scheduled_at: string
          service_id: string | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          appointment_status?: Database["public"]["Enums"]["health_appointment_status"]
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          duration_minutes?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          patient_user_id: string
          price?: number | null
          professional_id: string
          scheduled_at: string
          service_id?: string | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          appointment_status?: Database["public"]["Enums"]["health_appointment_status"]
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          duration_minutes?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          patient_user_id?: string
          price?: number | null
          professional_id?: string
          scheduled_at?: string
          service_id?: string | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_appointments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "health_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_appointments_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_availabilities: {
        Row: {
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          is_active: boolean
          professional_id: string
          slot_duration_minutes: number
          specific_date: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          slot_duration_minutes?: number
          specific_date?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          slot_duration_minutes?: number
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_availabilities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_documents: {
        Row: {
          business_id: string | null
          category: Database["public"]["Enums"]["health_document_category"]
          confidentiality_level: string
          created_at: string
          file_url: string
          id: string
          name: string
          owner_user_id: string
          uploaded_by: string
        }
        Insert: {
          business_id?: string | null
          category?: Database["public"]["Enums"]["health_document_category"]
          confidentiality_level?: string
          created_at?: string
          file_url: string
          id?: string
          name: string
          owner_user_id: string
          uploaded_by: string
        }
        Update: {
          business_id?: string | null
          category?: Database["public"]["Enums"]["health_document_category"]
          confidentiality_level?: string
          created_at?: string
          file_url?: string
          id?: string
          name?: string
          owner_user_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_emergency_contacts: {
        Row: {
          country_id: string
          description: string | null
          id: string
          is_active: boolean
          phone_number: string
          service_type: string
        }
        Insert: {
          country_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          phone_number: string
          service_type: string
        }
        Update: {
          country_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_emergency_contacts_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      health_home_care_requests: {
        Row: {
          address: string | null
          business_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          patient_user_id: string
          professional_id: string | null
          request_status: Database["public"]["Enums"]["health_home_care_status"]
          scheduled_at: string | null
          service_type: string
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          patient_user_id: string
          professional_id?: string | null
          request_status?: Database["public"]["Enums"]["health_home_care_status"]
          scheduled_at?: string | null
          service_type: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          patient_user_id?: string
          professional_id?: string | null
          request_status?: Database["public"]["Enums"]["health_home_care_status"]
          scheduled_at?: string | null
          service_type?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_home_care_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_home_care_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_home_care_requests_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_invoices: {
        Row: {
          amount: number
          appointment_id: string | null
          business_id: string | null
          created_at: string
          currency_id: string | null
          id: string
          invoice_status: Database["public"]["Enums"]["health_invoice_status"]
          patient_user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          invoice_status?: Database["public"]["Enums"]["health_invoice_status"]
          patient_user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          invoice_status?: Database["public"]["Enums"]["health_invoice_status"]
          patient_user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_invoices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_invoices_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_laboratory_orders: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          order_status: Database["public"]["Enums"]["health_lab_status"]
          ordering_professional_id: string | null
          patient_user_id: string
          test_type: string
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          order_status?: Database["public"]["Enums"]["health_lab_status"]
          ordering_professional_id?: string | null
          patient_user_id: string
          test_type: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          order_status?: Database["public"]["Enums"]["health_lab_status"]
          ordering_professional_id?: string | null
          patient_user_id?: string
          test_type?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_laboratory_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_laboratory_orders_ordering_professional_id_fkey"
            columns: ["ordering_professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_laboratory_orders_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_laboratory_results: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          order_id: string
          released_at: string | null
          summary: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          order_id: string
          released_at?: string | null
          summary?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          order_id?: string
          released_at?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_laboratory_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "health_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_laboratory_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "health_laboratory_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      health_medical_record_access_log: {
        Row: {
          access_reason: string | null
          accessed_at: string
          accessor_user_id: string
          id: string
          record_id: string
        }
        Insert: {
          access_reason?: string | null
          accessed_at?: string
          accessor_user_id: string
          id?: string
          record_id: string
        }
        Update: {
          access_reason?: string | null
          accessed_at?: string
          accessor_user_id?: string
          id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_medical_record_access_log_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "health_medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      health_medical_records: {
        Row: {
          appointment_id: string | null
          author_professional_id: string
          business_id: string | null
          content: string | null
          created_at: string
          id: string
          patient_user_id: string
          record_type: string
          title: string
        }
        Insert: {
          appointment_id?: string | null
          author_professional_id: string
          business_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          patient_user_id: string
          record_type?: string
          title: string
        }
        Update: {
          appointment_id?: string | null
          author_professional_id?: string
          business_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          patient_user_id?: string
          record_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_medical_records_author_professional_id_fkey"
            columns: ["author_professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_medical_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_on_call_schedules: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          ends_at: string
          id: string
          professional_id: string | null
          service_type: string
          starts_at: string
          status: string
          updated_at: string
          verification_source: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          professional_id?: string | null
          service_type: string
          starts_at: string
          status?: string
          updated_at?: string
          verification_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          professional_id?: string | null
          service_type?: string
          starts_at?: string
          status?: string
          updated_at?: string
          verification_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_on_call_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_on_call_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_patient_consents: {
        Row: {
          consent_status: Database["public"]["Enums"]["health_consent_status"]
          created_at: string
          expires_at: string | null
          granted_at: string
          grantee_business_id: string | null
          grantee_professional_id: string | null
          id: string
          patient_user_id: string
          revoked_at: string | null
          scope: Database["public"]["Enums"]["health_consent_scope"]
        }
        Insert: {
          consent_status?: Database["public"]["Enums"]["health_consent_status"]
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          grantee_business_id?: string | null
          grantee_professional_id?: string | null
          id?: string
          patient_user_id: string
          revoked_at?: string | null
          scope?: Database["public"]["Enums"]["health_consent_scope"]
        }
        Update: {
          consent_status?: Database["public"]["Enums"]["health_consent_status"]
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          grantee_business_id?: string | null
          grantee_professional_id?: string | null
          id?: string
          patient_user_id?: string
          revoked_at?: string | null
          scope?: Database["public"]["Enums"]["health_consent_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "health_patient_consents_grantee_business_id_fkey"
            columns: ["grantee_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_patient_consents_grantee_professional_id_fkey"
            columns: ["grantee_professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_prescription_items: {
        Row: {
          dosage: string | null
          duration: string | null
          id: string
          instructions: string | null
          medication_name: string
          prescription_id: string
        }
        Insert: {
          dosage?: string | null
          duration?: string | null
          id?: string
          instructions?: string | null
          medication_name: string
          prescription_id: string
        }
        Update: {
          dosage?: string | null
          duration?: string | null
          id?: string
          instructions?: string | null
          medication_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "health_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          document_id: string | null
          id: string
          patient_user_id: string
          prescriber_professional_id: string
          prescription_status: Database["public"]["Enums"]["health_prescription_status"]
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          patient_user_id: string
          prescriber_professional_id: string
          prescription_status?: Database["public"]["Enums"]["health_prescription_status"]
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          patient_user_id?: string
          prescriber_professional_id?: string
          prescription_status?: Database["public"]["Enums"]["health_prescription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "health_prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_prescriptions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "health_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_prescriptions_prescriber_professional_id_fkey"
            columns: ["prescriber_professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_professionals: {
        Row: {
          bio: string | null
          business_id: string | null
          country_id: string | null
          created_at: string
          experience_years: number | null
          id: string
          is_active: boolean
          languages: string[] | null
          specialty_id: string | null
          sub_specialty: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["health_verification_status"]
        }
        Insert: {
          bio?: string | null
          business_id?: string | null
          country_id?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean
          languages?: string[] | null
          specialty_id?: string | null
          sub_specialty?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["health_verification_status"]
        }
        Update: {
          bio?: string | null
          business_id?: string | null
          country_id?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean
          languages?: string[] | null
          specialty_id?: string | null
          sub_specialty?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["health_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "health_professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_professionals_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "health_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      health_provider_applications: {
        Row: {
          address: string | null
          applicant_user_id: string
          city: string
          country_id: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          latitude: number | null
          legal_name: string
          longitude: number | null
          notes: string | null
          phone: string
          provider_type: string
          registration_authority: string | null
          registration_number: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_user_id: string
          city: string
          country_id?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          notes?: string | null
          phone: string
          provider_type: string
          registration_authority?: string | null
          registration_number?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_user_id?: string
          city?: string
          country_id?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          notes?: string | null
          phone?: string
          provider_type?: string
          registration_authority?: string | null
          registration_number?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_provider_applications_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      health_provider_profiles: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          country_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          provider_type: Database["public"]["Enums"]["health_provider_type"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["health_verification_status"]
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          provider_type: Database["public"]["Enums"]["health_provider_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["health_verification_status"]
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          provider_type?: Database["public"]["Enums"]["health_provider_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["health_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "health_provider_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_provider_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      health_reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          review_status: string
          reviewer_user_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          review_status?: string
          reviewer_user_id: string
          target_id: string
          target_type: string
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_status?: string
          reviewer_user_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "health_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      health_services: {
        Row: {
          business_id: string | null
          created_at: string
          currency_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          professional_id: string | null
          service_type: string
          specialty_id: string | null
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          professional_id?: string | null
          service_type?: string
          specialty_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          professional_id?: string | null
          service_type?: string
          specialty_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_services_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_services_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "health_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      health_specialties: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_specialties_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "health_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      health_teleconsultation_requests: {
        Row: {
          consultation_mode: string
          created_at: string
          id: string
          meeting_url: string | null
          patient_user_id: string
          professional_id: string
          professional_notes: string | null
          reason_summary: string
          request_status: string
          requested_at: string | null
          updated_at: string
        }
        Insert: {
          consultation_mode?: string
          created_at?: string
          id?: string
          meeting_url?: string | null
          patient_user_id: string
          professional_id: string
          professional_notes?: string | null
          reason_summary: string
          request_status?: string
          requested_at?: string | null
          updated_at?: string
        }
        Update: {
          consultation_mode?: string
          created_at?: string
          id?: string
          meeting_url?: string | null
          patient_user_id?: string
          professional_id?: string
          professional_notes?: string | null
          reason_summary?: string
          request_status?: string
          requested_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_teleconsultation_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_verification_records: {
        Row: {
          created_at: string
          documents: Json
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["health_verification_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          documents?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["health_verification_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          documents?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["health_verification_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      immo_agencies: {
        Row: {
          business_id: string
          created_at: string
          id: string
          license_number: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["immo_verification_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          license_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          license_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "immo_agencies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_agents: {
        Row: {
          business_id: string
          created_at: string
          id: string
          specialties: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["immo_verification_status"]
          zones: string[] | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
          zones?: string[] | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
          zones?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_appointments: {
        Row: {
          agent_id: string | null
          appointment_status: Database["public"]["Enums"]["immo_appointment_status"]
          created_at: string
          id: string
          location: string | null
          notes: string | null
          property_id: string
          requester_user_id: string
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          appointment_status?: Database["public"]["Enums"]["immo_appointment_status"]
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          property_id: string
          requester_user_id: string
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          appointment_status?: Database["public"]["Enums"]["immo_appointment_status"]
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          property_id?: string
          requester_user_id?: string
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "immo_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_appointments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_commissions: {
        Row: {
          agent_id: string | null
          amount: number
          business_id: string
          commission_status: Database["public"]["Enums"]["immo_commission_status"]
          created_at: string
          currency_id: string | null
          id: string
          lease_id: string | null
          property_id: string | null
          reservation_id: string | null
        }
        Insert: {
          agent_id?: string | null
          amount: number
          business_id: string
          commission_status?: Database["public"]["Enums"]["immo_commission_status"]
          created_at?: string
          currency_id?: string | null
          id?: string
          lease_id?: string | null
          property_id?: string | null
          reservation_id?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number
          business_id?: string
          commission_status?: Database["public"]["Enums"]["immo_commission_status"]
          created_at?: string
          currency_id?: string | null
          id?: string
          lease_id?: string | null
          property_id?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "immo_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_commissions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_commissions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "immo_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_commissions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "immo_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_construction_briefs: {
        Row: {
          assigned_professional_user_id: string | null
          brief: Json
          brief_status: string
          created_at: string
          id: string
          parcel_area: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_professional_user_id?: string | null
          brief?: Json
          brief_status?: string
          created_at?: string
          id?: string
          parcel_area?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_professional_user_id?: string | null
          brief?: Json
          brief_status?: string
          created_at?: string
          id?: string
          parcel_area?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      immo_developers: {
        Row: {
          business_id: string
          created_at: string
          id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["immo_verification_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "immo_developers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_url: string
          id: string
          is_public: boolean
          lease_id: string | null
          name: string
          property_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          lease_id?: string | null
          name: string
          property_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          lease_id?: string | null
          name?: string
          property_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "immo_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_favorites: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          property_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          property_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          property_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "immo_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_lease_events: {
        Row: {
          created_at: string
          created_by: string
          details: Json
          document_id: string | null
          event_at: string
          event_type: string
          id: string
          lease_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          details?: Json
          document_id?: string | null
          event_at?: string
          event_type: string
          id?: string
          lease_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          details?: Json
          document_id?: string | null
          event_at?: string
          event_type?: string
          id?: string
          lease_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_lease_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "immo_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_lease_events_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "immo_leases"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_leases: {
        Row: {
          created_at: string
          currency_id: string | null
          deposit_amount: number | null
          end_date: string | null
          frequency: string
          id: string
          landlord_business_id: string | null
          landlord_user_id: string | null
          lease_status: Database["public"]["Enums"]["immo_lease_status"]
          property_id: string
          rent_amount: number
          start_date: string
          tenant_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          deposit_amount?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          landlord_business_id?: string | null
          landlord_user_id?: string | null
          lease_status?: Database["public"]["Enums"]["immo_lease_status"]
          property_id: string
          rent_amount: number
          start_date: string
          tenant_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          deposit_amount?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          landlord_business_id?: string | null
          landlord_user_id?: string | null
          lease_status?: Database["public"]["Enums"]["immo_lease_status"]
          property_id?: string
          rent_amount?: number
          start_date?: string
          tenant_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_leases_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_leases_landlord_business_id_fkey"
            columns: ["landlord_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_maintenance_interventions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          evidence: Json
          id: string
          provider_business_id: string | null
          quote_id: string | null
          report: string | null
          request_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          evidence?: Json
          id?: string
          provider_business_id?: string | null
          quote_id?: string | null
          report?: string | null
          request_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          evidence?: Json
          id?: string
          provider_business_id?: string | null
          quote_id?: string | null
          report?: string | null
          request_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_maintenance_interventions_provider_business_id_fkey"
            columns: ["provider_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_interventions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "immo_maintenance_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_interventions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "immo_maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_maintenance_invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency_id: string | null
          document_id: string | null
          due_date: string | null
          id: string
          intervention_id: string | null
          invoice_number: string | null
          paid_at: string | null
          provider_business_id: string | null
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          currency_id?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          intervention_id?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          provider_business_id?: string | null
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency_id?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          intervention_id?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          provider_business_id?: string | null
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_maintenance_invoices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "immo_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_invoices_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "immo_maintenance_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_invoices_provider_business_id_fkey"
            columns: ["provider_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_invoices_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "immo_maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_maintenance_quotes: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          currency_id: string | null
          description: string | null
          id: string
          provider_business_id: string | null
          request_id: string
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          provider_business_id?: string | null
          request_id: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          provider_business_id?: string | null
          request_id?: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_maintenance_quotes_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_quotes_provider_business_id_fkey"
            columns: ["provider_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "immo_maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_maintenance_requests: {
        Row: {
          assigned_agent_id: string | null
          assigned_provider_business_id: string | null
          completed_at: string | null
          created_at: string
          description: string
          id: string
          media: Json
          priority: string
          property_id: string
          reported_at: string
          reported_by: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          assigned_provider_business_id?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          media?: Json
          priority?: string
          property_id: string
          reported_at?: string
          reported_by?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          assigned_provider_business_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          media?: Json
          priority?: string
          property_id?: string
          reported_at?: string
          reported_by?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_maintenance_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "immo_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_requests_assigned_provider_business_id_fkey"
            columns: ["assigned_provider_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_offers: {
        Row: {
          agent_id: string | null
          amount: number
          buyer_user_id: string
          conditions: string | null
          created_at: string
          currency_id: string | null
          expires_at: string | null
          id: string
          offer_status: Database["public"]["Enums"]["immo_offer_status"]
          property_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          buyer_user_id: string
          conditions?: string | null
          created_at?: string
          currency_id?: string | null
          expires_at?: string | null
          id?: string
          offer_status?: Database["public"]["Enums"]["immo_offer_status"]
          property_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          buyer_user_id?: string
          conditions?: string | null
          created_at?: string
          currency_id?: string | null
          expires_at?: string | null
          id?: string
          offer_status?: Database["public"]["Enums"]["immo_offer_status"]
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_offers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "immo_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_offers_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_project_cost_items: {
        Row: {
          business_id: string
          committed_amount: number
          created_at: string
          created_by: string
          currency_id: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_document_id: string | null
          planned_amount: number
          project_id: string
          status: string
          title: string
          updated_at: string
          vendor_business_id: string | null
        }
        Insert: {
          business_id: string
          committed_amount?: number
          created_at?: string
          created_by?: string
          currency_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_document_id?: string | null
          planned_amount?: number
          project_id: string
          status?: string
          title: string
          updated_at?: string
          vendor_business_id?: string | null
        }
        Update: {
          business_id?: string
          committed_amount?: number
          created_at?: string
          created_by?: string
          currency_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_document_id?: string | null
          planned_amount?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          vendor_business_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_project_cost_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_project_cost_items_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_project_cost_items_invoice_document_id_fkey"
            columns: ["invoice_document_id"]
            isOneToOne: false
            referencedRelation: "immo_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_project_cost_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "immo_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_project_cost_items_vendor_business_id_fkey"
            columns: ["vendor_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_project_cost_payments: {
        Row: {
          amount: number
          confirmed_by: string | null
          cost_item_id: string
          created_at: string
          created_by: string
          currency_id: string | null
          id: string
          paid_at: string | null
          payment_reference: string | null
          payment_status: string
        }
        Insert: {
          amount: number
          confirmed_by?: string | null
          cost_item_id: string
          created_at?: string
          created_by?: string
          currency_id?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: string
        }
        Update: {
          amount?: number
          confirmed_by?: string | null
          cost_item_id?: string
          created_at?: string
          created_by?: string
          currency_id?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_project_cost_payments_cost_item_id_fkey"
            columns: ["cost_item_id"]
            isOneToOne: false
            referencedRelation: "immo_project_cost_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_project_cost_payments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_project_media: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          media_type: string
          project_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          project_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          project_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "immo_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_projects: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          country_id: string | null
          created_at: string
          currency_id: string | null
          description: string | null
          estimated_delivery_date: string | null
          id: string
          latitude: number | null
          launch_date: string | null
          longitude: number | null
          name: string
          price_from: number | null
          project_status: Database["public"]["Enums"]["immo_project_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          estimated_delivery_date?: string | null
          id?: string
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name: string
          price_from?: number | null
          project_status?: Database["public"]["Enums"]["immo_project_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          estimated_delivery_date?: string | null
          id?: string
          latitude?: number | null
          launch_date?: string | null
          longitude?: number | null
          name?: string
          price_from?: number | null
          project_status?: Database["public"]["Enums"]["immo_project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_projects_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_projects_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_properties: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          business_id: string | null
          city: string | null
          country_id: string | null
          created_at: string
          currency_id: string | null
          description: string | null
          district: string | null
          furnished: boolean
          hide_exact_address: boolean
          id: string
          land_surface: number | null
          latitude: number | null
          listed_by_agent_id: string | null
          longitude: number | null
          owner_user_id: string | null
          parking_spaces: number | null
          price: number
          property_status: Database["public"]["Enums"]["immo_property_status"]
          property_type_id: string
          published_at: string | null
          slug: string
          surface: number | null
          title: string
          transaction_type: Database["public"]["Enums"]["immo_transaction_type"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["immo_verification_status"]
        }
        Insert: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          district?: string | null
          furnished?: boolean
          hide_exact_address?: boolean
          id?: string
          land_surface?: number | null
          latitude?: number | null
          listed_by_agent_id?: string | null
          longitude?: number | null
          owner_user_id?: string | null
          parking_spaces?: number | null
          price: number
          property_status?: Database["public"]["Enums"]["immo_property_status"]
          property_type_id: string
          published_at?: string | null
          slug: string
          surface?: number | null
          title: string
          transaction_type: Database["public"]["Enums"]["immo_transaction_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Update: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          district?: string | null
          furnished?: boolean
          hide_exact_address?: boolean
          id?: string
          land_surface?: number | null
          latitude?: number | null
          listed_by_agent_id?: string | null
          longitude?: number | null
          owner_user_id?: string | null
          parking_spaces?: number | null
          price?: number
          property_status?: Database["public"]["Enums"]["immo_property_status"]
          property_type_id?: string
          published_at?: string | null
          slug?: string
          surface?: number | null
          title?: string
          transaction_type?: Database["public"]["Enums"]["immo_transaction_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["immo_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "immo_properties_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_properties_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_properties_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_properties_listed_by_agent_id_fkey"
            columns: ["listed_by_agent_id"]
            isOneToOne: false
            referencedRelation: "immo_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_properties_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "immo_property_types"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_property_inspections: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          condition_items: Json
          created_at: string
          created_by: string
          damage_notes: string | null
          id: string
          inspection_type: string
          lease_id: string | null
          performed_at: string | null
          photos: Json
          property_id: string
          report: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          condition_items?: Json
          created_at?: string
          created_by?: string
          damage_notes?: string | null
          id?: string
          inspection_type: string
          lease_id?: string | null
          performed_at?: string | null
          photos?: Json
          property_id: string
          report?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          condition_items?: Json
          created_at?: string
          created_by?: string
          damage_notes?: string | null
          id?: string
          inspection_type?: string
          lease_id?: string | null
          performed_at?: string | null
          photos?: Json
          property_id?: string
          report?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_property_inspections_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "immo_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_property_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_property_media: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          is_public: boolean
          media_type: string
          property_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          media_type?: string
          property_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          media_type?: string
          property_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_property_types: {
        Row: {
          code: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      immo_rent_schedules: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string
          id: string
          lease_id: string
          remaining_amount: number | null
          rent_status: Database["public"]["Enums"]["immo_rent_schedule_status"]
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          created_at?: string
          due_date: string
          id?: string
          lease_id: string
          remaining_amount?: number | null
          rent_status?: Database["public"]["Enums"]["immo_rent_schedule_status"]
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string
          id?: string
          lease_id?: string
          remaining_amount?: number | null
          rent_status?: Database["public"]["Enums"]["immo_rent_schedule_status"]
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_rent_schedules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "immo_leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_rent_schedules_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_reports: {
        Row: {
          agency_business_id: string | null
          created_at: string
          description: string | null
          id: string
          property_id: string | null
          reason: string
          report_status: Database["public"]["Enums"]["immo_report_status"]
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          agency_business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          reason: string
          report_status?: Database["public"]["Enums"]["immo_report_status"]
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          agency_business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          reason?: string
          report_status?: Database["public"]["Enums"]["immo_report_status"]
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_reports_agency_business_id_fkey"
            columns: ["agency_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_requests: {
        Row: {
          assigned_business_id: string | null
          bedrooms: number | null
          budget_max: number | null
          city: string | null
          country_id: string | null
          created_at: string
          criteria: Json
          crm_prospect_id: string | null
          currency_id: string | null
          id: string
          property_id: string | null
          property_type_id: string | null
          request_status: Database["public"]["Enums"]["immo_request_status"]
          requester_user_id: string
          surface_min: number | null
          transaction_type:
            | Database["public"]["Enums"]["immo_transaction_type"]
            | null
          updated_at: string
        }
        Insert: {
          assigned_business_id?: string | null
          bedrooms?: number | null
          budget_max?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          criteria?: Json
          crm_prospect_id?: string | null
          currency_id?: string | null
          id?: string
          property_id?: string | null
          property_type_id?: string | null
          request_status?: Database["public"]["Enums"]["immo_request_status"]
          requester_user_id: string
          surface_min?: number | null
          transaction_type?:
            | Database["public"]["Enums"]["immo_transaction_type"]
            | null
          updated_at?: string
        }
        Update: {
          assigned_business_id?: string | null
          bedrooms?: number | null
          budget_max?: number | null
          city?: string | null
          country_id?: string | null
          created_at?: string
          criteria?: Json
          crm_prospect_id?: string | null
          currency_id?: string | null
          id?: string
          property_id?: string | null
          property_type_id?: string | null
          request_status?: Database["public"]["Enums"]["immo_request_status"]
          requester_user_id?: string
          surface_min?: number | null
          transaction_type?:
            | Database["public"]["Enums"]["immo_transaction_type"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_requests_assigned_business_id_fkey"
            columns: ["assigned_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_requests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_requests_crm_prospect_id_fkey"
            columns: ["crm_prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_requests_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "immo_property_types"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_reservations: {
        Row: {
          amount: number
          client_user_id: string
          created_at: string
          currency_id: string | null
          expires_at: string | null
          id: string
          idempotency_key: string | null
          property_id: string
          reservation_status: Database["public"]["Enums"]["immo_reservation_status"]
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          client_user_id: string
          created_at?: string
          currency_id?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          property_id: string
          reservation_status?: Database["public"]["Enums"]["immo_reservation_status"]
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          client_user_id?: string
          created_at?: string
          currency_id?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          property_id?: string
          reservation_status?: Database["public"]["Enums"]["immo_reservation_status"]
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immo_reservations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_reservations_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      immo_units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency_id: string | null
          id: string
          price: number | null
          project_id: string
          property_id: string | null
          reference: string | null
          surface: number | null
          unit_status: Database["public"]["Enums"]["immo_unit_status"]
          unit_type_id: string | null
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency_id?: string | null
          id?: string
          price?: number | null
          project_id: string
          property_id?: string | null
          reference?: string | null
          surface?: number | null
          unit_status?: Database["public"]["Enums"]["immo_unit_status"]
          unit_type_id?: string | null
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency_id?: string | null
          id?: string
          price?: number | null
          project_id?: string
          property_id?: string | null
          reference?: string | null
          surface?: number | null
          unit_status?: Database["public"]["Enums"]["immo_unit_status"]
          unit_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "immo_units_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "immo_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "immo_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immo_units_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "immo_property_types"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claim_documents: {
        Row: {
          claim_id: string
          created_at: string
          document_type: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          document_type: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          document_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "insurance_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number
          assigned_to: string | null
          claim_number: string
          claim_type: string
          claimed_amount: number
          created_at: string
          currency_id: string | null
          customer_id: string
          description: string
          id: string
          incident_date: string
          paid_amount: number
          policy_id: string
          reported_at: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_amount?: number
          assigned_to?: string | null
          claim_number: string
          claim_type: string
          claimed_amount?: number
          created_at?: string
          currency_id?: string | null
          customer_id: string
          description: string
          id?: string
          incident_date: string
          paid_amount?: number
          policy_id: string
          reported_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number
          assigned_to?: string | null
          claim_number?: string
          claim_type?: string
          claimed_amount?: number
          created_at?: string
          currency_id?: string | null
          customer_id?: string
          description?: string
          id?: string
          incident_date?: string
          paid_amount?: number
          policy_id?: string
          reported_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "insurance_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_commissions: {
        Row: {
          amount: number
          beneficiary_user_id: string | null
          created_at: string
          currency_id: string | null
          id: string
          organization_id: string | null
          policy_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          beneficiary_user_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          organization_id?: string | null
          policy_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary_user_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          organization_id?: string | null
          policy_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_commissions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_commissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_coverages: {
        Row: {
          coverage_code: string
          coverage_limit: number
          created_at: string
          deductible_amount: number
          description: string | null
          id: string
          name: string
          policy_id: string
        }
        Insert: {
          coverage_code: string
          coverage_limit?: number
          created_at?: string
          deductible_amount?: number
          description?: string | null
          id?: string
          name: string
          policy_id: string
        }
        Update: {
          coverage_code?: string
          coverage_limit?: number
          created_at?: string
          deductible_amount?: number
          description?: string | null
          id?: string
          name?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_coverages_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_customers: {
        Row: {
          country_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          identity_reference: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          identity_reference?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          identity_reference?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_customers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_payments: {
        Row: {
          amount: number
          created_at: string
          currency_id: string | null
          customer_id: string
          id: string
          paid_at: string | null
          payment_reference: string
          policy_id: string
          provider_transaction_id: string | null
          schedule_id: string | null
          status: string
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency_id?: string | null
          customer_id: string
          id?: string
          paid_at?: string | null
          payment_reference: string
          policy_id: string
          provider_transaction_id?: string | null
          schedule_id?: string | null
          status?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency_id?: string | null
          customer_id?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string
          policy_id?: string
          provider_transaction_id?: string | null
          schedule_id?: string | null
          status?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_payments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "insurance_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "insurance_premium_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_payments_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          created_at: string
          created_by: string | null
          currency_id: string | null
          customer_id: string
          end_date: string
          id: string
          idempotency_key: string | null
          organization_id: string | null
          payment_reference: string | null
          policy_number: string
          premium_amount: number
          product_id: string
          start_date: string
          status: string
          total_coverage_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency_id?: string | null
          customer_id: string
          end_date: string
          id?: string
          idempotency_key?: string | null
          organization_id?: string | null
          payment_reference?: string | null
          policy_number: string
          premium_amount: number
          product_id: string
          start_date: string
          status?: string
          total_coverage_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency_id?: string | null
          customer_id?: string
          end_date?: string
          id?: string
          idempotency_key?: string | null
          organization_id?: string | null
          payment_reference?: string | null
          policy_number?: string
          premium_amount?: number
          product_id?: string
          start_date?: string
          status?: string
          total_coverage_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "insurance_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "insurance_products"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_premium_schedules: {
        Row: {
          amount: number
          created_at: string
          currency_id: string | null
          due_date: string
          id: string
          paid_at: string | null
          policy_id: string
          status: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency_id?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          policy_id: string
          status?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency_id?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          policy_id?: string
          status?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_premium_schedules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_premium_schedules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_premium_schedules_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_products: {
        Row: {
          base_premium: number
          code: string
          created_at: string
          currency_id: string | null
          description: string | null
          id: string
          insurance_type: string
          is_active: boolean
          name: string
          premium_frequency: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          base_premium?: number
          code: string
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          insurance_type: string
          is_active?: boolean
          name: string
          premium_frequency?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          base_premium?: number
          code?: string
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          insurance_type?: string
          is_active?: boolean
          name?: string
          premium_frequency?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_products_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          country_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          legal_name: string
          organization_id: string | null
          phone: string | null
          registration_number: string | null
          trade_name: string | null
          updated_at: string
          verification_status: string
          website: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name: string
          organization_id?: string | null
          phone?: string | null
          registration_number?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string
          organization_id?: string | null
          phone?: string | null
          registration_number?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdv_service_offerings: {
        Row: {
          base_price: number | null
          business_id: string | null
          category: string
          created_at: string
          currency: string
          description: string
          id: string
          location: string | null
          pricing_mode: string
          provider_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          business_id?: string | null
          category: string
          created_at?: string
          currency?: string
          description: string
          id?: string
          location?: string | null
          pricing_mode?: string
          provider_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          business_id?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          location?: string | null
          pricing_mode?: string
          provider_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jdv_service_offerings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jdv_service_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          offering_id: string
          proposed_price: number | null
          provider_response: string | null
          requested_for: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          offering_id: string
          proposed_price?: number | null
          provider_response?: string | null
          requested_for?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          offering_id?: string
          proposed_price?: number | null
          provider_response?: string | null
          requested_for?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jdv_service_requests_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "jdv_service_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_status: Database["public"]["Enums"]["kyc_status"]
          document_type: string
          file_url: string
          id: string
          kyc_profile_id: string
          notes: string | null
          reviewed_at: string | null
          submitted_at: string
        }
        Insert: {
          created_at?: string
          document_status?: Database["public"]["Enums"]["kyc_status"]
          document_type: string
          file_url: string
          id?: string
          kyc_profile_id: string
          notes?: string | null
          reviewed_at?: string | null
          submitted_at?: string
        }
        Update: {
          created_at?: string
          document_status?: Database["public"]["Enums"]["kyc_status"]
          document_type?: string
          file_url?: string
          id?: string
          kyc_profile_id?: string
          notes?: string | null
          reviewed_at?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_kyc_profile_id_fkey"
            columns: ["kyc_profile_id"]
            isOneToOne: false
            referencedRelation: "kyc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_profiles: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          kyc_level: Database["public"]["Enums"]["kyc_level"]
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          notes: string | null
          reviewed_by: string | null
          updated_at: string
          user_id: string
          verification_date: string | null
          verification_provider: string | null
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          kyc_level?: Database["public"]["Enums"]["kyc_level"]
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          notes?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id: string
          verification_date?: string | null
          verification_provider?: string | null
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          kyc_level?: Database["public"]["Enums"]["kyc_level"]
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          notes?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id?: string
          verification_date?: string | null
          verification_provider?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          direction: Database["public"]["Enums"]["lang_direction"]
          id: string
          is_active: boolean
          name: string
          native_name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          direction?: Database["public"]["Enums"]["lang_direction"]
          id?: string
          is_active?: boolean
          name: string
          native_name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["lang_direction"]
          id?: string
          is_active?: boolean
          name?: string
          native_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country_id: string | null
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country_id?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_addresses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_cart_items: {
        Row: {
          added_at: string | null
          cart_id: string
          currency_id: string | null
          id: string
          listing_id: string
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          cart_id: string
          currency_id?: string | null
          id?: string
          listing_id: string
          quantity?: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          cart_id?: string
          currency_id?: string | null
          id?: string
          listing_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "marketplace_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_carts: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_conversations: {
        Row: {
          buyer_id: string
          buyer_unread_count: number | null
          created_at: string | null
          id: string
          last_message_at: string | null
          listing_id: string | null
          order_id: string | null
          seller_id: string
          seller_unread_count: number | null
        }
        Insert: {
          buyer_id: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          order_id?: string | null
          seller_id: string
          seller_unread_count?: number | null
        }
        Update: {
          buyer_id?: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          order_id?: string | null
          seller_id?: string
          seller_unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          minimum_order: number | null
          seller_id: string | null
          starts_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type?: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_order?: number | null
          seller_id?: string | null
          starts_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_order?: number | null
          seller_id?: string | null
          starts_at?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
          seller_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listing_media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          listing_id: string
          media_type: string | null
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          listing_id: string
          media_type?: string | null
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          listing_id?: string
          media_type?: string | null
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          allow_backorder: boolean | null
          attributes: Json | null
          business_product_id: string | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string | null
          currency_id: string | null
          description: string | null
          id: string
          is_digital: boolean | null
          is_featured: boolean | null
          listing_status:
            | Database["public"]["Enums"]["marketplace_listing_status"]
            | null
          metadata: Json | null
          price: number
          published_at: string | null
          rating_average: number | null
          rating_count: number | null
          sale_count: number | null
          seller_id: string
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          stock_reserved: number | null
          tags: string[] | null
          title: string
          track_inventory: boolean | null
          updated_at: string | null
          view_count: number | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          allow_backorder?: boolean | null
          attributes?: Json | null
          business_product_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency_id?: string | null
          description?: string | null
          id?: string
          is_digital?: boolean | null
          is_featured?: boolean | null
          listing_status?:
            | Database["public"]["Enums"]["marketplace_listing_status"]
            | null
          metadata?: Json | null
          price: number
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          sale_count?: number | null
          seller_id: string
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          stock_reserved?: number | null
          tags?: string[] | null
          title: string
          track_inventory?: boolean | null
          updated_at?: string | null
          view_count?: number | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          allow_backorder?: boolean | null
          attributes?: Json | null
          business_product_id?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency_id?: string | null
          description?: string | null
          id?: string
          is_digital?: boolean | null
          is_featured?: boolean | null
          listing_status?:
            | Database["public"]["Enums"]["marketplace_listing_status"]
            | null
          metadata?: Json | null
          price?: number
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          sale_count?: number | null
          seller_id?: string
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          stock_reserved?: number | null
          tags?: string[] | null
          title?: string
          track_inventory?: boolean | null
          updated_at?: string | null
          view_count?: number | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_business_product_id_fkey"
            columns: ["business_product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_status:
            | Database["public"]["Enums"]["marketplace_message_status"]
            | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_status?:
            | Database["public"]["Enums"]["marketplace_message_status"]
            | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_status?:
            | Database["public"]["Enums"]["marketplace_message_status"]
            | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "marketplace_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_items: {
        Row: {
          created_at: string | null
          currency_id: string | null
          id: string
          listing_id: string
          listing_snapshot: Json | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          currency_id?: string | null
          id?: string
          listing_id: string
          listing_snapshot?: Json | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          currency_id?: string | null
          id?: string
          listing_id?: string
          listing_snapshot?: Json | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_items_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          buyer_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          commission_amount: number | null
          created_at: string | null
          currency_id: string | null
          delivered_at: string | null
          delivery_address_id: string | null
          discount_amount: number | null
          estimated_delivery: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          notes: string | null
          order_number: string
          order_status:
            | Database["public"]["Enums"]["marketplace_order_status"]
            | null
          payment_reference: string | null
          seller_id: string
          shipping_cost: number | null
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          buyer_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency_id?: string | null
          delivered_at?: string | null
          delivery_address_id?: string | null
          discount_amount?: number | null
          estimated_delivery?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number: string
          order_status?:
            | Database["public"]["Enums"]["marketplace_order_status"]
            | null
          payment_reference?: string | null
          seller_id: string
          shipping_cost?: number | null
          subtotal: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          buyer_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency_id?: string | null
          delivered_at?: string | null
          delivery_address_id?: string | null
          discount_amount?: number | null
          estimated_delivery?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          order_status?:
            | Database["public"]["Enums"]["marketplace_order_status"]
            | null
          payment_reference?: string | null
          seller_id?: string
          shipping_cost?: number | null
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "marketplace_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_price_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          listing_id?: string
          new_price?: number
          old_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_price_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          listing_id: string
          option_values: Json
          price: number | null
          sku: string | null
          stock_quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id: string
          option_values?: Json
          price?: number | null
          sku?: string | null
          stock_quantity?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id?: string
          option_values?: Json
          price?: number | null
          sku?: string | null
          stock_quantity?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_variants_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotions: {
        Row: {
          created_at: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          minimum_order: number | null
          name: string
          seller_id: string
          starts_at: string | null
          used_count: number | null
        }
        Insert: {
          created_at?: string | null
          discount_type?: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_order?: number | null
          name: string
          seller_id: string
          starts_at?: string | null
          used_count?: number | null
        }
        Update: {
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_order?: number | null
          name?: string
          seller_id?: string
          starts_at?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promotions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_refunds: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          currency_id: string | null
          id: string
          order_id: string
          processed_at: string | null
          reason: string | null
          refund_status:
            | Database["public"]["Enums"]["marketplace_refund_status"]
            | null
          return_id: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          currency_id?: string | null
          id?: string
          order_id: string
          processed_at?: string | null
          reason?: string | null
          refund_status?:
            | Database["public"]["Enums"]["marketplace_refund_status"]
            | null
          return_id?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          currency_id?: string | null
          id?: string
          order_id?: string
          processed_at?: string | null
          reason?: string | null
          refund_status?:
            | Database["public"]["Enums"]["marketplace_refund_status"]
            | null
          return_id?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_refunds_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_refunds_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_refunds_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "marketplace_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_refunds_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          listing_id: string | null
          reason: string
          report_status: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          review_id: string | null
          seller_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          report_status?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string | null
          seller_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          report_status?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reports_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_returns: {
        Row: {
          admin_notes: string | null
          buyer_id: string
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          order_id: string
          reason: string
          resolved_at: string | null
          return_status:
            | Database["public"]["Enums"]["marketplace_return_status"]
            | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          buyer_id: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          order_id: string
          reason: string
          resolved_at?: string | null
          return_status?:
            | Database["public"]["Enums"]["marketplace_return_status"]
            | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          order_id?: string
          reason?: string
          resolved_at?: string | null
          return_status?:
            | Database["public"]["Enums"]["marketplace_return_status"]
            | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_returns_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_returns_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          listing_id: string
          order_id: string
          rating: number
          review_status:
            | Database["public"]["Enums"]["marketplace_review_status"]
            | null
          reviewer_id: string
          seller_id: string
          seller_replied_at: string | null
          seller_reply: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          listing_id: string
          order_id: string
          rating: number
          review_status?:
            | Database["public"]["Enums"]["marketplace_review_status"]
            | null
          reviewer_id: string
          seller_id: string
          seller_replied_at?: string | null
          seller_reply?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          listing_id?: string
          order_id?: string
          rating?: number
          review_status?:
            | Database["public"]["Enums"]["marketplace_review_status"]
            | null
          reviewer_id?: string
          seller_id?: string
          seller_replied_at?: string | null
          seller_reply?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sellers: {
        Row: {
          address: string | null
          business_profile_id: string | null
          city: string | null
          commission_rate: number | null
          country_id: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          organization_id: string | null
          phone: string | null
          rating_average: number | null
          rating_count: number | null
          seller_status:
            | Database["public"]["Enums"]["marketplace_seller_status"]
            | null
          shop_name: string
          shop_slug: string
          total_sales: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_profile_id?: string | null
          city?: string | null
          commission_rate?: number | null
          country_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          organization_id?: string | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_status?:
            | Database["public"]["Enums"]["marketplace_seller_status"]
            | null
          shop_name: string
          shop_slug: string
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_profile_id?: string | null
          city?: string | null
          commission_rate?: number | null
          country_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          organization_id?: string | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_status?:
            | Database["public"]["Enums"]["marketplace_seller_status"]
            | null
          shop_name?: string
          shop_slug?: string
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sellers_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sellers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sellers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_settlements: {
        Row: {
          commission_amount: number
          created_at: string | null
          currency_id: string | null
          gross_amount: number
          id: string
          net_amount: number
          notes: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          refund_amount: number | null
          seller_id: string
          settlement_status:
            | Database["public"]["Enums"]["marketplace_settlement_status"]
            | null
          wallet_transaction_id: string | null
        }
        Insert: {
          commission_amount: number
          created_at?: string | null
          currency_id?: string | null
          gross_amount: number
          id?: string
          net_amount: number
          notes?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          refund_amount?: number | null
          seller_id: string
          settlement_status?:
            | Database["public"]["Enums"]["marketplace_settlement_status"]
            | null
          wallet_transaction_id?: string | null
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          currency_id?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          refund_amount?: number | null
          seller_id?: string
          settlement_status?:
            | Database["public"]["Enums"]["marketplace_settlement_status"]
            | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_settlements_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_settlements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_settlements_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_status: string | null
          shipped_at: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_status?: string | null
          shipped_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_status?: string | null
          shipped_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      media_channels: {
        Row: {
          channel_type: string
          created_at: string
          handle: string | null
          id: string
          name: string
          organization_id: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          channel_type: string
          created_at?: string
          handle?: string | null
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          channel_type?: string
          created_at?: string
          handle?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_content_categories: {
        Row: {
          category_id: string
          content_id: string
        }
        Insert: {
          category_id: string
          content_id: string
        }
        Update: {
          category_id?: string
          content_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_content_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_content_categories_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "media_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      media_content_metrics: {
        Row: {
          comments: number
          content_id: string
          id: string
          likes: number
          measured_at: string
          shares: number
          views: number
        }
        Insert: {
          comments?: number
          content_id: string
          id?: string
          likes?: number
          measured_at?: string
          shares?: number
          views?: number
        }
        Update: {
          comments?: number
          content_id?: string
          id?: string
          likes?: number
          measured_at?: string
          shares?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_content_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "media_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      media_contents: {
        Row: {
          author_user_id: string | null
          body: string | null
          channel_id: string
          content_type: string
          created_at: string
          id: string
          media_url: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body?: string | null
          channel_id: string
          content_type: string
          created_at?: string
          id?: string
          media_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string | null
          channel_id?: string
          content_type?: string
          created_at?: string
          id?: string
          media_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_contents_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_public: boolean
          module_status: Database["public"]["Enums"]["module_status"]
          name: string
          requires_subscription: boolean
          sort_order: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          module_status?: Database["public"]["Enums"]["module_status"]
          name: string
          requires_subscription?: boolean
          sort_order?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          module_status?: Database["public"]["Enums"]["module_status"]
          name?: string
          requires_subscription?: boolean
          sort_order?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          channel: string
          created_at: string
          data: Json
          id: string
          message: string | null
          notification_type: string
          organization_id: string | null
          read_at: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          notification_type: string
          organization_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          notification_type?: string
          organization_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          notification_type: string
          push: boolean
          sms: boolean
          updated_at: string
          user_id: string
          whatsapp: boolean
        }
        Insert: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id: string
          whatsapp?: boolean
        }
        Update: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type?: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id?: string
          whatsapp?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          organization_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          organization_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          organization_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_status: Database["public"]["Enums"]["invitation_status"]
          invited_by: string | null
          organization_id: string
          role_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          organization_id: string
          role_id?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_by?: string | null
          organization_id?: string
          role_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          member_status: Database["public"]["Enums"]["org_member_status"]
          organization_id: string
          role_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          member_status?: Database["public"]["Enums"]["org_member_status"]
          organization_id: string
          role_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          member_status?: Database["public"]["Enums"]["org_member_status"]
          organization_id?: string
          role_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_personalization: {
        Row: {
          accent_color: string | null
          company_slogan: string | null
          created_at: string
          dashboard_background_url: string | null
          favicon_url: string | null
          id: string
          login_background_url: string | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          company_slogan?: string | null
          created_at?: string
          dashboard_background_url?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          company_slogan?: string | null
          created_at?: string
          dashboard_background_url?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_personalization_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          auto_renew: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          module_code: string
          organization_id: string | null
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          module_code: string
          organization_id?: string | null
          plan_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          module_code?: string
          organization_id?: string | null
          plan_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_id: string | null
          created_at: string
          default_currency_id: string | null
          default_language_id: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          org_status: Database["public"]["Enums"]["account_status"]
          org_type: string | null
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          default_currency_id?: string | null
          default_language_id?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          org_status?: Database["public"]["Enums"]["account_status"]
          org_type?: string | null
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          default_currency_id?: string | null
          default_language_id?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          org_status?: Database["public"]["Enums"]["account_status"]
          org_type?: string | null
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_default_currency_id_fkey"
            columns: ["default_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_default_language_id_fkey"
            columns: ["default_language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_beneficiaries: {
        Row: {
          account_reference: string | null
          beneficiary_type: Database["public"]["Enums"]["beneficiary_type"]
          country_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          owner_user_id: string
          phone: string | null
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          account_reference?: string | null
          beneficiary_type?: Database["public"]["Enums"]["beneficiary_type"]
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          owner_user_id: string
          phone?: string | null
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          account_reference?: string | null
          beneficiary_type?: Database["public"]["Enums"]["beneficiary_type"]
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          owner_user_id?: string
          phone?: string | null
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_beneficiaries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_beneficiaries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_beneficiaries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_default: boolean
          masked_identifier: string | null
          metadata: Json | null
          method_type: string
          provider_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          masked_identifier?: string | null
          metadata?: Json | null
          method_type: string
          provider_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          masked_identifier?: string | null
          metadata?: Json | null
          method_type?: string
          provider_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_accounts: {
        Row: {
          created_at: string
          environment: string
          id: string
          last_verified_at: string | null
          organization_id: string
          provider: string
          public_key: string | null
          secret_key_encrypted: string | null
          status: string
          updated_at: string
          webhook_secret_encrypted: string | null
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          last_verified_at?: string | null
          organization_id: string
          provider: string
          public_key?: string | null
          secret_key_encrypted?: string | null
          status?: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          last_verified_at?: string | null
          organization_id?: string
          provider?: string
          public_key?: string | null
          secret_key_encrypted?: string | null
          status?: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string | null
          provider_reference: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
          provider_reference?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_routes: {
        Row: {
          created_at: string
          destination_country_id: string | null
          destination_currency_id: string | null
          estimated_delay_minutes: number | null
          id: string
          is_active: boolean
          provider_id: string
          source_country_id: string | null
          source_currency_id: string | null
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_country_id?: string | null
          destination_currency_id?: string | null
          estimated_delay_minutes?: number | null
          id?: string
          is_active?: boolean
          provider_id: string
          source_country_id?: string | null
          source_currency_id?: string | null
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_country_id?: string | null
          destination_currency_id?: string | null
          estimated_delay_minutes?: number | null
          id?: string
          is_active?: boolean
          provider_id?: string
          source_country_id?: string | null
          source_currency_id?: string | null
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_routes_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_routes_destination_currency_id_fkey"
            columns: ["destination_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_routes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_routes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_routes_source_country_id_fkey"
            columns: ["source_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_routes_source_currency_id_fkey"
            columns: ["source_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          code: string
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          provider_type: string
          supported_countries: Json | null
          supported_currencies: Json | null
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider_type: string
          supported_countries?: Json | null
          supported_currencies?: Json | null
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider_type?: string
          supported_countries?: Json | null
          supported_currencies?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          notes: string | null
          organization_id: string
          payment_id: string
          provider: string | null
          provider_reference: string | null
          refund_date: string
          sale_return_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id: string
          payment_id: string
          provider?: string | null
          provider_reference?: string | null
          refund_date?: string
          sale_return_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id?: string
          payment_id?: string
          provider?: string | null
          provider_reference?: string | null
          refund_date?: string
          sale_return_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_returns_traceability_v1"
            referencedColumns: ["return_id"]
          },
          {
            foreignKeyName: "payment_refunds_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number | null
          created_at: string
          currency_id: string | null
          description: string | null
          expires_at: string | null
          id: string
          paid_by_user_id: string | null
          paid_transaction_id: string | null
          reference: string | null
          request_status: Database["public"]["Enums"]["payment_request_status"]
          requester_user_id: string
          requester_wallet_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          paid_by_user_id?: string | null
          paid_transaction_id?: string | null
          reference?: string | null
          request_status?: Database["public"]["Enums"]["payment_request_status"]
          requester_user_id: string
          requester_wallet_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          paid_by_user_id?: string | null
          paid_transaction_id?: string | null
          reference?: string | null
          request_status?: Database["public"]["Enums"]["payment_request_status"]
          requester_user_id?: string
          requester_wallet_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_paid_transaction_id_fkey"
            columns: ["paid_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_requester_wallet_id_fkey"
            columns: ["requester_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          created_at: string
          due_date: string
          expected_amount: number
          id: string
          installment_number: number
          organization_id: string
          paid_amount: number
          paid_at: string | null
          reminder_sent: boolean
          sale_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          expected_amount: number
          id?: string
          installment_number: number
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          reminder_sent?: boolean
          sale_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          expected_amount?: number
          id?: string
          installment_number?: number
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          reminder_sent?: boolean
          sale_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_subscriptions: {
        Row: {
          amount: number
          biller_id: string | null
          created_at: string
          currency_id: string
          description: string | null
          frequency: Database["public"]["Enums"]["subscription_frequency"]
          id: string
          metadata: Json | null
          name: string
          next_billing_date: string
          payment_method_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          biller_id?: string | null
          created_at?: string
          currency_id: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          metadata?: Json | null
          name: string
          next_billing_date: string
          payment_method_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          biller_id?: string | null
          created_at?: string
          currency_id?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          metadata?: Json | null
          name?: string
          next_billing_date?: string
          payment_method_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_subscriptions_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "billers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_subscriptions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_subscriptions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          external_event_id: string | null
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          id: string
          merchant_reference: string | null
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          prospecteur_id: string | null
          provider: string | null
          provider_reference: string | null
          provider_transaction_id: string | null
          recorded_by: string | null
          sale_id: string | null
          schedule_id: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_reference?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          prospecteur_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string | null
          recorded_by?: string | null
          sale_id?: string | null
          schedule_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_reference?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          prospecteur_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string | null
          recorded_by?: string | null
          sale_id?: string | null
          schedule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module_code: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module_code?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module_code?: string | null
          name?: string
        }
        Relationships: []
      }
      platform_reviews: {
        Row: {
          comment: string | null
          created_at: string
          display_name: string
          id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          display_name: string
          id?: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          display_name?: string
          id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          country_id: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean
          phone: string | null
          preferred_currency_id: string | null
          preferred_language_id: string | null
          timezone: string | null
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency_id?: string | null
          preferred_language_id?: string | null
          timezone?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          preferred_currency_id?: string | null
          preferred_language_id?: string | null
          timezone?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_currency_id_fkey"
            columns: ["preferred_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_language_id_fkey"
            columns: ["preferred_language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          created_by: string | null
          id: string
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id: string | null
          result: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id?: string | null
          result?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string
          prospect_id: string
          prospecteur_id: string
          released_at: string | null
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id: string
          prospect_id: string
          prospecteur_id: string
          released_at?: string | null
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_followups: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id: string | null
          reminder_sent: boolean
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id?: string | null
          reminder_sent?: boolean
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string | null
          reminder_sent?: boolean
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          organization_id: string
          prospect_id: string
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id: string
          prospect_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id?: string
          prospect_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_status_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_stocks: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          prospecteur_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          prospecteur_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          prospecteur_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_warehouse_assignments: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          created_by: string | null
          department: string | null
          id: string
          is_primary: boolean
          organization_id: string
          prospecteur_id: string
          updated_at: string
          warehouse_id: string
          work_zone: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          is_primary?: boolean
          organization_id: string
          prospecteur_id: string
          updated_at?: string
          warehouse_id: string
          work_zone?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string
          prospecteur_id?: string
          updated_at?: string
          warehouse_id?: string
          work_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_warehouse_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_warehouse_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_warehouse_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteurs: {
        Row: {
          address: string | null
          city: string | null
          code: string
          commission_rate: number | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          hired_at: string | null
          id: string
          last_name: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          hired_at?: string | null
          id?: string
          last_name?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          hired_at?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteurs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address: string | null
          archived_at: string | null
          category: string | null
          city: string | null
          client_id: string | null
          created_at: string
          desired_article: string | null
          desired_article_id: string | null
          duplicate_phone_flag: boolean | null
          duplicate_phone_of: string | null
          estimated_amount: number | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_follow_up_at: string | null
          last_name: string | null
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          portfolio_id: string | null
          prospecteur_id: string | null
          purchase_date_planned: string | null
          status: string
          temperature: string | null
          updated_at: string
          visit_count: number
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          category?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          estimated_amount?: number | null
          first_name: string
          id?: string
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          purchase_date_planned?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          visit_count?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          category?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          estimated_amount?: number | null
          first_name?: string
          id?: string
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          purchase_date_planned?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          visit_count?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "client_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_advertisers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          legal_name: string
          organization_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          legal_name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          legal_name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pub_advertisers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_campaign_placements: {
        Row: {
          campaign_id: string
          ends_at: string
          id: string
          placement_id: string
          starts_at: string
          status: string
        }
        Insert: {
          campaign_id: string
          ends_at: string
          id?: string
          placement_id: string
          starts_at: string
          status?: string
        }
        Update: {
          campaign_id?: string
          ends_at?: string
          id?: string
          placement_id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_campaign_placements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pub_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_campaign_placements_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "pub_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_campaigns: {
        Row: {
          advertiser_id: string
          ai_assisted: boolean
          brand_name: string | null
          budget_amount: number
          call_to_action: string | null
          created_at: string
          currency_id: string | null
          destination_url: string | null
          ends_at: string | null
          format: string
          headline: string | null
          id: string
          message: string | null
          name: string
          objective: string | null
          pricing_model: string
          starts_at: string | null
          status: string
          submitted_at: string | null
          targeting: Json
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          ai_assisted?: boolean
          brand_name?: string | null
          budget_amount?: number
          call_to_action?: string | null
          created_at?: string
          currency_id?: string | null
          destination_url?: string | null
          ends_at?: string | null
          format?: string
          headline?: string | null
          id?: string
          message?: string | null
          name: string
          objective?: string | null
          pricing_model?: string
          starts_at?: string | null
          status?: string
          submitted_at?: string | null
          targeting?: Json
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          ai_assisted?: boolean
          brand_name?: string | null
          budget_amount?: number
          call_to_action?: string | null
          created_at?: string
          currency_id?: string | null
          destination_url?: string | null
          ends_at?: string | null
          format?: string
          headline?: string | null
          id?: string
          message?: string | null
          name?: string
          objective?: string | null
          pricing_model?: string
          starts_at?: string | null
          status?: string
          submitted_at?: string | null
          targeting?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "pub_advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_campaigns_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_creatives: {
        Row: {
          alt_text: string | null
          approval_status: string
          body: string | null
          campaign_id: string
          click_url: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          format: string | null
          headline: string | null
          id: string
          media_type: string
          media_url: string
          metadata: Json
          mime_type: string | null
          storage_path: string | null
          title: string | null
        }
        Insert: {
          alt_text?: string | null
          approval_status?: string
          body?: string | null
          campaign_id: string
          click_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          headline?: string | null
          id?: string
          media_type: string
          media_url: string
          metadata?: Json
          mime_type?: string | null
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          alt_text?: string | null
          approval_status?: string
          body?: string | null
          campaign_id?: string
          click_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          headline?: string | null
          id?: string
          media_type?: string
          media_url?: string
          metadata?: Json
          mime_type?: string | null
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pub_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pub_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_impressions: {
        Row: {
          campaign_id: string
          click_count: number
          creative_id: string | null
          id: string
          occurred_at: string
          placement_id: string | null
          viewer_hash: string | null
        }
        Insert: {
          campaign_id: string
          click_count?: number
          creative_id?: string | null
          id?: string
          occurred_at?: string
          placement_id?: string | null
          viewer_hash?: string | null
        }
        Update: {
          campaign_id?: string
          click_count?: number
          creative_id?: string | null
          id?: string
          occurred_at?: string
          placement_id?: string | null
          viewer_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pub_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pub_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "pub_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_impressions_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "pub_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_partners: {
        Row: {
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          notes: string | null
          organization_id: string | null
          payout_currency_id: string | null
          status: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          payout_currency_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          payout_currency_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pub_partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_partners_payout_currency_id_fkey"
            columns: ["payout_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_placements: {
        Row: {
          created_at: string
          currency_id: string | null
          id: string
          inventory_notes: string | null
          is_active: boolean
          location_code: string | null
          max_daily_clicks: number | null
          max_daily_impressions: number | null
          name: string
          partner_id: string | null
          placement_type: string
          price_per_day: number | null
          supported_formats: string[]
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          id?: string
          inventory_notes?: string | null
          is_active?: boolean
          location_code?: string | null
          max_daily_clicks?: number | null
          max_daily_impressions?: number | null
          name: string
          partner_id?: string | null
          placement_type: string
          price_per_day?: number | null
          supported_formats?: string[]
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          id?: string
          inventory_notes?: string | null
          is_active?: boolean
          location_code?: string | null
          max_daily_clicks?: number | null
          max_daily_impressions?: number | null
          name?: string
          partner_id?: string | null
          placement_type?: string
          price_per_day?: number | null
          supported_formats?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "pub_placements_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_placements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pub_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_pricing_rules: {
        Row: {
          billing_model: string
          campaign_type: string
          created_at: string
          created_by: string | null
          currency_id: string | null
          description: string | null
          duration_days: number | null
          id: string
          included_clicks: number | null
          included_impressions: number | null
          is_active: boolean
          max_daily_spend: number | null
          name: string
          placement_id: string | null
          requires_manual_approval: boolean
          unit_price: number
          updated_at: string
        }
        Insert: {
          billing_model: string
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          included_clicks?: number | null
          included_impressions?: number | null
          is_active?: boolean
          max_daily_spend?: number | null
          name: string
          placement_id?: string | null
          requires_manual_approval?: boolean
          unit_price?: number
          updated_at?: string
        }
        Update: {
          billing_model?: string
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          included_clicks?: number | null
          included_impressions?: number | null
          is_active?: boolean
          max_daily_spend?: number | null
          name?: string
          placement_id?: string | null
          requires_manual_approval?: boolean
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_pricing_rules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pub_pricing_rules_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "pub_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          article_id: string
          created_at: string
          discount_amount: number
          id: string
          organization_id: string
          purchase_order_id: string
          quantity: number
          tax_amount: number
          total_amount: number
          unit_cost: number
        }
        Insert: {
          article_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          organization_id: string
          purchase_order_id: string
          quantity: number
          tax_amount?: number
          total_amount?: number
          unit_cost?: number
        }
        Update: {
          article_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          organization_id?: string
          purchase_order_id?: string
          quantity?: number
          tax_amount?: number
          total_amount?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          article_id: string
          created_at: string
          discount_amount: number
          id: string
          line_total: number
          organization_id: string
          quantity: number
          sale_id: string
          unit_cash_price: number | null
          unit_credit_price: number | null
          unit_fixed_price: number | null
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          organization_id: string
          quantity?: number
          sale_id: string
          unit_cash_price?: number | null
          unit_credit_price?: number | null
          unit_fixed_price?: number | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          organization_id?: string
          quantity?: number
          sale_id?: string
          unit_cash_price?: number | null
          unit_credit_price?: number | null
          unit_fixed_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          amount_remaining: number
          article_id: string | null
          cash_price: number
          client_id: string | null
          client_location: string | null
          client_phone: string | null
          completed_at: string | null
          created_at: string
          credit_price: number
          deadline_date: string | null
          fixed_price: number
          id: string
          notes: string | null
          organization_id: string
          payment_amount: number
          payment_frequency: string | null
          prospecteur_id: string | null
          quantity: number
          sale_date: string
          sale_number: string
          sale_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          amount_remaining?: number
          article_id?: string | null
          cash_price?: number
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          credit_price?: number
          deadline_date?: string | null
          fixed_price?: number
          id?: string
          notes?: string | null
          organization_id: string
          payment_amount?: number
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number
          sale_date?: string
          sale_number: string
          sale_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          amount_remaining?: number
          article_id?: string | null
          cash_price?: number
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          credit_price?: number
          deadline_date?: string | null
          fixed_price?: number
          id?: string
          notes?: string | null
          organization_id?: string
          payment_amount?: number
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number
          sale_date?: string
          sale_number?: string
          sale_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          article_code_snapshot: string | null
          article_id: string
          article_name_snapshot: string | null
          created_at: string
          id: string
          organization_id: string
          quantity: number
          refund_amount: number
          return_id: string
          serial_number_id: string | null
        }
        Insert: {
          article_code_snapshot?: string | null
          article_id: string
          article_name_snapshot?: string | null
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          refund_amount?: number
          return_id: string
          serial_number_id?: string | null
        }
        Update: {
          article_code_snapshot?: string | null
          article_id?: string
          article_name_snapshot?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          refund_amount?: number
          return_id?: string
          serial_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_returns_traceability_v1"
            referencedColumns: ["return_id"]
          },
          {
            foreignKeyName: "sales_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          reason: string | null
          received_at: string | null
          received_by_user_id: string | null
          refund_amount: number
          return_date: string
          return_number: string
          returned_by_name: string | null
          returned_by_role: string | null
          returned_by_user_id: string | null
          sale_id: string
          status: string
          subwarehouse_id: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          received_at?: string | null
          received_by_user_id?: string | null
          refund_amount?: number
          return_date?: string
          return_number: string
          returned_by_name?: string | null
          returned_by_role?: string | null
          returned_by_user_id?: string | null
          sale_id: string
          status?: string
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          received_at?: string | null
          received_by_user_id?: string | null
          refund_amount?: number
          return_date?: string
          return_number?: string
          returned_by_name?: string | null
          returned_by_role?: string | null
          returned_by_user_id?: string | null
          sale_id?: string
          status?: string
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          article_id: string
          client_id: string | null
          created_at: string
          id: string
          organization_id: string
          purchase_order_id: string | null
          sale_id: string | null
          serial_number: string
          status: string
          updated_at: string
        }
        Insert: {
          article_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          purchase_order_id?: string | null
          sale_id?: string | null
          serial_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          purchase_order_id?: string | null
          sale_id?: string | null
          serial_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      social_app_preferences: {
        Row: {
          app_key: string
          category: string
          created_at: string
          id: string
          is_added: boolean
          is_visible: boolean
          notifications_enabled: boolean
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          app_key: string
          category?: string
          created_at?: string
          id?: string
          is_added?: boolean
          is_visible?: boolean
          notifications_enabled?: boolean
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          app_key?: string
          category?: string
          created_at?: string
          id?: string
          is_added?: boolean
          is_visible?: boolean
          notifications_enabled?: boolean
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      social_event_registrations: {
        Row: {
          event_id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "social_events"
            referencedColumns: ["id"]
          },
        ]
      }
      social_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          group_id: string | null
          id: string
          location: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          group_id?: string | null
          id?: string
          location?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          group_id?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      social_external_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          label: string | null
          platform: string
          profile_url: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          label?: string | null
          platform: string
          profile_url: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          label?: string | null
          platform?: string
          profile_url?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      social_follows: {
        Row: {
          created_at: string
          follower_user_id: string
          following_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          follower_user_id: string
          following_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          follower_user_id?: string
          following_user_id?: string
          status?: string
        }
        Relationships: []
      }
      social_group_memberships: {
        Row: {
          group_id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      social_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      social_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "social_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          author_user_id: string
          body: string | null
          created_at: string
          id: string
          media_url: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          body?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          body?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      social_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          profile_status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      social_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          article_id: string
          created_at: string
          created_by: string | null
          destination_location: string | null
          destination_subwarehouse_id: string | null
          id: string
          movement_type: string
          notes: string | null
          organization_id: string
          prospecteur_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          source_location: string | null
          source_subwarehouse_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          destination_subwarehouse_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          organization_id: string
          prospecteur_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          source_location?: string | null
          source_subwarehouse_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          destination_subwarehouse_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          prospecteur_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          source_location?: string | null
          source_subwarehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_destination_subwarehouse_id_fkey"
            columns: ["destination_subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_source_subwarehouse_id_fkey"
            columns: ["source_subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          received_quantity: number
          transfer_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          received_quantity?: number
          transfer_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          received_quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          destination_warehouse_id: string
          id: string
          notes: string | null
          organization_id: string
          received_by: string | null
          source_warehouse_id: string
          status: string
          transfer_date: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id: string
          id?: string
          notes?: string | null
          organization_id: string
          received_by?: string | null
          source_warehouse_id: string
          status?: string
          transfer_date?: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          received_by?: string | null
          source_warehouse_id?: string
          status?: string
          transfer_date?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          metadata: Json
          module_code: string | null
          organization_id: string | null
          provider: string | null
          provider_reference: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json
          module_code?: string | null
          organization_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          module_code?: string | null
          organization_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_limits: {
        Row: {
          created_at: string
          id: string
          limit_value: number | null
          plan_id: string
          resource_code: string
          unlimited: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          limit_value?: number | null
          plan_id: string
          resource_code: string
          unlimited?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          limit_value?: number | null
          plan_id?: string
          resource_code?: string
          unlimited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subscription_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          checkout_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string | null
          paid_at: string | null
          payment_method: string | null
          plan_id: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          checkout_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          checkout_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "billing_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          billing_amount_xof: number | null
          code: string
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          features: Json
          highlights: Json
          id: string
          is_featured: boolean
          max_admins: number | null
          max_clients: number | null
          max_prospecteurs: number | null
          module_code: string
          name: string
          price: number
          sort_order: number
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_amount_xof?: number | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days: number
          features?: Json
          highlights?: Json
          id?: string
          is_featured?: boolean
          max_admins?: number | null
          max_clients?: number | null
          max_prospecteurs?: number | null
          module_code: string
          name: string
          price?: number
          sort_order?: number
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_amount_xof?: number | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          highlights?: Json
          id?: string
          is_featured?: boolean
          max_admins?: number | null
          max_clients?: number | null
          max_prospecteurs?: number | null
          module_code?: string
          name?: string
          price?: number
          sort_order?: number
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["code"]
          },
        ]
      }
      super_admin_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_code: string
          module_name: string
          subscription_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_code: string
          module_name: string
          subscription_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_code?: string
          module_name?: string
          subscription_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["user_id"]
          },
        ]
      }
      super_admins: {
        Row: {
          admin_status: Database["public"]["Enums"]["super_admin_status"]
          created_at: string
          granted_by: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_status?: Database["public"]["Enums"]["super_admin_status"]
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_status?: Database["public"]["Enums"]["super_admin_status"]
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          purchase_order_id: string | null
          recorded_by: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_name: string
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          phone: string | null
          registration_number: string | null
          status: string
          tax_number: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_name: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: string | null
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Relationships: []
      }
      tontine_classes: {
        Row: {
          code: string
          created_at: string
          description: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      tontine_contribution_schedules: {
        Row: {
          created_at: string
          cycle_id: string
          due_on: string
          expected_amount: number
          id: string
          late_fee_amount: number
          late_marked_at: string | null
          member_id: string
          penalty_paid_amount: number
          penalty_status: string
          period_number: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          due_on: string
          expected_amount: number
          id?: string
          late_fee_amount?: number
          late_marked_at?: string | null
          member_id: string
          penalty_paid_amount?: number
          penalty_status?: string
          period_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          due_on?: string
          expected_amount?: number
          id?: string
          late_fee_amount?: number
          late_marked_at?: string | null
          member_id?: string
          penalty_paid_amount?: number
          penalty_status?: string
          period_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_contribution_schedules_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contribution_schedules_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_contributions: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency_id: string
          external_reference: string | null
          id: string
          member_id: string
          metadata: Json
          paid_at: string
          payment_method: string
          payment_request_id: string | null
          schedule_id: string
          status: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          currency_id: string
          external_reference?: string | null
          id?: string
          member_id: string
          metadata?: Json
          paid_at?: string
          payment_method?: string
          payment_request_id?: string | null
          schedule_id: string
          status?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency_id?: string
          external_reference?: string | null
          id?: string
          member_id?: string
          metadata?: Json
          paid_at?: string
          payment_method?: string
          payment_request_id?: string | null
          schedule_id?: string
          status?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_contributions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tontine_contribution_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: true
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_cycles: {
        Row: {
          created_at: string
          cycle_number: number
          ends_on: string
          id: string
          starts_on: string
          status: string
          tontine_id: string
          total_collected: number
          total_expected: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_number: number
          ends_on: string
          id?: string
          starts_on: string
          status?: string
          tontine_id: string
          total_collected?: number
          total_expected?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_number?: number
          ends_on?: string
          id?: string
          starts_on?: string
          status?: string
          tontine_id?: string
          total_collected?: number
          total_expected?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_cycles_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_documents: {
        Row: {
          created_at: string
          document_kind: string
          file_size_bytes: number | null
          id: string
          mime_type: string
          original_filename: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          tontine_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_kind: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string
          original_filename: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          tontine_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_kind?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          tontine_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_documents_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_financial_reconciliations: {
        Row: {
          actual_amount: number | null
          contribution_id: string | null
          created_at: string
          currency_id: string
          cycle_id: string | null
          difference: number | null
          direction: string
          dispatch_id: string | null
          expected_amount: number
          id: string
          metadata: Json
          payout_id: string | null
          provider_code: string | null
          provider_reference: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_type: string
          source_reference: string | null
          status: string
          tontine_id: string
        }
        Insert: {
          actual_amount?: number | null
          contribution_id?: string | null
          created_at?: string
          currency_id: string
          cycle_id?: string | null
          difference?: number | null
          direction: string
          dispatch_id?: string | null
          expected_amount: number
          id?: string
          metadata?: Json
          payout_id?: string | null
          provider_code?: string | null
          provider_reference?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_type: string
          source_reference?: string | null
          status?: string
          tontine_id: string
        }
        Update: {
          actual_amount?: number | null
          contribution_id?: string | null
          created_at?: string
          currency_id?: string
          cycle_id?: string | null
          difference?: number | null
          direction?: string
          dispatch_id?: string | null
          expected_amount?: number
          id?: string
          metadata?: Json
          payout_id?: string | null
          provider_code?: string | null
          provider_reference?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_type?: string
          source_reference?: string | null
          status?: string
          tontine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_financial_reconciliations_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "tontine_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_financial_reconciliations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_financial_reconciliations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_financial_reconciliations_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "tontine_payout_dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_financial_reconciliations_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "tontine_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_financial_reconciliations_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_join_links: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invited_phone: string | null
          max_uses: number | null
          rules_version: string
          status: string
          token_hash: string
          tontine_id: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invited_phone?: string | null
          max_uses?: number | null
          rules_version?: string
          status?: string
          token_hash: string
          tontine_id: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invited_phone?: string | null
          max_uses?: number | null
          rules_version?: string
          status?: string
          token_hash?: string
          tontine_id?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tontine_join_links_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_accepted_at: string | null
          contract_version: string | null
          contribution_count: number
          created_at: string
          id: string
          identity_confirmation_method: string | null
          identity_confirmed_at: string | null
          joined_at: string | null
          membership_status: string
          role: string
          rules_accepted_at: string | null
          rules_version: string | null
          tontine_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_accepted_at?: string | null
          contract_version?: string | null
          contribution_count?: number
          created_at?: string
          id?: string
          identity_confirmation_method?: string | null
          identity_confirmed_at?: string | null
          joined_at?: string | null
          membership_status?: string
          role?: string
          rules_accepted_at?: string | null
          rules_version?: string | null
          tontine_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_accepted_at?: string | null
          contract_version?: string | null
          contribution_count?: number
          created_at?: string
          id?: string
          identity_confirmation_method?: string | null
          identity_confirmed_at?: string | null
          joined_at?: string | null
          membership_status?: string
          role?: string
          rules_accepted_at?: string | null
          rules_version?: string | null
          tontine_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_members_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_organization_board: {
        Row: {
          created_at: string
          created_by: string
          document_id: string | null
          full_name: string
          function_title: string
          id: string
          phone: string | null
          status: string
          tontine_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          document_id?: string | null
          full_name: string
          function_title: string
          id?: string
          phone?: string | null
          status?: string
          tontine_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          document_id?: string | null
          full_name?: string
          function_title?: string
          id?: string
          phone?: string | null
          status?: string
          tontine_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_organization_board_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_party_verifications: {
        Row: {
          consented_at: string | null
          country_code: string | null
          created_at: string
          full_name: string
          id: string
          identity_document_number_masked: string | null
          identity_document_path: string | null
          identity_document_type: string | null
          identity_status: string
          party_role: string
          phone: string
          phone_status: string
          review_note: string | null
          tontine_id: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          consented_at?: string | null
          country_code?: string | null
          created_at?: string
          full_name: string
          id?: string
          identity_document_number_masked?: string | null
          identity_document_path?: string | null
          identity_document_type?: string | null
          identity_status?: string
          party_role: string
          phone: string
          phone_status?: string
          review_note?: string | null
          tontine_id: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          consented_at?: string | null
          country_code?: string | null
          created_at?: string
          full_name?: string
          id?: string
          identity_document_number_masked?: string | null
          identity_document_path?: string | null
          identity_document_type?: string | null
          identity_status?: string
          party_role?: string
          phone?: string
          phone_status?: string
          review_note?: string | null
          tontine_id?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_party_verifications_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_payout_dispatches: {
        Row: {
          amount: number
          attempts: number
          beneficiary_member_id: string
          beneficiary_phone: string
          beneficiary_user_id: string
          confirmed_at: string | null
          created_at: string
          currency_id: string
          failed_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          next_attempt_at: string | null
          payout_id: string
          processing_at: string | null
          provider_amount: number | null
          provider_code: string | null
          provider_currency_code: string | null
          provider_payload_hash: string | null
          provider_reference: string | null
          provider_request_id: string | null
          provider_status: string | null
          queued_at: string
          reconciled_at: string | null
          reconciliation_status: string
          reversed_at: string | null
          rotation_id: string
          sent_at: string | null
          status: string
          tontine_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          attempts?: number
          beneficiary_member_id: string
          beneficiary_phone: string
          beneficiary_user_id: string
          confirmed_at?: string | null
          created_at?: string
          currency_id: string
          failed_at?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          next_attempt_at?: string | null
          payout_id: string
          processing_at?: string | null
          provider_amount?: number | null
          provider_code?: string | null
          provider_currency_code?: string | null
          provider_payload_hash?: string | null
          provider_reference?: string | null
          provider_request_id?: string | null
          provider_status?: string | null
          queued_at?: string
          reconciled_at?: string | null
          reconciliation_status?: string
          reversed_at?: string | null
          rotation_id: string
          sent_at?: string | null
          status?: string
          tontine_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attempts?: number
          beneficiary_member_id?: string
          beneficiary_phone?: string
          beneficiary_user_id?: string
          confirmed_at?: string | null
          created_at?: string
          currency_id?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          next_attempt_at?: string | null
          payout_id?: string
          processing_at?: string | null
          provider_amount?: number | null
          provider_code?: string | null
          provider_currency_code?: string | null
          provider_payload_hash?: string | null
          provider_reference?: string | null
          provider_request_id?: string | null
          provider_status?: string | null
          queued_at?: string
          reconciled_at?: string | null
          reconciliation_status?: string
          reversed_at?: string | null
          rotation_id?: string
          sent_at?: string | null
          status?: string
          tontine_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_payout_dispatches_beneficiary_member_id_fkey"
            columns: ["beneficiary_member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payout_dispatches_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payout_dispatches_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "tontine_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payout_dispatches_rotation_id_fkey"
            columns: ["rotation_id"]
            isOneToOne: false
            referencedRelation: "tontine_rotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payout_dispatches_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_payouts: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_member_id: string
          beneficiary_phone: string | null
          created_at: string
          currency_id: string
          id: string
          metadata: Json
          paid_at: string | null
          payment_request_id: string | null
          provider_reference: string | null
          rotation_id: string
          status: string
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_member_id: string
          beneficiary_phone?: string | null
          created_at?: string
          currency_id: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          payment_request_id?: string | null
          provider_reference?: string | null
          rotation_id: string
          status?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_member_id?: string
          beneficiary_phone?: string | null
          created_at?: string
          currency_id?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          payment_request_id?: string | null
          provider_reference?: string | null
          rotation_id?: string
          status?: string
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_payouts_beneficiary_member_id_fkey"
            columns: ["beneficiary_member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payouts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payouts_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payouts_rotation_id_fkey"
            columns: ["rotation_id"]
            isOneToOne: true
            referencedRelation: "tontine_rotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_payouts_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: true
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_pool_entries: {
        Row: {
          amount: number
          contribution_id: string | null
          created_at: string
          currency_id: string
          direction: string
          entry_type: string
          id: string
          payout_id: string | null
          reference: string
          tontine_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          contribution_id?: string | null
          created_at?: string
          currency_id: string
          direction: string
          entry_type: string
          id?: string
          payout_id?: string | null
          reference: string
          tontine_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          contribution_id?: string | null
          created_at?: string
          currency_id?: string
          direction?: string
          entry_type?: string
          id?: string
          payout_id?: string | null
          reference?: string
          tontine_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontine_pool_entries_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "tontine_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_pool_entries_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_pool_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "tontine_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_pool_entries_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_pool_entries_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_reminders_sent: {
        Row: {
          due_on: string
          kind: string
          schedule_id: string
          sent_at: string
        }
        Insert: {
          due_on: string
          kind: string
          schedule_id: string
          sent_at?: string
        }
        Update: {
          due_on?: string
          kind?: string
          schedule_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_reminders_sent_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tontine_contribution_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_rotations: {
        Row: {
          beneficiary_phone: string | null
          created_at: string
          cycle_id: string
          effective_payout_on: string | null
          expected_amount: number
          id: string
          member_id: string
          planned_payout_on: string | null
          rotation_order: number
          status: string
          updated_at: string
        }
        Insert: {
          beneficiary_phone?: string | null
          created_at?: string
          cycle_id: string
          effective_payout_on?: string | null
          expected_amount: number
          id?: string
          member_id: string
          planned_payout_on?: string | null
          rotation_order: number
          status?: string
          updated_at?: string
        }
        Update: {
          beneficiary_phone?: string | null
          created_at?: string
          cycle_id?: string
          effective_payout_on?: string | null
          expected_amount?: number
          id?: string
          member_id?: string
          planned_payout_on?: string | null
          rotation_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_rotations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_rotations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tontines: {
        Row: {
          contribution_amount: number
          country_id: string | null
          created_at: string
          created_by: string
          currency_id: string
          cycle_periods: number
          description: string | null
          ends_on: string | null
          frequency: string
          id: string
          late_fee_amount: number
          member_limit: number
          name: string
          organization_id: string
          payout_mode: string
          president_member_id: string | null
          rules: Json
          starts_on: string | null
          status: string
          tontine_class: string
          tontine_type: string
          updated_at: string
        }
        Insert: {
          contribution_amount: number
          country_id?: string | null
          created_at?: string
          created_by: string
          currency_id: string
          cycle_periods: number
          description?: string | null
          ends_on?: string | null
          frequency: string
          id?: string
          late_fee_amount?: number
          member_limit: number
          name: string
          organization_id: string
          payout_mode?: string
          president_member_id?: string | null
          rules?: Json
          starts_on?: string | null
          status?: string
          tontine_class?: string
          tontine_type?: string
          updated_at?: string
        }
        Update: {
          contribution_amount?: number
          country_id?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string
          cycle_periods?: number
          description?: string | null
          ends_on?: string | null
          frequency?: string
          id?: string
          late_fee_amount?: number
          member_limit?: number
          name?: string
          organization_id?: string
          payout_mode?: string
          president_member_id?: string | null
          rules?: Json
          starts_on?: string | null
          status?: string
          tontine_class?: string
          tontine_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontines_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_president_member_id_fkey"
            columns: ["president_member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_tontine_class_fkey"
            columns: ["tontine_class"]
            isOneToOne: false
            referencedRelation: "tontine_classes"
            referencedColumns: ["code"]
          },
        ]
      }
      transaction_fees: {
        Row: {
          created_at: string
          currency_id: string
          fee_amount: number
          fee_rule_id: string | null
          id: string
          transaction_id: string | null
          transfer_id: string | null
        }
        Insert: {
          created_at?: string
          currency_id: string
          fee_amount: number
          fee_rule_id?: string | null
          id?: string
          transaction_id?: string | null
          transfer_id?: string | null
        }
        Update: {
          created_at?: string
          currency_id?: string
          fee_amount?: number
          fee_rule_id?: string | null
          id?: string
          transaction_id?: string | null
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_fees_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fees_fee_rule_id_fkey"
            columns: ["fee_rule_id"]
            isOneToOne: false
            referencedRelation: "fee_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fees_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fees_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_limits: {
        Row: {
          country_id: string | null
          created_at: string
          currency_id: string | null
          daily_limit: number | null
          id: string
          is_active: boolean
          kyc_level: Database["public"]["Enums"]["kyc_level"]
          maximum_amount: number | null
          minimum_amount: number | null
          monthly_limit: number | null
          operation_type: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          kyc_level?: Database["public"]["Enums"]["kyc_level"]
          maximum_amount?: number | null
          minimum_amount?: number | null
          monthly_limit?: number | null
          operation_type: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          kyc_level?: Database["public"]["Enums"]["kyc_level"]
          maximum_amount?: number | null
          minimum_amount?: number | null
          monthly_limit?: number | null
          operation_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_limits_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_limits_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["transaction_status"] | null
          old_status: Database["public"]["Enums"]["transaction_status"] | null
          transfer_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["transaction_status"] | null
          old_status?: Database["public"]["Enums"]["transaction_status"] | null
          transfer_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["transaction_status"] | null
          old_status?: Database["public"]["Enums"]["transaction_status"] | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_events_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          beneficiary_id: string | null
          created_at: string
          description: string | null
          exchange_rate: number | null
          fee_amount: number
          fee_currency_id: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          provider_id: string | null
          receive_amount: number | null
          receive_currency_id: string | null
          recipient_user_id: string | null
          recipient_wallet_id: string | null
          reference: string | null
          route_id: string | null
          send_amount: number
          send_currency_id: string
          sender_user_id: string
          sender_wallet_id: string
          transfer_status: Database["public"]["Enums"]["transaction_status"]
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string
        }
        Insert: {
          beneficiary_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          fee_amount?: number
          fee_currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          provider_id?: string | null
          receive_amount?: number | null
          receive_currency_id?: string | null
          recipient_user_id?: string | null
          recipient_wallet_id?: string | null
          reference?: string | null
          route_id?: string | null
          send_amount: number
          send_currency_id: string
          sender_user_id: string
          sender_wallet_id: string
          transfer_status?: Database["public"]["Enums"]["transaction_status"]
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Update: {
          beneficiary_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          fee_amount?: number
          fee_currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          provider_id?: string | null
          receive_amount?: number | null
          receive_currency_id?: string | null
          recipient_user_id?: string | null
          recipient_wallet_id?: string | null
          reference?: string | null
          route_id?: string | null
          send_amount?: number
          send_currency_id?: string
          sender_user_id?: string
          sender_wallet_id?: string
          transfer_status?: Database["public"]["Enums"]["transaction_status"]
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "pay_beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_fee_currency_id_fkey"
            columns: ["fee_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_receive_currency_id_fkey"
            columns: ["receive_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_recipient_wallet_id_fkey"
            columns: ["recipient_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "payment_provider_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_send_currency_id_fkey"
            columns: ["send_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_sender_wallet_id_fkey"
            columns: ["sender_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_containers: {
        Row: {
          capacity_m3: number | null
          container_number: string | null
          container_status: string
          container_type: Database["public"]["Enums"]["transit_container_type"]
          created_at: string
          id: string
          shipment_id: string | null
          weight_kg: number | null
        }
        Insert: {
          capacity_m3?: number | null
          container_number?: string | null
          container_status?: string
          container_type?: Database["public"]["Enums"]["transit_container_type"]
          created_at?: string
          id?: string
          shipment_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          capacity_m3?: number | null
          container_number?: string | null
          container_status?: string
          container_type?: Database["public"]["Enums"]["transit_container_type"]
          created_at?: string
          id?: string
          shipment_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_containers_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_customs_cases: {
        Row: {
          country_id: string | null
          created_at: string
          customs_status: Database["public"]["Enums"]["transit_customs_status"]
          id: string
          notes: string | null
          operation_id: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          customs_status?: Database["public"]["Enums"]["transit_customs_status"]
          id?: string
          notes?: string | null
          operation_id: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          customs_status?: Database["public"]["Enums"]["transit_customs_status"]
          id?: string
          notes?: string | null
          operation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_customs_cases_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_customs_cases_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_customs_declarations: {
        Row: {
          country_id: string | null
          currency_id: string | null
          customs_case_id: string
          declaration_status: Database["public"]["Enums"]["transit_customs_status"]
          declaration_type: string | null
          declared_amount: number | null
          declared_at: string
          id: string
          reference: string | null
        }
        Insert: {
          country_id?: string | null
          currency_id?: string | null
          customs_case_id: string
          declaration_status?: Database["public"]["Enums"]["transit_customs_status"]
          declaration_type?: string | null
          declared_amount?: number | null
          declared_at?: string
          id?: string
          reference?: string | null
        }
        Update: {
          country_id?: string | null
          currency_id?: string | null
          customs_case_id?: string
          declaration_status?: Database["public"]["Enums"]["transit_customs_status"]
          declaration_type?: string | null
          declared_amount?: number | null
          declared_at?: string
          id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_customs_declarations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_customs_declarations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_customs_declarations_customs_case_id_fkey"
            columns: ["customs_case_id"]
            isOneToOne: false
            referencedRelation: "transit_customs_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_document_requirements: {
        Row: {
          country_id: string | null
          created_at: string
          document_type: string
          id: string
          is_mandatory: boolean
          mode: Database["public"]["Enums"]["transit_mode"] | null
          operation_type:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          document_type: string
          id?: string
          is_mandatory?: boolean
          mode?: Database["public"]["Enums"]["transit_mode"] | null
          operation_type?:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
        }
        Update: {
          country_id?: string | null
          created_at?: string
          document_type?: string
          id?: string
          is_mandatory?: boolean
          mode?: Database["public"]["Enums"]["transit_mode"] | null
          operation_type?:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_document_requirements_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_url: string
          id: string
          is_public: boolean
          name: string
          operation_id: string | null
          shipment_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          name: string
          operation_id?: string | null
          shipment_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          name?: string
          operation_id?: string | null
          shipment_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_documents_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_goods: {
        Row: {
          category: string | null
          created_at: string
          currency_id: string | null
          declared_value: number | null
          description: string
          hs_code: string | null
          id: string
          operation_id: string
          quantity: number | null
          reference: string | null
          unit: string | null
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          description: string
          hs_code?: string | null
          id?: string
          operation_id: string
          quantity?: number | null
          reference?: string | null
          unit?: string | null
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          description?: string
          hs_code?: string | null
          id?: string
          operation_id?: string
          quantity?: number | null
          reference?: string | null
          unit?: string | null
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_goods_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_goods_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_invoices: {
        Row: {
          amount: number
          business_id: string
          client_user_id: string
          created_at: string
          currency_id: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_status: Database["public"]["Enums"]["transit_invoice_status"]
          operation_id: string | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          business_id: string
          client_user_id: string
          created_at?: string
          currency_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_status?: Database["public"]["Enums"]["transit_invoice_status"]
          operation_id?: string | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          client_user_id?: string
          created_at?: string
          currency_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_status?: Database["public"]["Enums"]["transit_invoice_status"]
          operation_id?: string | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_invoices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_invoices_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_invoices_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_locations: {
        Row: {
          city: string | null
          code: string | null
          country_id: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          location_type: Database["public"]["Enums"]["transit_location_type"]
          longitude: number | null
          name: string
        }
        Insert: {
          city?: string | null
          code?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_type: Database["public"]["Enums"]["transit_location_type"]
          longitude?: number | null
          name: string
        }
        Update: {
          city?: string | null
          code?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_type?: Database["public"]["Enums"]["transit_location_type"]
          longitude?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_locations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_logistic_units: {
        Row: {
          container_id: string | null
          created_at: string
          id: string
          quantity: number
          reference: string | null
          shipment_id: string
          unit_type: Database["public"]["Enums"]["transit_logistic_unit_type"]
          weight_kg: number | null
        }
        Insert: {
          container_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          reference?: string | null
          shipment_id: string
          unit_type: Database["public"]["Enums"]["transit_logistic_unit_type"]
          weight_kg?: number | null
        }
        Update: {
          container_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          reference?: string | null
          shipment_id?: string
          unit_type?: Database["public"]["Enums"]["transit_logistic_unit_type"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_logistic_units_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "transit_containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_logistic_units_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_operations: {
        Row: {
          business_id: string | null
          case_status: Database["public"]["Enums"]["transit_case_status"]
          client_user_id: string
          created_at: string
          destination_city: string | null
          destination_country_id: string | null
          id: string
          mode: Database["public"]["Enums"]["transit_mode"]
          operation_type: Database["public"]["Enums"]["transit_operation_type"]
          origin_city: string | null
          origin_country_id: string | null
          reference: string | null
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          case_status?: Database["public"]["Enums"]["transit_case_status"]
          client_user_id: string
          created_at?: string
          destination_city?: string | null
          destination_country_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["transit_mode"]
          operation_type: Database["public"]["Enums"]["transit_operation_type"]
          origin_city?: string | null
          origin_country_id?: string | null
          reference?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          case_status?: Database["public"]["Enums"]["transit_case_status"]
          client_user_id?: string
          created_at?: string
          destination_city?: string | null
          destination_country_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["transit_mode"]
          operation_type?: Database["public"]["Enums"]["transit_operation_type"]
          origin_city?: string | null
          origin_country_id?: string | null
          reference?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_operations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_operations_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_operations_origin_country_id_fkey"
            columns: ["origin_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_packages: {
        Row: {
          created_at: string
          height_cm: number | null
          id: string
          length_cm: number | null
          package_number: string | null
          package_status: string
          package_type: string | null
          quantity: number
          shipment_id: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          package_number?: string | null
          package_status?: string
          package_type?: string | null
          quantity?: number
          shipment_id: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          package_number?: string | null
          package_status?: string
          package_type?: string | null
          quantity?: number
          shipment_id?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_packages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_partners: {
        Row: {
          business_id: string | null
          contact_email: string | null
          contact_phone: string | null
          country_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          partner_type: Database["public"]["Enums"]["transit_partner_type"]
        }
        Insert: {
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          partner_type: Database["public"]["Enums"]["transit_partner_type"]
        }
        Update: {
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          partner_type?: Database["public"]["Enums"]["transit_partner_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transit_partners_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_partners_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_payment_schedules: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string
          id: string
          invoice_id: string
          remaining_amount: number | null
          schedule_status: Database["public"]["Enums"]["transit_payment_schedule_status"]
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          created_at?: string
          due_date: string
          id?: string
          invoice_id: string
          remaining_amount?: number | null
          schedule_status?: Database["public"]["Enums"]["transit_payment_schedule_status"]
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_id?: string
          remaining_amount?: number | null
          schedule_status?: Database["public"]["Enums"]["transit_payment_schedule_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transit_payment_schedules_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "transit_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_quotes: {
        Row: {
          business_id: string
          client_user_id: string
          created_at: string
          created_by: string
          currency_id: string | null
          id: string
          items: Json
          operation_id: string | null
          quote_status: Database["public"]["Enums"]["transit_quote_status"]
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          client_user_id: string
          created_at?: string
          created_by: string
          currency_id?: string | null
          id?: string
          items?: Json
          operation_id?: string | null
          quote_status?: Database["public"]["Enums"]["transit_quote_status"]
          total_amount: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          client_user_id?: string
          created_at?: string
          created_by?: string
          currency_id?: string | null
          id?: string
          items?: Json
          operation_id?: string | null
          quote_status?: Database["public"]["Enums"]["transit_quote_status"]
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_quotes_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_quotes_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          operation_id: string | null
          partner_id: string | null
          reason: string
          report_status: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          operation_id?: string | null
          partner_id?: string | null
          reason: string
          report_status?: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          operation_id?: string | null
          partner_id?: string | null
          reason?: string
          report_status?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_reports_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_reports_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "transit_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_requests: {
        Row: {
          assigned_business_id: string | null
          budget_max: number | null
          created_at: string
          crm_prospect_id: string | null
          currency_id: string | null
          description: string | null
          destination_country_id: string | null
          id: string
          operation_type:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
          origin_country_id: string | null
          request_status: Database["public"]["Enums"]["transit_request_status"]
          requester_user_id: string
          updated_at: string
        }
        Insert: {
          assigned_business_id?: string | null
          budget_max?: number | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          description?: string | null
          destination_country_id?: string | null
          id?: string
          operation_type?:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
          origin_country_id?: string | null
          request_status?: Database["public"]["Enums"]["transit_request_status"]
          requester_user_id: string
          updated_at?: string
        }
        Update: {
          assigned_business_id?: string | null
          budget_max?: number | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          description?: string | null
          destination_country_id?: string | null
          id?: string
          operation_type?:
            | Database["public"]["Enums"]["transit_operation_type"]
            | null
          origin_country_id?: string | null
          request_status?: Database["public"]["Enums"]["transit_request_status"]
          requester_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_requests_assigned_business_id_fkey"
            columns: ["assigned_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_requests_crm_prospect_id_fkey"
            columns: ["crm_prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_requests_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_requests_origin_country_id_fkey"
            columns: ["origin_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_shipment_legs: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          carrier_partner_id: string | null
          destination_location_id: string | null
          external_reference: string | null
          id: string
          leg_order: number
          leg_status: Database["public"]["Enums"]["transit_case_status"]
          mode: Database["public"]["Enums"]["transit_mode"]
          origin_location_id: string | null
          planned_arrival: string | null
          planned_departure: string | null
          shipment_id: string
          transport_delivery_id: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          carrier_partner_id?: string | null
          destination_location_id?: string | null
          external_reference?: string | null
          id?: string
          leg_order?: number
          leg_status?: Database["public"]["Enums"]["transit_case_status"]
          mode: Database["public"]["Enums"]["transit_mode"]
          origin_location_id?: string | null
          planned_arrival?: string | null
          planned_departure?: string | null
          shipment_id: string
          transport_delivery_id?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          carrier_partner_id?: string | null
          destination_location_id?: string | null
          external_reference?: string | null
          id?: string
          leg_order?: number
          leg_status?: Database["public"]["Enums"]["transit_case_status"]
          mode?: Database["public"]["Enums"]["transit_mode"]
          origin_location_id?: string | null
          planned_arrival?: string | null
          planned_departure?: string | null
          shipment_id?: string
          transport_delivery_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transit_shipment_legs_carrier"
            columns: ["carrier_partner_id"]
            isOneToOne: false
            referencedRelation: "transit_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipment_legs_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "transit_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipment_legs_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "transit_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipment_legs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipment_legs_transport_delivery_id_fkey"
            columns: ["transport_delivery_id"]
            isOneToOne: false
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_shipments: {
        Row: {
          case_status: Database["public"]["Enums"]["transit_case_status"]
          consignee_name: string | null
          consignee_phone: string | null
          created_at: string
          currency_id: string | null
          declared_value: number | null
          destination_location_id: string | null
          id: string
          mode: Database["public"]["Enums"]["transit_mode"]
          operation_id: string
          origin_location_id: string | null
          quantity: number | null
          reference: string | null
          shipper_name: string | null
          shipper_user_id: string | null
          updated_at: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          case_status?: Database["public"]["Enums"]["transit_case_status"]
          consignee_name?: string | null
          consignee_phone?: string | null
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          destination_location_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["transit_mode"]
          operation_id: string
          origin_location_id?: string | null
          quantity?: number | null
          reference?: string | null
          shipper_name?: string | null
          shipper_user_id?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          case_status?: Database["public"]["Enums"]["transit_case_status"]
          consignee_name?: string | null
          consignee_phone?: string | null
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          destination_location_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["transit_mode"]
          operation_id?: string
          origin_location_id?: string | null
          quantity?: number | null
          reference?: string | null
          shipper_name?: string | null
          shipper_user_id?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_shipments_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipments_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "transit_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipments_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "transit_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_shipments_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "transit_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_storage_records: {
        Row: {
          created_at: string
          currency_id: string | null
          entry_date: string
          exit_date: string | null
          id: string
          quantity: number | null
          record_status: string
          shipment_id: string
          storage_rate: number | null
          unit: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          entry_date?: string
          exit_date?: string | null
          id?: string
          quantity?: number | null
          record_status?: string
          shipment_id: string
          storage_rate?: number | null
          unit?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          entry_date?: string
          exit_date?: string | null
          id?: string
          quantity?: number | null
          record_status?: string
          shipment_id?: string
          storage_rate?: number | null
          unit?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_storage_records_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_storage_records_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_storage_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "transit_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_tracking_events: {
        Row: {
          actor_user_id: string | null
          comment: string | null
          created_at: string
          event_status: Database["public"]["Enums"]["transit_tracking_status"]
          id: string
          location: string | null
          shipment_id: string
          source_reference: string | null
        }
        Insert: {
          actor_user_id?: string | null
          comment?: string | null
          created_at?: string
          event_status: Database["public"]["Enums"]["transit_tracking_status"]
          id?: string
          location?: string | null
          shipment_id: string
          source_reference?: string | null
        }
        Update: {
          actor_user_id?: string | null
          comment?: string | null
          created_at?: string
          event_status?: Database["public"]["Enums"]["transit_tracking_status"]
          id?: string
          location?: string | null
          shipment_id?: string
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "transit_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_warehouses: {
        Row: {
          accepted_goods_types: string[] | null
          business_id: string
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          name: string
        }
        Insert: {
          accepted_goods_types?: string[] | null
          business_id: string
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          name: string
        }
        Update: {
          accepted_goods_types?: string[] | null
          business_id?: string
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_warehouses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_warehouses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "transit_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["transport_booking_status"]
          business_id: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          currency_id: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          passengers_count: number
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          reference: string | null
          scheduled_at: string | null
          service_type_id: string
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["transport_booking_status"]
          business_id?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency_id?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          idempotency_key?: string | null
          passenger_user_id: string
          passengers_count?: number
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          reference?: string | null
          scheduled_at?: string | null
          service_type_id: string
          updated_at?: string
          vehicle_id?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["transport_booking_status"]
          business_id?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency_id?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          idempotency_key?: string | null
          passenger_user_id?: string
          passengers_count?: number
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          reference?: string | null
          scheduled_at?: string | null
          service_type_id?: string
          updated_at?: string
          vehicle_id?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_bookings_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_bookings_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "transport_service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_bookings_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_commissions: {
        Row: {
          amount: number
          booking_id: string | null
          business_id: string | null
          commission_status: string
          created_at: string
          currency_id: string | null
          delivery_id: string | null
          driver_id: string | null
          id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          business_id?: string | null
          commission_status?: string
          created_at?: string
          currency_id?: string | null
          delivery_id?: string | null
          driver_id?: string | null
          id?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          business_id?: string | null
          commission_status?: string
          created_at?: string
          currency_id?: string | null
          delivery_id?: string | null
          driver_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_commissions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_commissions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_commissions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_deliveries: {
        Row: {
          business_id: string | null
          created_at: string
          currency_id: string | null
          delivery_status: Database["public"]["Enums"]["transport_delivery_status"]
          destination_address: string
          destination_latitude: number | null
          destination_longitude: number | null
          driver_id: string | null
          id: string
          idempotency_key: string | null
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          price: number | null
          recipient_name: string
          recipient_phone: string | null
          reference: string | null
          sender_user_id: string
          source_module: string | null
          source_reference: string | null
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          delivery_status?: Database["public"]["Enums"]["transport_delivery_status"]
          destination_address: string
          destination_latitude?: number | null
          destination_longitude?: number | null
          driver_id?: string | null
          id?: string
          idempotency_key?: string | null
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          price?: number | null
          recipient_name: string
          recipient_phone?: string | null
          reference?: string | null
          sender_user_id: string
          source_module?: string | null
          source_reference?: string | null
          updated_at?: string
          vehicle_id?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          delivery_status?: Database["public"]["Enums"]["transport_delivery_status"]
          destination_address?: string
          destination_latitude?: number | null
          destination_longitude?: number | null
          driver_id?: string | null
          id?: string
          idempotency_key?: string | null
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          price?: number | null
          recipient_name?: string
          recipient_phone?: string | null
          reference?: string | null
          sender_user_id?: string
          source_module?: string | null
          source_reference?: string | null
          updated_at?: string
          vehicle_id?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_deliveries_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_deliveries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_deliveries_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_delivery_events: {
        Row: {
          actor_user_id: string | null
          comment: string | null
          created_at: string
          delivery_id: string
          event_status: Database["public"]["Enums"]["transport_delivery_status"]
          id: string
          location: string | null
        }
        Insert: {
          actor_user_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id: string
          event_status: Database["public"]["Enums"]["transport_delivery_status"]
          id?: string
          location?: string | null
        }
        Update: {
          actor_user_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string
          event_status?: Database["public"]["Enums"]["transport_delivery_status"]
          id?: string
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_delivery_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_delivery_proofs: {
        Row: {
          confirmed_at: string | null
          created_at: string
          delivery_id: string
          id: string
          otp_code: string | null
          proof_type: string
          proof_url: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          delivery_id: string
          id?: string
          otp_code?: string | null
          proof_type: string
          proof_url?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          delivery_id?: string
          id?: string
          otp_code?: string | null
          proof_type?: string
          proof_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_delivery_proofs_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: true
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_driver_availability: {
        Row: {
          availability_status: Database["public"]["Enums"]["transport_availability_status"]
          current_latitude: number | null
          current_longitude: number | null
          driver_id: string
          updated_at: string
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["transport_availability_status"]
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id: string
          updated_at?: string
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["transport_availability_status"]
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_driver_documents: {
        Row: {
          created_at: string
          document_type: string
          driver_id: string
          expires_at: string | null
          file_url: string
          id: string
          verification_status: Database["public"]["Enums"]["transport_verification_status"]
        }
        Insert: {
          created_at?: string
          document_type: string
          driver_id: string
          expires_at?: string | null
          file_url: string
          id?: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
        }
        Update: {
          created_at?: string
          document_type?: string
          driver_id?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transport_driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_drivers: {
        Row: {
          business_id: string | null
          created_at: string
          driver_status: Database["public"]["Enums"]["transport_driver_status"]
          id: string
          languages: string[] | null
          primary_vehicle_id: string | null
          service_type_ids: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["transport_verification_status"]
          zones: string[] | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          driver_status?: Database["public"]["Enums"]["transport_driver_status"]
          id?: string
          languages?: string[] | null
          primary_vehicle_id?: string | null
          service_type_ids?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
          zones?: string[] | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          driver_status?: Database["public"]["Enums"]["transport_driver_status"]
          id?: string
          languages?: string[] | null
          primary_vehicle_id?: string | null
          service_type_ids?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
          zones?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_drivers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_drivers_primary_vehicle_id_fkey"
            columns: ["primary_vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_parcels: {
        Row: {
          created_at: string
          currency_id: string | null
          declared_value: number | null
          delivery_id: string
          description: string | null
          height_cm: number | null
          id: string
          length_cm: number | null
          quantity: number
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          delivery_id: string
          description?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          quantity?: number
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          declared_value?: number | null
          delivery_id?: string
          description?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          quantity?: number
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_parcels_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_parcels_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_pricing_rules: {
        Row: {
          base_fare: number
          business_id: string | null
          country_id: string | null
          created_at: string
          currency_id: string | null
          id: string
          is_active: boolean
          minimum_fare: number
          night_surcharge_percent: number
          per_km_fare: number
          per_minute_fare: number
          service_type_id: string
          updated_at: string
          vehicle_type_id: string | null
          waiting_fee_per_minute: number
        }
        Insert: {
          base_fare?: number
          business_id?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          is_active?: boolean
          minimum_fare?: number
          night_surcharge_percent?: number
          per_km_fare?: number
          per_minute_fare?: number
          service_type_id: string
          updated_at?: string
          vehicle_type_id?: string | null
          waiting_fee_per_minute?: number
        }
        Update: {
          base_fare?: number
          business_id?: string | null
          country_id?: string | null
          created_at?: string
          currency_id?: string | null
          id?: string
          is_active?: boolean
          minimum_fare?: number
          night_surcharge_percent?: number
          per_km_fare?: number
          per_minute_fare?: number
          service_type_id?: string
          updated_at?: string
          vehicle_type_id?: string | null
          waiting_fee_per_minute?: number
        }
        Relationships: [
          {
            foreignKeyName: "transport_pricing_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_pricing_rules_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_pricing_rules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_pricing_rules_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "transport_service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_pricing_rules_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_rentals: {
        Row: {
          business_id: string | null
          created_at: string
          currency_id: string | null
          driver_id: string | null
          end_at: string
          id: string
          idempotency_key: string | null
          price: number
          rental_status: Database["public"]["Enums"]["transport_rental_status"]
          renter_user_id: string
          start_at: string
          updated_at: string
          vehicle_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          driver_id?: string | null
          end_at: string
          id?: string
          idempotency_key?: string | null
          price: number
          rental_status?: Database["public"]["Enums"]["transport_rental_status"]
          renter_user_id: string
          start_at: string
          updated_at?: string
          vehicle_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          currency_id?: string | null
          driver_id?: string | null
          end_at?: string
          id?: string
          idempotency_key?: string | null
          price?: number
          rental_status?: Database["public"]["Enums"]["transport_rental_status"]
          renter_user_id?: string
          start_at?: string
          updated_at?: string
          vehicle_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_rentals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_rentals_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_rentals_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_rentals_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_rentals_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          report_status: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_status?: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_status?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      transport_requests: {
        Row: {
          assigned_business_id: string | null
          budget_max: number | null
          country_id: string | null
          created_at: string
          crm_prospect_id: string | null
          currency_id: string | null
          description: string | null
          id: string
          request_status: Database["public"]["Enums"]["transport_request_status"]
          request_type: string
          requester_user_id: string
          updated_at: string
        }
        Insert: {
          assigned_business_id?: string | null
          budget_max?: number | null
          country_id?: string | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          description?: string | null
          id?: string
          request_status?: Database["public"]["Enums"]["transport_request_status"]
          request_type: string
          requester_user_id: string
          updated_at?: string
        }
        Update: {
          assigned_business_id?: string | null
          budget_max?: number | null
          country_id?: string | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          description?: string | null
          id?: string
          request_status?: Database["public"]["Enums"]["transport_request_status"]
          request_type?: string
          requester_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_assigned_business_id_fkey"
            columns: ["assigned_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_crm_prospect_id_fkey"
            columns: ["crm_prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          delivery_id: string | null
          id: string
          rating: number
          review_status: Database["public"]["Enums"]["transport_review_status"]
          reviewer_user_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["transport_review_target"]
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          rating: number
          review_status?: Database["public"]["Enums"]["transport_review_status"]
          reviewer_user_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["transport_review_target"]
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          rating?: number
          review_status?: Database["public"]["Enums"]["transport_review_status"]
          reviewer_user_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["transport_review_target"]
        }
        Relationships: [
          {
            foreignKeyName: "transport_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_reviews_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "transport_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          business_id: string
          created_at: string
          destination_city: string
          destination_country_id: string | null
          distance_km: number | null
          id: string
          is_active: boolean
          name: string
          origin_city: string
          origin_country_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          destination_city: string
          destination_country_id?: string | null
          distance_km?: number | null
          id?: string
          is_active?: boolean
          name: string
          origin_city: string
          origin_country_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          destination_city?: string
          destination_country_id?: string | null
          distance_km?: number | null
          id?: string
          is_active?: boolean
          name?: string
          origin_city?: string
          origin_country_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_origin_country_id_fkey"
            columns: ["origin_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_schedules: {
        Row: {
          arrival_at_estimated: string | null
          capacity: number
          created_at: string
          currency_id: string | null
          departure_at: string
          driver_id: string | null
          id: string
          is_active: boolean
          price: number
          route_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          arrival_at_estimated?: string | null
          capacity: number
          created_at?: string
          currency_id?: string | null
          departure_at: string
          driver_id?: string | null
          id?: string
          is_active?: boolean
          price: number
          route_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          arrival_at_estimated?: string | null
          capacity?: number
          created_at?: string
          currency_id?: string | null
          departure_at?: string
          driver_id?: string | null
          id?: string
          is_active?: boolean
          price?: number
          route_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_schedules_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_schedules_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_seat_reservations: {
        Row: {
          created_at: string
          currency_id: string | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          price: number
          reservation_status: string
          schedule_id: string
          seat_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          passenger_user_id: string
          price: number
          reservation_status?: string
          schedule_id: string
          seat_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          id?: string
          idempotency_key?: string | null
          passenger_user_id?: string
          price?: number
          reservation_status?: string
          schedule_id?: string
          seat_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_seat_reservations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_seat_reservations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "transport_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_seat_reservations_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: true
            referencedRelation: "transport_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_seat_reservations_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_seats: {
        Row: {
          id: string
          schedule_id: string
          seat_number: string
          seat_status: Database["public"]["Enums"]["transport_seat_status"]
        }
        Insert: {
          id?: string
          schedule_id: string
          seat_number: string
          seat_status?: Database["public"]["Enums"]["transport_seat_status"]
        }
        Update: {
          id?: string
          schedule_id?: string
          seat_number?: string
          seat_status?: Database["public"]["Enums"]["transport_seat_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transport_seats_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "transport_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_service_types: {
        Row: {
          code: string
          country_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_service_types_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_stops: {
        Row: {
          address: string | null
          city: string
          id: string
          latitude: number | null
          longitude: number | null
          route_id: string
          stop_order: number
        }
        Insert: {
          address?: string | null
          city: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id: string
          stop_order: number
        }
        Update: {
          address?: string | null
          city?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "transport_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_vehicle_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_url: string
          id: string
          vehicle_id: string
          verification_status: Database["public"]["Enums"]["transport_verification_status"]
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_url: string
          id?: string
          vehicle_id: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          vehicle_id?: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transport_vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_vehicle_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      transport_vehicles: {
        Row: {
          brand: string | null
          business_id: string | null
          capacity: number | null
          color: string | null
          created_at: string
          id: string
          model: string | null
          owner_user_id: string | null
          plate_number: string
          updated_at: string
          vehicle_status: Database["public"]["Enums"]["transport_vehicle_status"]
          vehicle_type_id: string
          verification_status: Database["public"]["Enums"]["transport_verification_status"]
          year: number | null
        }
        Insert: {
          brand?: string | null
          business_id?: string | null
          capacity?: number | null
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          owner_user_id?: string | null
          plate_number: string
          updated_at?: string
          vehicle_status?: Database["public"]["Enums"]["transport_vehicle_status"]
          vehicle_type_id: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
          year?: number | null
        }
        Update: {
          brand?: string | null
          business_id?: string | null
          capacity?: number | null
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          owner_user_id?: string | null
          plate_number?: string
          updated_at?: string
          vehicle_status?: Database["public"]["Enums"]["transport_vehicle_status"]
          vehicle_type_id?: string
          verification_status?: Database["public"]["Enums"]["transport_verification_status"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_vehicles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_accommodation_media: {
        Row: {
          accommodation_id: string
          id: string
          is_primary: boolean
          sort_order: number
          url: string
        }
        Insert: {
          accommodation_id: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          accommodation_id?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_accommodation_media_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "travel_accommodations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_accommodations: {
        Row: {
          accommodation_type: string
          address: string | null
          amenities: Json
          business_id: string
          capacity: number | null
          created_at: string
          description: string | null
          destination_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          publish_status: Database["public"]["Enums"]["travel_publish_status"]
          slug: string | null
          updated_at: string
        }
        Insert: {
          accommodation_type?: string
          address?: string | null
          amenities?: Json
          business_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          slug?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_type?: string
          address?: string | null
          amenities?: Json
          business_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_accommodations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_accommodations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "travel_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_activities: {
        Row: {
          business_id: string
          capacity: number | null
          created_at: string
          currency_id: string | null
          description: string | null
          destination_id: string | null
          duration_minutes: number | null
          id: string
          name: string
          price: number
          publish_status: Database["public"]["Enums"]["travel_publish_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          destination_id?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price: number
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          destination_id?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price?: number
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_activities_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_activities_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "travel_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_activity_media: {
        Row: {
          activity_id: string
          id: string
          is_primary: boolean
          sort_order: number
          url: string
        }
        Insert: {
          activity_id: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          activity_id?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_activity_media_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "travel_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agencies: {
        Row: {
          business_id: string
          created_at: string
          id: string
          license_number: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["travel_verification_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          license_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          license_number?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "travel_agencies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agents: {
        Row: {
          business_id: string
          created_at: string
          id: string
          specialties: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["travel_verification_status"]
          zones: string[] | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
          zones?: string[] | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
          zones?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_availability: {
        Row: {
          available_date: string
          created_at: string
          id: string
          reserved_units: number
          resource_id: string
          resource_type: Database["public"]["Enums"]["travel_resource_type"]
          total_units: number
          updated_at: string
        }
        Insert: {
          available_date: string
          created_at?: string
          id?: string
          reserved_units?: number
          resource_id: string
          resource_type: Database["public"]["Enums"]["travel_resource_type"]
          total_units?: number
          updated_at?: string
        }
        Update: {
          available_date?: string
          created_at?: string
          id?: string
          reserved_units?: number
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["travel_resource_type"]
          total_units?: number
          updated_at?: string
        }
        Relationships: []
      }
      travel_bookings: {
        Row: {
          amount: number
          booking_status: Database["public"]["Enums"]["travel_booking_status"]
          business_id: string | null
          buyer_user_id: string
          created_at: string
          currency_id: string | null
          end_date: string | null
          id: string
          idempotency_key: string | null
          quote_id: string | null
          reference: string | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["travel_resource_type"]
          start_date: string | null
          travelers_count: number
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_status?: Database["public"]["Enums"]["travel_booking_status"]
          business_id?: string | null
          buyer_user_id: string
          created_at?: string
          currency_id?: string | null
          end_date?: string | null
          id?: string
          idempotency_key?: string | null
          quote_id?: string | null
          reference?: string | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["travel_resource_type"]
          start_date?: string | null
          travelers_count?: number
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_status?: Database["public"]["Enums"]["travel_booking_status"]
          business_id?: string | null
          buyer_user_id?: string
          created_at?: string
          currency_id?: string | null
          end_date?: string | null
          id?: string
          idempotency_key?: string | null
          quote_id?: string | null
          reference?: string | null
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["travel_resource_type"]
          start_date?: string | null
          travelers_count?: number
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_bookings_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "travel_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_bookings_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_commissions: {
        Row: {
          agent_id: string | null
          amount: number
          booking_id: string | null
          business_id: string
          commission_status: string
          created_at: string
          currency_id: string | null
          guide_id: string | null
          id: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          booking_id?: string | null
          business_id: string
          commission_status?: string
          created_at?: string
          currency_id?: string | null
          guide_id?: string | null
          id?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          booking_id?: string | null
          business_id?: string
          commission_status?: string
          created_at?: string
          currency_id?: string | null
          guide_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "travel_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "travel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_commissions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_commissions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "travel_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_destinations: {
        Row: {
          city: string | null
          country_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          short_description: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          short_description?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          short_description?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_destinations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_documents: {
        Row: {
          booking_id: string | null
          created_at: string
          document_type: string | null
          file_url: string
          id: string
          is_public: boolean
          name: string
          owner_user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          document_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          name: string
          owner_user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          document_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          name?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "travel_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_favorites: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["travel_target_type"]
          user_id?: string
        }
        Relationships: []
      }
      travel_guides: {
        Row: {
          business_id: string | null
          created_at: string
          destinations: string[] | null
          id: string
          is_available: boolean
          languages: string[] | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["travel_verification_status"]
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          destinations?: string[] | null
          id?: string
          is_available?: boolean
          languages?: string[] | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
        }
        Update: {
          business_id?: string | null
          created_at?: string
          destinations?: string[] | null
          id?: string
          is_available?: boolean
          languages?: string[] | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["travel_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "travel_guides_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_itineraries: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          owner_user_id: string
          share_token: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          owner_user_id: string
          share_token?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          owner_user_id?: string
          share_token?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      travel_itinerary_items: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          destination_id: string | null
          id: string
          item_date: string | null
          item_time: string | null
          item_type: string | null
          itinerary_id: string
          title: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          item_date?: string | null
          item_time?: string | null
          item_type?: string | null
          itinerary_id: string
          title: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          item_date?: string | null
          item_time?: string | null
          item_type?: string | null
          itinerary_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_travel_itinerary_items_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "travel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_itinerary_items_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "travel_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_itinerary_items_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "travel_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_quotes: {
        Row: {
          business_id: string
          client_user_id: string
          created_at: string
          created_by: string
          currency_id: string | null
          id: string
          items: Json
          quote_status: Database["public"]["Enums"]["travel_quote_status"]
          request_id: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          client_user_id: string
          created_at?: string
          created_by: string
          currency_id?: string | null
          id?: string
          items?: Json
          quote_status?: Database["public"]["Enums"]["travel_quote_status"]
          request_id?: string | null
          total_amount: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          client_user_id?: string
          created_at?: string
          created_by?: string
          currency_id?: string | null
          id?: string
          items?: Json
          quote_status?: Database["public"]["Enums"]["travel_quote_status"]
          request_id?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_quotes_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          report_status: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_status?: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_status?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["travel_target_type"]
        }
        Relationships: []
      }
      travel_requests: {
        Row: {
          assigned_business_id: string | null
          budget_max: number | null
          created_at: string
          crm_prospect_id: string | null
          currency_id: string | null
          destination_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          request_status: Database["public"]["Enums"]["travel_request_status"]
          requester_user_id: string
          start_date: string | null
          travel_type: string | null
          travelers_count: number
          updated_at: string
        }
        Insert: {
          assigned_business_id?: string | null
          budget_max?: number | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          destination_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          request_status?: Database["public"]["Enums"]["travel_request_status"]
          requester_user_id: string
          start_date?: string | null
          travel_type?: string | null
          travelers_count?: number
          updated_at?: string
        }
        Update: {
          assigned_business_id?: string | null
          budget_max?: number | null
          created_at?: string
          crm_prospect_id?: string | null
          currency_id?: string | null
          destination_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          request_status?: Database["public"]["Enums"]["travel_request_status"]
          requester_user_id?: string
          start_date?: string | null
          travel_type?: string | null
          travelers_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_requests_assigned_business_id_fkey"
            columns: ["assigned_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_requests_crm_prospect_id_fkey"
            columns: ["crm_prospect_id"]
            isOneToOne: false
            referencedRelation: "crm_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_requests_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_requests_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "travel_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          review_status: Database["public"]["Enums"]["travel_review_status"]
          reviewer_user_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          review_status?: Database["public"]["Enums"]["travel_review_status"]
          reviewer_user_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["travel_target_type"]
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_status?: Database["public"]["Enums"]["travel_review_status"]
          reviewer_user_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["travel_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "travel_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "travel_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_rooms: {
        Row: {
          accommodation_id: string
          bed_count: number | null
          capacity: number
          created_at: string
          currency_id: string | null
          id: string
          is_active: boolean
          name: string
          price_per_night: number
          room_type: string | null
          updated_at: string
        }
        Insert: {
          accommodation_id: string
          bed_count?: number | null
          capacity?: number
          created_at?: string
          currency_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_per_night: number
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_id?: string
          bed_count?: number | null
          capacity?: number
          created_at?: string
          currency_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_per_night?: number
          room_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_rooms_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "travel_accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_rooms_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_tour_stops: {
        Row: {
          day_offset: number
          description: string | null
          destination_id: string | null
          duration_hours: number | null
          id: string
          stop_order: number
          tour_id: string
        }
        Insert: {
          day_offset?: number
          description?: string | null
          destination_id?: string | null
          duration_hours?: number | null
          id?: string
          stop_order?: number
          tour_id: string
        }
        Update: {
          day_offset?: number
          description?: string | null
          destination_id?: string | null
          duration_hours?: number | null
          id?: string
          stop_order?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_tour_stops_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "travel_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_tour_stops_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "travel_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_tours: {
        Row: {
          business_id: string
          capacity: number | null
          created_at: string
          currency_id: string | null
          description: string | null
          duration_days: number
          guide_id: string | null
          id: string
          price: number
          publish_status: Database["public"]["Enums"]["travel_publish_status"]
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_days: number
          guide_id?: string | null
          id?: string
          price: number
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity?: number | null
          created_at?: string
          currency_id?: string | null
          description?: string | null
          duration_days?: number
          guide_id?: string | null
          id?: string
          price?: number
          publish_status?: Database["public"]["Enums"]["travel_publish_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_tours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_tours_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_tours_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "travel_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      travelers: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string | null
          nationality_country_id: string | null
          owner_user_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          nationality_country_id?: string | null
          owner_user_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          nationality_country_id?: string | null
          owner_user_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travelers_nationality_country_id_fkey"
            columns: ["nationality_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          is_active: boolean
          module_id: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          module_id: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          module_id?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recent_services: {
        Row: {
          accessed_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recent_services_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
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
          currency_id: string
          description: string | null
          external_reference: string | null
          fee_amount: number
          fee_currency_id: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_transaction_id: string | null
          reference: string | null
          related_transaction_id: string | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency_id: string
          description?: string | null
          external_reference?: string | null
          fee_amount?: number
          fee_currency_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_transaction_id?: string | null
          reference?: string | null
          related_transaction_id?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency_id?: string
          description?: string | null
          external_reference?: string | null
          fee_amount?: number
          fee_currency_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_transaction_id?: string | null
          reference?: string | null
          related_transaction_id?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_fee_currency_id_fkey"
            columns: ["fee_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number
          balance: number
          created_at: string
          currency_id: string
          id: string
          organization_id: string | null
          pending_balance: number
          updated_at: string
          user_id: string
          wallet_status: Database["public"]["Enums"]["wallet_status"]
        }
        Insert: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency_id: string
          id?: string
          organization_id?: string | null
          pending_balance?: number
          updated_at?: string
          user_id: string
          wallet_status?: Database["public"]["Enums"]["wallet_status"]
        }
        Update: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency_id?: string
          id?: string
          organization_id?: string | null
          pending_balance?: number
          updated_at?: string
          user_id?: string
          wallet_status?: Database["public"]["Enums"]["wallet_status"]
        }
        Relationships: [
          {
            foreignKeyName: "wallets_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_managers: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          organization_id: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_managers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_subwarehouse_inventory: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          quantity: number
          reserved_quantity: number
          subwarehouse_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          quantity?: number
          reserved_quantity?: number
          subwarehouse_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          quantity?: number
          reserved_quantity?: number
          subwarehouse_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_subwarehouse_inventory_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_inventory_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_subwarehouses: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          manager_user_id: string | null
          name: string
          organization_id: string
          parent_warehouse_id: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          organization_id: string
          parent_warehouse_id: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
          organization_id?: string
          parent_warehouse_id?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_subwarehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouses_parent_warehouse_id_fkey"
            columns: ["parent_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_users_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          manager_user_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          manager_user_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          manager_user_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          payload: Json
          processed_at: string | null
          provider: string
          retry_count: number
          signature: string | null
          updated_at: string
          webhook_status: Database["public"]["Enums"]["webhook_event_status"]
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          retry_count?: number
          signature?: string | null
          updated_at?: string
          webhook_status?: Database["public"]["Enums"]["webhook_event_status"]
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          retry_count?: number
          signature?: string | null
          updated_at?: string
          webhook_status?: Database["public"]["Enums"]["webhook_event_status"]
        }
        Relationships: []
      }
    }
    Views: {
      jdvcrm_returns_traceability_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          organization_id: string | null
          prospecteur_id: string | null
          quantity: number | null
          reason: string | null
          received_at: string | null
          received_by_user_id: string | null
          refund_amount: number | null
          return_date: string | null
          return_id: string | null
          return_item_id: string | null
          return_number: string | null
          returned_by_name: string | null
          returned_by_role: string | null
          returned_by_user_id: string | null
          sale_id: string | null
          status: string | null
          subwarehouse_code: string | null
          subwarehouse_id: string | null
          subwarehouse_name: string | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_subwarehouse_stock_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          inventory_id: string | null
          minimum_quantity: number | null
          organization_id: string | null
          quantity: number | null
          reserved_quantity: number | null
          subwarehouse_code: string | null
          subwarehouse_id: string | null
          subwarehouse_name: string | null
          updated_at: string | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      payment_providers_catalog: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          provider_type: string | null
          supported_countries: Json | null
          supported_currencies: Json | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          provider_type?: string | null
          supported_countries?: Json | null
          supported_currencies?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          provider_type?: string | null
          supported_countries?: Json | null
          supported_currencies?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _dump_prefix_ddl: { Args: { p_prefix: string }; Returns: string }
      academy_create_assessment_question: {
        Args: {
          p_assessment_id: string
          p_correct_answer?: Json
          p_options?: Json
          p_points?: number
          p_prompt: string
          p_question_order: number
          p_question_type: string
        }
        Returns: string
      }
      academy_grade_submission: {
        Args: { p_submission_id: string }
        Returns: Json
      }
      academy_issue_certificate: {
        Args: { p_course_id: string }
        Returns: Json
      }
      academy_verify_certificate: {
        Args: { p_certificate_code: string }
        Returns: Json
      }
      account_list_sessions: {
        Args: never
        Returns: {
          aal: string
          created_at: string
          id: string
          ip: string
          is_current: boolean
          last_seen_at: string
          user_agent: string
        }[]
      }
      account_revoke_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      ai_add_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_metadata?: Json
          p_model?: string
          p_provider?: string
          p_role: string
          p_token_input?: number
          p_token_output?: number
        }
        Returns: string
      }
      ai_admin_dashboard: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      ai_admin_provider_disable: {
        Args: { p_model: string; p_provider: string }
        Returns: boolean
      }
      ai_admin_provider_upsert: {
        Args: {
          p_display_name?: string
          p_input_cost?: number
          p_is_enabled?: boolean
          p_model: string
          p_output_cost?: number
          p_provider: string
        }
        Returns: string
      }
      ai_check_rate_limit: {
        Args: { p_max_requests?: number; p_window_seconds?: number }
        Returns: Json
      }
      ai_create_conversation: {
        Args: { p_context?: Json; p_organization_id?: string; p_title?: string }
        Returns: string
      }
      ai_estimate_cost: {
        Args: {
          p_model: string
          p_provider: string
          p_tokens_input: number
          p_tokens_output: number
        }
        Returns: number
      }
      ai_get_allowed_models: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      ai_get_context: { Args: never; Returns: Json }
      ai_get_policy: {
        Args: { p_model?: string; p_organization_id?: string }
        Returns: Json
      }
      ai_get_security_status: { Args: never; Returns: Json }
      ai_log_access: {
        Args: {
          p_action_type: string
          p_conversation_id?: string
          p_organization_id?: string
          p_result_count?: number
          p_scope?: string
          p_success?: boolean
        }
        Returns: string
      }
      ai_query_business: {
        Args: { p_limit?: number; p_query?: string; p_scope: string }
        Returns: Json
      }
      ai_record_usage: {
        Args: {
          p_conversation_id?: string
          p_currency_id?: string
          p_estimated_cost?: number
          p_model?: string
          p_organization_id?: string
          p_provider: string
          p_request_reference?: string
          p_tokens_input?: number
          p_tokens_output?: number
        }
        Returns: string
      }
      billing_activate_subscription: {
        Args: {
          p_amount: number
          p_checkout_id?: string
          p_currency: string
          p_metadata?: Json
          p_organization_id: string
          p_plan_code: string
          p_provider: string
          p_provider_reference: string
          p_user_id: string
        }
        Returns: {
          auto_renew: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          module_code: string
          organization_id: string | null
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      billing_backfill_invoice_seller: { Args: never; Returns: number }
      billing_cancel_subscription: {
        Args: {
          p_immediate?: boolean
          p_reason?: string
          p_subscription_id: string
        }
        Returns: {
          auto_renew: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          module_code: string
          organization_id: string | null
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      billing_expire_due_subscriptions: { Args: never; Returns: number }
      billing_my_subscriptions: {
        Args: never
        Returns: {
          auto_renew: boolean
          can_manage: boolean
          cancelled_at: string
          days_left: number
          expires_at: string
          is_effectively_active: boolean
          module_code: string
          organization_id: string
          organization_name: string
          plan_code: string
          plan_name: string
          started_at: string
          status: string
          subject_type: string
          subscription_id: string
        }[]
      }
      billing_send_renewal_reminders: { Args: never; Returns: number }
      billing_set_auto_renew: {
        Args: { p_subscription_id: string; p_value: boolean }
        Returns: undefined
      }
      billing_start_trial: {
        Args: { p_organization_id?: string; p_plan_code: string }
        Returns: {
          auto_renew: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          module_code: string
          organization_id: string | null
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organization_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_register_company: {
        Args: {
          p_address?: string
          p_category_id?: string
          p_city?: string
          p_country_id?: string
          p_currency_id?: string
          p_description?: string
          p_email?: string
          p_name: string
          p_phone?: string
          p_trade_name?: string
          p_website?: string
        }
        Returns: string
      }
      crm_calculate_commission: {
        Args: { p_prospecteur_id: string; p_sale_id: string }
        Returns: {
          amount: number
          business_id: string
          commission_status: Database["public"]["Enums"]["crm_commission_status"]
          created_at: string
          currency_id: string | null
          id: string
          idempotency_key: string | null
          payment_id: string | null
          prospecteur_id: string
          rule_id: string | null
          sale_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crm_commissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_convert_prospect_to_client: {
        Args: { p_prospect_id: string }
        Returns: {
          address: string | null
          business_id: string
          city: string | null
          company_name: string | null
          country_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "business_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_is_business_privileged: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      crm_process_automation_alerts: { Args: never; Returns: number }
      crm_process_prospecteur_stock_alerts: { Args: never; Returns: number }
      crm_prospect_is_mine: {
        Args: { p_prospecteur_id: string }
        Returns: boolean
      }
      crm_record_payment: {
        Args: {
          p_amount: number
          p_business_id: string
          p_client_id: string
          p_currency_id?: string
          p_idempotency_key?: string
          p_jdv_pay_transaction_id?: string
          p_payment_method?: string
          p_sale_id?: string
          p_schedule_id?: string
        }
        Returns: {
          amount: number
          business_id: string
          client_id: string
          created_at: string
          currency_id: string | null
          id: string
          idempotency_key: string | null
          jdv_pay_transaction_id: string | null
          payment_method: string | null
          recorded_by: string
          sale_id: string | null
          schedule_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "crm_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_transfer_stock: {
        Args: {
          p_business_id: string
          p_from_prospecteur_id?: string
          p_product_id: string
          p_quantity: number
          p_reference?: string
          p_to_prospecteur_id: string
        }
        Returns: {
          actor_user_id: string
          business_id: string
          created_at: string
          from_prospecteur_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["crm_stock_movement_type"]
          product_id: string
          quantity: number
          reference: string | null
          sale_id: string | null
          to_prospecteur_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "crm_stock_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dashboard_mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: number
      }
      dashboard_overview: { Args: never; Returns: Json }
      dashboard_toggle_favorite: {
        Args: { p_module_code: string }
        Returns: boolean
      }
      dashboard_touch_module: {
        Args: { p_module_code: string }
        Returns: undefined
      }
      export_module_ddl: { Args: { p_prefix: string }; Returns: string }
      generate_marketplace_order_number: { Args: never; Returns: string }
      health_book_appointment: {
        Args: {
          p_business_id: string
          p_currency_id: string
          p_duration_minutes: number
          p_idempotency_key?: string
          p_price: number
          p_professional_id: string
          p_scheduled_at: string
          p_service_id: string
        }
        Returns: {
          appointment_status: Database["public"]["Enums"]["health_appointment_status"]
          business_id: string | null
          created_at: string
          currency_id: string | null
          duration_minutes: number
          id: string
          idempotency_key: string | null
          notes: string | null
          patient_user_id: string
          price: number | null
          professional_id: string
          scheduled_at: string
          service_id: string | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "health_appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      health_can_access_medical_record: {
        Args: { p_record_id: string }
        Returns: boolean
      }
      health_confirm_appointment_payment: {
        Args: { p_appointment_id: string; p_wallet_transaction_id: string }
        Returns: {
          appointment_status: Database["public"]["Enums"]["health_appointment_status"]
          business_id: string | null
          created_at: string
          currency_id: string | null
          duration_minutes: number
          id: string
          idempotency_key: string | null
          notes: string | null
          patient_user_id: string
          price: number | null
          professional_id: string
          scheduled_at: string
          service_id: string | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "health_appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      health_create_prescription: {
        Args: {
          p_appointment_id: string
          p_items: Json
          p_patient_user_id: string
        }
        Returns: {
          appointment_id: string | null
          created_at: string
          document_id: string | null
          id: string
          patient_user_id: string
          prescriber_professional_id: string
          prescription_status: Database["public"]["Enums"]["health_prescription_status"]
        }
        SetofOptions: {
          from: "*"
          to: "health_prescriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      health_grant_consent: {
        Args: {
          p_expires_at?: string
          p_grantee_business_id: string
          p_grantee_professional_id: string
          p_scope: string
        }
        Returns: {
          consent_status: Database["public"]["Enums"]["health_consent_status"]
          created_at: string
          expires_at: string | null
          granted_at: string
          grantee_business_id: string | null
          grantee_professional_id: string | null
          id: string
          patient_user_id: string
          revoked_at: string | null
          scope: Database["public"]["Enums"]["health_consent_scope"]
        }
        SetofOptions: {
          from: "*"
          to: "health_patient_consents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      health_log_record_access: {
        Args: { p_reason?: string; p_record_id: string }
        Returns: {
          access_reason: string | null
          accessed_at: string
          accessor_user_id: string
          id: string
          record_id: string
        }
        SetofOptions: {
          from: "*"
          to: "health_medical_record_access_log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      health_revoke_consent: {
        Args: { p_consent_id: string }
        Returns: {
          consent_status: Database["public"]["Enums"]["health_consent_status"]
          created_at: string
          expires_at: string | null
          granted_at: string
          grantee_business_id: string | null
          grantee_professional_id: string | null
          id: string
          patient_user_id: string
          revoked_at: string | null
          scope: Database["public"]["Enums"]["health_consent_scope"]
        }
        SetofOptions: {
          from: "*"
          to: "health_patient_consents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      immo_confirm_reservation: {
        Args: { p_reservation_id: string; p_wallet_transaction_id: string }
        Returns: {
          amount: number
          client_user_id: string
          created_at: string
          currency_id: string | null
          expires_at: string | null
          id: string
          idempotency_key: string | null
          property_id: string
          reservation_status: Database["public"]["Enums"]["immo_reservation_status"]
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "immo_reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      immo_record_rent_payment: {
        Args: { p_schedule_id: string; p_wallet_transaction_id: string }
        Returns: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string
          id: string
          lease_id: string
          remaining_amount: number | null
          rent_status: Database["public"]["Enums"]["immo_rent_schedule_status"]
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "immo_rent_schedules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      immo_request_to_crm_prospect: {
        Args: { p_business_id: string; p_request_id: string }
        Returns: {
          address: string | null
          appointment_at: string | null
          archived_at: string | null
          assigned_prospecteur_id: string | null
          business_id: string
          city: string | null
          contact_count: number
          converted_at: string | null
          converted_client_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          desired_product: string | null
          desired_product_code: string | null
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          meeting_place: string | null
          next_follow_up_at: string | null
          phone: string | null
          prospect_status: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount: number | null
          temperature: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crm_prospects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      immo_user_can_access_lease: {
        Args: { p_lease_id: string }
        Returns: boolean
      }
      immo_user_can_access_maintenance_request: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      immo_user_can_manage_property: {
        Args: { p_property_id: string }
        Returns: boolean
      }
      increment_listing_views: {
        Args: { listing_uuid: string }
        Returns: undefined
      }
      insurance_create_customer: {
        Args: {
          p_country_id?: string
          p_email?: string
          p_full_name: string
          p_identity_reference?: string
          p_phone?: string
        }
        Returns: string
      }
      insurance_review_claim: {
        Args: {
          p_approved_amount: number
          p_claim_id: string
          p_status: string
        }
        Returns: undefined
      }
      insurance_submit_claim: {
        Args: {
          p_claim_type: string
          p_claimed_amount: number
          p_currency_id?: string
          p_description: string
          p_incident_date: string
          p_policy_id: string
        }
        Returns: string
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_manager: { Args: { org_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      jdv_can_use_module: { Args: { p_module_code: string }; Returns: boolean }
      jdv_crm_get_my_automation_alerts_v1: {
        Args: { p_limit?: number }
        Returns: {
          action_url: string
          alert_type: string
          created_at: string
          id: string
          last_triggered_at: string
          message: string
          organization_id: string
          title: string
        }[]
      }
      jdv_crm_get_my_notification_preferences_v1: {
        Args: never
        Returns: {
          email_enabled: boolean
          phone_e164: string
          sms_enabled: boolean
          whatsapp_enabled: boolean
        }[]
      }
      jdvcrm_assign_prospecteur_warehouse_v1: {
        Args: {
          p_city?: string
          p_department?: string
          p_organization_id: string
          p_prospecteur_id: string
          p_warehouse_id: string
          p_work_zone?: string
        }
        Returns: string
      }
      jdvcrm_convert_prospect_to_client_v1: {
        Args: { p_prospect_id: string }
        Returns: string
      }
      jdvcrm_create_warehouse_v1: {
        Args: {
          p_address?: string
          p_city?: string
          p_code: string
          p_country?: string
          p_name: string
          p_organization_id: string
        }
        Returns: string
      }
      jdvcrm_ensure_my_portfolio_v1: {
        Args: { p_organization_id: string }
        Returns: string
      }
      jdvcrm_financial_dashboard_v1: {
        Args: {
          p_end_date?: string
          p_organization_id: string
          p_start_date?: string
        }
        Returns: Json
      }
      jdvcrm_get_business_access_v1: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      jdvcrm_get_concepteur_workspace_v1: {
        Args: never
        Returns: {
          branch_code: string
        }[]
      }
      jdvcrm_get_current_subscription_v1: {
        Args: { p_organization_id: string }
        Returns: {
          auto_renew: boolean
          expires_at: string
          is_effectively_active: boolean
          organization_id: string
          plan_code: string
          plan_id: string
          plan_name: string
          started_at: string
          status: string
          subscription_id: string
        }[]
      }
      jdvcrm_report_commissions_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          article_id: string
          base_amount: number
          commission_amount: number
          commission_id: string
          paid_at: string
          prospecteur_id: string
          rate: number
          sale_id: string
          status: string
        }[]
      }
      jdvcrm_report_overdue_v1: {
        Args: { p_organization_id: string }
        Returns: {
          client_id: string
          days_late: number
          due_date: string
          expected_amount: number
          paid_amount: number
          remaining_amount: number
          sale_id: string
          schedule_id: string
          status: string
        }[]
      }
      jdvcrm_report_payments_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          amount: number
          client_id: string
          currency: string
          payment_date: string
          payment_id: string
          payment_method: string
          prospecteur_id: string
          provider: string
          sale_id: string
          status: string
        }[]
      }
      jdvcrm_report_sales_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          amount_paid: number
          amount_remaining: number
          client_id: string
          prospecteur_id: string
          quantity: number
          sale_date: string
          sale_number: string
          sale_type: string
          status: string
          total_amount: number
        }[]
      }
      jdvcrm_transfer_stock_location_v1: {
        Args: {
          p_article_id: string
          p_destination_subwarehouse_id?: string
          p_destination_warehouse_id?: string
          p_notes?: string
          p_quantity: number
          p_source_subwarehouse_id?: string
          p_source_warehouse_id: string
        }
        Returns: string
      }
      jdvpi_require_active_account: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      kyc_admin_log_view: {
        Args: { p_document_id: string }
        Returns: undefined
      }
      kyc_admin_queue: {
        Args: { p_status?: string }
        Returns: {
          documents: Json
          email: string
          full_name: string
          kyc_level: string
          kyc_status: string
          submitted_at: string
          user_id: string
        }[]
      }
      kyc_my_status: { Args: never; Returns: Json }
      kyc_object_count: { Args: { p_uid: string }; Returns: number }
      kyc_register_document: {
        Args: { p_document_type: string; p_storage_path: string }
        Returns: {
          created_at: string
          document_status: Database["public"]["Enums"]["kyc_status"]
          document_type: string
          file_url: string
          id: string
          kyc_profile_id: string
          notes: string | null
          reviewed_at: string | null
          submitted_at: string
        }
        SetofOptions: {
          from: "*"
          to: "kyc_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      kyc_review: {
        Args: {
          p_decision: string
          p_level?: string
          p_notes?: string
          p_user_id: string
          p_valid_years?: number
        }
        Returns: Json
      }
      kyc_submit: { Args: never; Returns: Json }
      marketplace_create_order: {
        Args: {
          p_delivery_address_id?: string
          p_idempotency_key?: string
          p_items: Json
          p_notes?: string
          p_seller_id: string
        }
        Returns: string
      }
      marketplace_public_store: {
        Args: { p_slug: string }
        Returns: {
          city: string
          country_id: string
          cover_url: string
          description: string
          id: string
          is_verified: boolean
          logo_url: string
          rating_average: number
          rating_count: number
          shop_name: string
          shop_slug: string
          total_sales: number
        }[]
      }
      org_is_owned_by_me: { Args: { p_org: string }; Returns: boolean }
      passenger_can_view_transport_driver: {
        Args: { p_driver_id: string }
        Returns: boolean
      }
      pay_beneficiary_is_member: {
        Args: { p_beneficiary_id: string }
        Returns: boolean
      }
      pay_check_limits: {
        Args: {
          p_amount: number
          p_currency: string
          p_op: string
          p_user: string
        }
        Returns: undefined
      }
      pay_compute_fee: {
        Args: { p_amount: number; p_currency_id: string; p_operation: string }
        Returns: number
      }
      pay_credit_deposit: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_provider: string
          p_provider_transaction_id: string
          p_reference: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency_id: string
          description: string | null
          external_reference: string | null
          fee_amount: number
          fee_currency_id: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_transaction_id: string | null
          reference: string | null
          related_transaction_id: string | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_ensure_user_wallets: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      pay_execute_internal_transfer: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      pay_get_or_create_wallet: {
        Args: { p_currency_id: string; p_organization_id?: string }
        Returns: {
          available_balance: number
          balance: number
          created_at: string
          currency_id: string
          id: string
          organization_id: string | null
          pending_balance: number
          updated_at: string
          user_id: string
          wallet_status: Database["public"]["Enums"]["wallet_status"]
        }
        SetofOptions: {
          from: "*"
          to: "wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_get_payment_request: { Args: { p_request_id: string }; Returns: Json }
      pay_is_privileged: { Args: never; Returns: boolean }
      pay_post_wallet_transaction: {
        Args: {
          p_amount: number
          p_description?: string
          p_external_reference?: string
          p_fee_amount?: number
          p_metadata?: Json
          p_provider?: string
          p_provider_transaction_id?: string
          p_reference: string
          p_transaction_status?: Database["public"]["Enums"]["transaction_status"]
          p_transaction_type: Database["public"]["Enums"]["transaction_type"]
          p_wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency_id: string
          description: string | null
          external_reference: string | null
          fee_amount: number
          fee_currency_id: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_transaction_id: string | null
          reference: string | null
          related_transaction_id: string | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_quote_transfer: {
        Args: { p_amount: number; p_wallet_id: string }
        Returns: Json
      }
      pay_resolve_recipient: {
        Args: { p_beneficiary_id: string }
        Returns: string
      }
      pay_settle_payment_request: {
        Args: { p_amount?: number; p_request_id: string; p_wallet_id?: string }
        Returns: Json
      }
      platform_review_moderate: {
        Args: { p_review_id: string; p_status: string }
        Returns: undefined
      }
      pub_submit_campaign: {
        Args: { p_campaign_id: string }
        Returns: {
          advertiser_id: string
          ai_assisted: boolean
          brand_name: string | null
          budget_amount: number
          call_to_action: string | null
          created_at: string
          currency_id: string | null
          destination_url: string | null
          ends_at: string | null
          format: string
          headline: string | null
          id: string
          message: string | null
          name: string
          objective: string | null
          pricing_model: string
          starts_at: string | null
          status: string
          submitted_at: string | null
          targeting: Json
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pub_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      public_branch_plans: {
        Args: { p_module_code?: string }
        Returns: {
          code: string
          currency: string
          description: string
          duration_days: number
          highlights: Json
          is_featured: boolean
          limits: Json
          module_code: string
          name: string
          price: number
          sort_order: number
          trial_days: number
        }[]
      }
      public_platform_review_stats: {
        Args: never
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
      public_platform_reviews: {
        Args: { p_limit?: number }
        Returns: {
          comment: string
          created_at: string
          display_name: string
          id: string
          rating: number
          title: string
        }[]
      }
      public_submit_contact_message: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_subject: string
        }
        Returns: undefined
      }
      social_has_group_request: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      social_is_group_admin: { Args: { p_group_id: string }; Returns: boolean }
      social_is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      social_is_group_public: { Args: { p_group_id: string }; Returns: boolean }
      tontine_apply_late_penalties: {
        Args: { p_cycle_id: string }
        Returns: number
      }
      tontine_approve_member: {
        Args: { p_approve: boolean; p_member_id: string }
        Returns: boolean
      }
      tontine_claim_due_dispatch: {
        Args: { p_dispatch_id: string }
        Returns: Json
      }
      tontine_confirm_dispatch: {
        Args: {
          p_dispatch_id: string
          p_provider_reference: string
          p_provider_request_id?: string
        }
        Returns: Json
      }
      tontine_create: {
        Args: {
          p_contribution_amount: number
          p_country_id: string
          p_currency_id: string
          p_cycle_periods: number
          p_description: string
          p_frequency: string
          p_late_fee_amount?: number
          p_member_limit: number
          p_name: string
          p_organization_id: string
          p_rules?: Json
          p_starts_on: string
        }
        Returns: string
      }
      tontine_create_group: {
        Args: {
          p_contribution_amount: number
          p_country_id: string
          p_currency_id: string
          p_cycle_periods: number
          p_description: string
          p_frequency: string
          p_late_fee_amount?: number
          p_link_expires_at?: string
          p_member_limit: number
          p_name: string
          p_organization_id: string
          p_rules?: Json
          p_starts_on: string
        }
        Returns: Json
      }
      tontine_create_individual_draft: {
        Args: {
          p_accept_contract?: boolean
          p_accept_rules?: boolean
          p_contribution_amount: number
          p_currency_id: string
          p_cycle_periods: number
          p_description: string
          p_frequency: string
          p_late_fee_amount?: number
          p_name: string
          p_organization_id: string
        }
        Returns: Json
      }
      tontine_create_join_link: {
        Args: {
          p_expires_at?: string
          p_max_uses?: number
          p_revoke_previous?: boolean
          p_tontine_id: string
        }
        Returns: Json
      }
      tontine_credit_beneficiary_wallet: {
        Args: {
          p_amount: number
          p_currency_id: string
          p_description: string
          p_metadata?: Json
          p_organization_id: string
          p_reference: string
          p_user_id: string
        }
        Returns: string
      }
      tontine_dashboard: { Args: { p_tontine_id: string }; Returns: Json }
      tontine_generate_payout: {
        Args: { p_amount: number; p_rotation_id: string }
        Returns: string
      }
      tontine_invite_info: { Args: { p_join_token: string }; Returns: Json }
      tontine_join_by_link: {
        Args: {
          p_accept_contract: boolean
          p_accept_rules: boolean
          p_join_token: string
        }
        Returns: string
      }
      tontine_member_label: { Args: { p_user: string }; Returns: string }
      tontine_my_groups: { Args: never; Returns: Json }
      tontine_open_cycle: {
        Args: { p_ends_on: string; p_starts_on: string; p_tontine_id: string }
        Returns: string
      }
      tontine_open_next_cycle_system: {
        Args: { p_previous_cycle_id: string; p_tontine_id: string }
        Returns: string
      }
      tontine_overview: { Args: { p_tontine_id: string }; Returns: Json }
      tontine_pay_contribution: {
        Args: { p_amount?: number; p_schedule_id: string; p_wallet_id?: string }
        Returns: Json
      }
      tontine_pool_balance: { Args: { p_tontine_id: string }; Returns: number }
      tontine_process_due_operations: { Args: never; Returns: Json }
      tontine_process_wallet_payouts: { Args: never; Returns: number }
      tontine_program_collection: {
        Args: { p_cycle_id: string; p_rotation_plan: Json }
        Returns: boolean
      }
      tontine_queue_due_payouts: { Args: never; Returns: number }
      tontine_reconcile_dispatch: {
        Args: {
          p_dispatch_id: string
          p_provider_amount?: number
          p_provider_currency_code?: string
          p_provider_payload_hash?: string
          p_provider_reference: string
          p_provider_request_id?: string
          p_provider_status?: string
        }
        Returns: Json
      }
      tontine_record_contribution: {
        Args: {
          p_amount: number
          p_currency_id: string
          p_external_reference?: string
          p_payment_request_id?: string
          p_schedule_id: string
          p_wallet_transaction_id?: string
        }
        Returns: string
      }
      tontine_record_dispatch_failure: {
        Args: {
          p_dispatch_id: string
          p_error: string
          p_retry_after_minutes?: number
        }
        Returns: Json
      }
      tontine_record_dispatch_sent: {
        Args: {
          p_dispatch_id: string
          p_provider_reference?: string
          p_provider_request_id: string
        }
        Returns: Json
      }
      tontine_request_membership: {
        Args: { p_tontine_id: string }
        Returns: string
      }
      tontine_reverse_dispatch: {
        Args: {
          p_dispatch_id: string
          p_provider_currency_code?: string
          p_provider_reference: string
          p_provider_request_id?: string
          p_reason?: string
          p_returned_amount?: number
        }
        Returns: Json
      }
      tontine_send_due_reminders: { Args: never; Returns: number }
      tontine_set_class_draft: {
        Args: { p_tontine_class: string; p_tontine_id: string }
        Returns: Json
      }
      tontine_set_payout_mode: {
        Args: { p_mode: string; p_tontine_id: string }
        Returns: undefined
      }
      tontine_set_status: {
        Args: { p_status: string; p_tontine_id: string }
        Returns: Json
      }
      transit_accept_quote: {
        Args: { p_quote_id: string }
        Returns: {
          business_id: string | null
          case_status: Database["public"]["Enums"]["transit_case_status"]
          client_user_id: string
          created_at: string
          destination_city: string | null
          destination_country_id: string | null
          id: string
          mode: Database["public"]["Enums"]["transit_mode"]
          operation_type: Database["public"]["Enums"]["transit_operation_type"]
          origin_city: string | null
          origin_country_id: string | null
          reference: string | null
          responsible_user_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transit_operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transit_add_tracking_event: {
        Args: {
          p_comment?: string
          p_location?: string
          p_shipment_id: string
          p_source_reference?: string
          p_status: string
        }
        Returns: {
          actor_user_id: string | null
          comment: string | null
          created_at: string
          event_status: Database["public"]["Enums"]["transit_tracking_status"]
          id: string
          location: string | null
          shipment_id: string
          source_reference: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transit_tracking_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transit_has_operation_access: {
        Args: { p_operation_id: string }
        Returns: boolean
      }
      transit_has_shipment_access: {
        Args: { p_shipment_id: string }
        Returns: boolean
      }
      transit_record_invoice_payment: {
        Args: { p_invoice_id: string; p_wallet_transaction_id: string }
        Returns: {
          amount: number
          business_id: string
          client_user_id: string
          created_at: string
          currency_id: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_status: Database["public"]["Enums"]["transit_invoice_status"]
          operation_id: string | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transit_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transit_request_to_crm_prospect: {
        Args: { p_business_id: string; p_request_id: string }
        Returns: {
          address: string | null
          appointment_at: string | null
          archived_at: string | null
          assigned_prospecteur_id: string | null
          business_id: string
          city: string | null
          contact_count: number
          converted_at: string | null
          converted_client_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          desired_product: string | null
          desired_product_code: string | null
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          meeting_place: string | null
          next_follow_up_at: string | null
          phone: string | null
          prospect_status: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount: number | null
          temperature: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crm_prospects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_accept_booking: {
        Args: { p_booking_id: string; p_driver_id: string }
        Returns: {
          booking_status: Database["public"]["Enums"]["transport_booking_status"]
          business_id: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          currency_id: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          passengers_count: number
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          reference: string | null
          scheduled_at: string | null
          service_type_id: string
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transport_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_add_delivery_event: {
        Args: {
          p_comment?: string
          p_delivery_id: string
          p_location?: string
          p_status: string
        }
        Returns: {
          actor_user_id: string | null
          comment: string | null
          created_at: string
          delivery_id: string
          event_status: Database["public"]["Enums"]["transport_delivery_status"]
          id: string
          location: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transport_delivery_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_calculate_price: {
        Args: {
          p_business_id?: string
          p_country_id: string
          p_distance_km: number
          p_duration_minutes: number
          p_is_night?: boolean
          p_service_type_id: string
          p_vehicle_type_id: string
        }
        Returns: number
      }
      transport_complete_booking: {
        Args: {
          p_actual_distance_km: number
          p_actual_duration_minutes: number
          p_booking_id: string
        }
        Returns: {
          booking_status: Database["public"]["Enums"]["transport_booking_status"]
          business_id: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          currency_id: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          passengers_count: number
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          reference: string | null
          scheduled_at: string | null
          service_type_id: string
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transport_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_confirm_payment: {
        Args: { p_booking_id: string; p_wallet_transaction_id: string }
        Returns: {
          booking_status: Database["public"]["Enums"]["transport_booking_status"]
          business_id: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          currency_id: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          passengers_count: number
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          reference: string | null
          scheduled_at: string | null
          service_type_id: string
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transport_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_estimate_price: {
        Args: {
          p_business_id: string
          p_distance_km: number
          p_duration_minutes: number
          p_is_night?: boolean
          p_service_type_id: string
          p_vehicle_type_id: string
        }
        Returns: number
      }
      transport_request_to_crm_prospect: {
        Args: { p_business_id: string; p_request_id: string }
        Returns: {
          address: string | null
          appointment_at: string | null
          archived_at: string | null
          assigned_prospecteur_id: string | null
          business_id: string
          city: string | null
          contact_count: number
          converted_at: string | null
          converted_client_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          desired_product: string | null
          desired_product_code: string | null
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          meeting_place: string | null
          next_follow_up_at: string | null
          phone: string | null
          prospect_status: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount: number | null
          temperature: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crm_prospects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_reserve_seat:
        | {
            Args: {
              p_currency_id: string
              p_idempotency_key?: string
              p_price: number
              p_schedule_id: string
              p_seat_id: string
            }
            Returns: {
              created_at: string
              currency_id: string | null
              id: string
              idempotency_key: string | null
              passenger_user_id: string
              price: number
              reservation_status: string
              schedule_id: string
              seat_id: string
              wallet_transaction_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "transport_seat_reservations"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_currency_id: string
              p_idempotency_key?: string
              p_price: number
              p_seat_id: string
            }
            Returns: {
              created_at: string
              currency_id: string | null
              id: string
              idempotency_key: string | null
              passenger_user_id: string
              price: number
              reservation_status: string
              schedule_id: string
              seat_id: string
              wallet_transaction_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "transport_seat_reservations"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      transport_set_driver_availability: {
        Args: {
          p_availability_status: Database["public"]["Enums"]["transport_availability_status"]
          p_latitude?: number
          p_longitude?: number
        }
        Returns: {
          availability_status: Database["public"]["Enums"]["transport_availability_status"]
          current_latitude: number | null
          current_longitude: number | null
          driver_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transport_driver_availability"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transport_update_booking_status: {
        Args: { p_booking_id: string; p_new_status: string }
        Returns: {
          booking_status: Database["public"]["Enums"]["transport_booking_status"]
          business_id: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          currency_id: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          idempotency_key: string | null
          passenger_user_id: string
          passengers_count: number
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          reference: string | null
          scheduled_at: string | null
          service_type_id: string
          updated_at: string
          vehicle_id: string | null
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transport_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      travel_confirm_booking: {
        Args: { p_booking_id: string; p_wallet_transaction_id: string }
        Returns: {
          amount: number
          booking_status: Database["public"]["Enums"]["travel_booking_status"]
          business_id: string | null
          buyer_user_id: string
          created_at: string
          currency_id: string | null
          end_date: string | null
          id: string
          idempotency_key: string | null
          quote_id: string | null
          reference: string | null
          resource_id: string
          resource_type: Database["public"]["Enums"]["travel_resource_type"]
          start_date: string | null
          travelers_count: number
          updated_at: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "travel_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      travel_request_to_crm_prospect: {
        Args: { p_business_id: string; p_request_id: string }
        Returns: {
          address: string | null
          appointment_at: string | null
          archived_at: string | null
          assigned_prospecteur_id: string | null
          business_id: string
          city: string | null
          contact_count: number
          converted_at: string | null
          converted_client_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          desired_product: string | null
          desired_product_code: string | null
          email: string | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          meeting_place: string | null
          next_follow_up_at: string | null
          phone: string | null
          prospect_status: Database["public"]["Enums"]["crm_prospect_status"]
          requested_amount: number | null
          temperature: Database["public"]["Enums"]["crm_prospect_temperature"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "crm_prospects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_business_access: {
        Args: { p_business_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status:
        | "active"
        | "pending"
        | "suspended"
        | "restricted"
        | "deleted"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      beneficiary_type:
        | "individual"
        | "business"
        | "mobile_money"
        | "bank_account"
      business_member_role:
        | "OWNER"
        | "ADMIN"
        | "MANAGER"
        | "ACCOUNTANT"
        | "SALES"
        | "CASHIER"
        | "EMPLOYEE"
        | "VIEWER"
      business_status: "draft" | "active" | "suspended" | "archived"
      crm_activity_type:
        | "visit"
        | "call"
        | "whatsapp"
        | "email"
        | "appointment"
        | "follow_up"
        | "delivery"
        | "collection"
        | "other"
      crm_appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "missed"
      crm_collection_activity_type:
        | "call"
        | "whatsapp"
        | "visit"
        | "reminder"
        | "payment"
        | "promise"
        | "comment"
      crm_commission_basis:
        | "sale_amount"
        | "collected_amount"
        | "fixed"
        | "per_unit"
      crm_commission_status: "pending" | "approved" | "paid" | "cancelled"
      crm_promise_status: "pending" | "kept" | "broken" | "cancelled"
      crm_prospect_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
        | "archived"
      crm_prospect_temperature: "hot" | "warm" | "cold"
      crm_prospecteur_status: "active" | "inactive" | "suspended"
      crm_schedule_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      crm_stock_movement_type:
        | "transfer"
        | "reception"
        | "sale"
        | "return"
        | "adjustment"
      crm_target_period: "daily" | "weekly" | "monthly" | "yearly"
      expense_status: "pending" | "approved" | "rejected" | "paid"
      health_appointment_status:
        | "requested"
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
        | "rescheduled"
        | "rejected"
      health_consent_scope:
        | "medical_records"
        | "lab_results"
        | "prescriptions"
        | "full"
      health_consent_status: "active" | "revoked" | "expired"
      health_document_category:
        | "medical_report"
        | "lab_result"
        | "prescription"
        | "imaging"
        | "invoice"
        | "insurance_document"
        | "identity_document"
        | "professional_document"
        | "administrative_document"
        | "other"
      health_home_care_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      health_invoice_status: "pending" | "paid" | "cancelled" | "refunded"
      health_lab_status:
        | "requested"
        | "scheduled"
        | "sample_collected"
        | "processing"
        | "completed"
        | "cancelled"
      health_prescription_status:
        | "active"
        | "completed"
        | "cancelled"
        | "expired"
      health_provider_type:
        | "clinic"
        | "hospital"
        | "pharmacy"
        | "laboratory"
        | "diagnostic_center"
        | "home_care_provider"
        | "other"
      health_verification_status:
        | "pending"
        | "under_review"
        | "verified"
        | "rejected"
        | "suspended"
      immo_appointment_status:
        | "requested"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "missed"
      immo_commission_status: "pending" | "approved" | "paid" | "cancelled"
      immo_lease_status: "draft" | "active" | "expired" | "terminated"
      immo_offer_status:
        | "submitted"
        | "under_review"
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "expired"
      immo_project_status:
        | "planned"
        | "under_construction"
        | "completed"
        | "delivered"
        | "suspended"
      immo_property_status:
        | "draft"
        | "pending_review"
        | "published"
        | "reserved"
        | "rented"
        | "sold"
        | "unavailable"
        | "suspended"
        | "archived"
      immo_rent_schedule_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
      immo_report_status: "pending" | "approved" | "rejected" | "suspended"
      immo_request_status:
        | "open"
        | "matched"
        | "converted"
        | "closed"
        | "cancelled"
      immo_reservation_status:
        | "pending"
        | "confirmed"
        | "expired"
        | "cancelled"
        | "refunded"
      immo_transaction_type:
        | "rent"
        | "sale"
        | "short_term_rental"
        | "reservation"
        | "lease_to_own"
      immo_unit_status:
        | "available"
        | "reserved"
        | "sold"
        | "rented"
        | "unavailable"
      immo_verification_status:
        | "unverified"
        | "submitted"
        | "under_review"
        | "verified"
        | "rejected"
        | "suspended"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
      kyc_level: "unverified" | "basic" | "verified" | "enhanced"
      kyc_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      lang_direction: "ltr" | "rtl"
      marketplace_listing_status:
        | "draft"
        | "pending_review"
        | "published"
        | "paused"
        | "sold_out"
        | "archived"
        | "rejected"
      marketplace_message_status: "sent" | "delivered" | "read"
      marketplace_order_status:
        | "pending"
        | "awaiting_payment"
        | "paid"
        | "confirmed"
        | "preparing"
        | "ready"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "returned"
      marketplace_refund_status:
        | "pending"
        | "approved"
        | "rejected"
        | "processing"
        | "completed"
        | "failed"
      marketplace_return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "received"
        | "refunded"
        | "failed"
      marketplace_review_status: "pending" | "published" | "rejected" | "hidden"
      marketplace_seller_status: "pending" | "active" | "suspended" | "rejected"
      marketplace_settlement_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      module_status:
        | "planned"
        | "development"
        | "active"
        | "maintenance"
        | "disabled"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "security"
        | "transaction"
        | "marketing"
        | "system"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "ready"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      org_member_status: "active" | "suspended" | "invited" | "removed"
      payment_request_status: "pending" | "paid" | "expired" | "cancelled"
      sale_status:
        | "pending"
        | "confirmed"
        | "paid"
        | "partially_paid"
        | "cancelled"
        | "refunded"
      subscription_frequency:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      subscription_status: "active" | "paused" | "cancelled" | "expired"
      super_admin_status: "active" | "suspended" | "revoked"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "reversed"
        | "refunded"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "payment"
        | "transfer_out"
        | "transfer_in"
        | "refund"
        | "exchange"
        | "fee"
        | "adjustment"
        | "cashback"
      transfer_type: "national" | "regional" | "international"
      transit_case_status:
        | "draft"
        | "submitted"
        | "processing"
        | "awaiting_documents"
        | "awaiting_customs"
        | "in_transit"
        | "arrived"
        | "cleared"
        | "ready_for_delivery"
        | "delivered"
        | "cancelled"
        | "closed"
      transit_container_type:
        | "dry"
        | "reefer"
        | "open_top"
        | "flat_rack"
        | "other"
      transit_customs_status:
        | "pending"
        | "submitted"
        | "under_review"
        | "information_requested"
        | "cleared"
        | "rejected"
        | "on_hold"
      transit_invoice_status:
        | "draft"
        | "issued"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      transit_location_type:
        | "port"
        | "airport"
        | "warehouse"
        | "border"
        | "terminal"
        | "hub"
      transit_logistic_unit_type:
        | "pallet"
        | "crate"
        | "carton"
        | "bag"
        | "container"
        | "package"
      transit_mode: "road" | "sea" | "air" | "rail" | "multimodal"
      transit_operation_type:
        | "import"
        | "export"
        | "transit"
        | "national"
        | "international"
      transit_partner_type:
        | "carrier"
        | "forwarder"
        | "warehouse_operator"
        | "handler"
        | "agent"
        | "supplier"
        | "service_provider"
      transit_payment_schedule_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      transit_quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      transit_request_status:
        | "open"
        | "quoted"
        | "converted"
        | "closed"
        | "cancelled"
      transit_tracking_status:
        | "created"
        | "picked_up"
        | "loaded"
        | "departed"
        | "in_transit"
        | "arrived_port"
        | "customs_processing"
        | "cleared"
        | "warehouse"
        | "out_for_delivery"
        | "delivered"
      transport_availability_status: "online" | "offline" | "busy" | "scheduled"
      transport_booking_status:
        | "requested"
        | "searching"
        | "accepted"
        | "driver_arriving"
        | "driver_arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "failed"
      transport_delivery_status:
        | "created"
        | "awaiting_pickup"
        | "picked_up"
        | "in_transit"
        | "arrived"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "cancelled"
        | "returned"
      transport_driver_status:
        | "pending"
        | "active"
        | "unavailable"
        | "suspended"
        | "rejected"
        | "inactive"
      transport_rental_status:
        | "pending"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
      transport_request_status:
        | "open"
        | "quoted"
        | "converted"
        | "closed"
        | "cancelled"
      transport_review_status: "pending" | "published" | "rejected" | "hidden"
      transport_review_target: "driver" | "vehicle" | "delivery" | "rental"
      transport_seat_status: "available" | "reserved" | "blocked"
      transport_vehicle_status:
        | "active"
        | "maintenance"
        | "suspended"
        | "retired"
      transport_verification_status:
        | "unverified"
        | "submitted"
        | "under_review"
        | "verified"
        | "rejected"
        | "suspended"
      travel_booking_status:
        | "pending"
        | "awaiting_payment"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "expired"
        | "refunded"
        | "partially_refunded"
      travel_publish_status: "draft" | "published" | "unavailable" | "archived"
      travel_quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
      travel_request_status:
        | "open"
        | "quoted"
        | "converted"
        | "closed"
        | "cancelled"
      travel_resource_type: "room" | "activity" | "tour"
      travel_review_status: "pending" | "published" | "rejected" | "hidden"
      travel_target_type:
        | "destination"
        | "accommodation"
        | "activity"
        | "tour"
        | "agency"
        | "guide"
      travel_verification_status:
        | "unverified"
        | "submitted"
        | "under_review"
        | "verified"
        | "rejected"
        | "suspended"
      wallet_status: "active" | "suspended" | "locked" | "closed"
      webhook_event_status:
        | "received"
        | "processing"
        | "processed"
        | "failed"
        | "ignored"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: [
        "active",
        "pending",
        "suspended",
        "restricted",
        "deleted",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      beneficiary_type: [
        "individual",
        "business",
        "mobile_money",
        "bank_account",
      ],
      business_member_role: [
        "OWNER",
        "ADMIN",
        "MANAGER",
        "ACCOUNTANT",
        "SALES",
        "CASHIER",
        "EMPLOYEE",
        "VIEWER",
      ],
      business_status: ["draft", "active", "suspended", "archived"],
      crm_activity_type: [
        "visit",
        "call",
        "whatsapp",
        "email",
        "appointment",
        "follow_up",
        "delivery",
        "collection",
        "other",
      ],
      crm_appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "missed",
      ],
      crm_collection_activity_type: [
        "call",
        "whatsapp",
        "visit",
        "reminder",
        "payment",
        "promise",
        "comment",
      ],
      crm_commission_basis: [
        "sale_amount",
        "collected_amount",
        "fixed",
        "per_unit",
      ],
      crm_commission_status: ["pending", "approved", "paid", "cancelled"],
      crm_promise_status: ["pending", "kept", "broken", "cancelled"],
      crm_prospect_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
        "archived",
      ],
      crm_prospect_temperature: ["hot", "warm", "cold"],
      crm_prospecteur_status: ["active", "inactive", "suspended"],
      crm_schedule_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      crm_stock_movement_type: [
        "transfer",
        "reception",
        "sale",
        "return",
        "adjustment",
      ],
      crm_target_period: ["daily", "weekly", "monthly", "yearly"],
      expense_status: ["pending", "approved", "rejected", "paid"],
      health_appointment_status: [
        "requested",
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
        "rescheduled",
        "rejected",
      ],
      health_consent_scope: [
        "medical_records",
        "lab_results",
        "prescriptions",
        "full",
      ],
      health_consent_status: ["active", "revoked", "expired"],
      health_document_category: [
        "medical_report",
        "lab_result",
        "prescription",
        "imaging",
        "invoice",
        "insurance_document",
        "identity_document",
        "professional_document",
        "administrative_document",
        "other",
      ],
      health_home_care_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      health_invoice_status: ["pending", "paid", "cancelled", "refunded"],
      health_lab_status: [
        "requested",
        "scheduled",
        "sample_collected",
        "processing",
        "completed",
        "cancelled",
      ],
      health_prescription_status: [
        "active",
        "completed",
        "cancelled",
        "expired",
      ],
      health_provider_type: [
        "clinic",
        "hospital",
        "pharmacy",
        "laboratory",
        "diagnostic_center",
        "home_care_provider",
        "other",
      ],
      health_verification_status: [
        "pending",
        "under_review",
        "verified",
        "rejected",
        "suspended",
      ],
      immo_appointment_status: [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "missed",
      ],
      immo_commission_status: ["pending", "approved", "paid", "cancelled"],
      immo_lease_status: ["draft", "active", "expired", "terminated"],
      immo_offer_status: [
        "submitted",
        "under_review",
        "accepted",
        "rejected",
        "withdrawn",
        "expired",
      ],
      immo_project_status: [
        "planned",
        "under_construction",
        "completed",
        "delivered",
        "suspended",
      ],
      immo_property_status: [
        "draft",
        "pending_review",
        "published",
        "reserved",
        "rented",
        "sold",
        "unavailable",
        "suspended",
        "archived",
      ],
      immo_rent_schedule_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
      ],
      immo_report_status: ["pending", "approved", "rejected", "suspended"],
      immo_request_status: [
        "open",
        "matched",
        "converted",
        "closed",
        "cancelled",
      ],
      immo_reservation_status: [
        "pending",
        "confirmed",
        "expired",
        "cancelled",
        "refunded",
      ],
      immo_transaction_type: [
        "rent",
        "sale",
        "short_term_rental",
        "reservation",
        "lease_to_own",
      ],
      immo_unit_status: [
        "available",
        "reserved",
        "sold",
        "rented",
        "unavailable",
      ],
      immo_verification_status: [
        "unverified",
        "submitted",
        "under_review",
        "verified",
        "rejected",
        "suspended",
      ],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      invoice_status: [
        "draft",
        "issued",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
      kyc_level: ["unverified", "basic", "verified", "enhanced"],
      kyc_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      lang_direction: ["ltr", "rtl"],
      marketplace_listing_status: [
        "draft",
        "pending_review",
        "published",
        "paused",
        "sold_out",
        "archived",
        "rejected",
      ],
      marketplace_message_status: ["sent", "delivered", "read"],
      marketplace_order_status: [
        "pending",
        "awaiting_payment",
        "paid",
        "confirmed",
        "preparing",
        "ready",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
        "refunded",
        "returned",
      ],
      marketplace_refund_status: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "completed",
        "failed",
      ],
      marketplace_return_status: [
        "requested",
        "approved",
        "rejected",
        "received",
        "refunded",
        "failed",
      ],
      marketplace_review_status: ["pending", "published", "rejected", "hidden"],
      marketplace_seller_status: ["pending", "active", "suspended", "rejected"],
      marketplace_settlement_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      module_status: [
        "planned",
        "development",
        "active",
        "maintenance",
        "disabled",
      ],
      notification_type: [
        "info",
        "success",
        "warning",
        "error",
        "security",
        "transaction",
        "marketing",
        "system",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      org_member_status: ["active", "suspended", "invited", "removed"],
      payment_request_status: ["pending", "paid", "expired", "cancelled"],
      sale_status: [
        "pending",
        "confirmed",
        "paid",
        "partially_paid",
        "cancelled",
        "refunded",
      ],
      subscription_frequency: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      subscription_status: ["active", "paused", "cancelled", "expired"],
      super_admin_status: ["active", "suspended", "revoked"],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "reversed",
        "refunded",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "payment",
        "transfer_out",
        "transfer_in",
        "refund",
        "exchange",
        "fee",
        "adjustment",
        "cashback",
      ],
      transfer_type: ["national", "regional", "international"],
      transit_case_status: [
        "draft",
        "submitted",
        "processing",
        "awaiting_documents",
        "awaiting_customs",
        "in_transit",
        "arrived",
        "cleared",
        "ready_for_delivery",
        "delivered",
        "cancelled",
        "closed",
      ],
      transit_container_type: [
        "dry",
        "reefer",
        "open_top",
        "flat_rack",
        "other",
      ],
      transit_customs_status: [
        "pending",
        "submitted",
        "under_review",
        "information_requested",
        "cleared",
        "rejected",
        "on_hold",
      ],
      transit_invoice_status: [
        "draft",
        "issued",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      transit_location_type: [
        "port",
        "airport",
        "warehouse",
        "border",
        "terminal",
        "hub",
      ],
      transit_logistic_unit_type: [
        "pallet",
        "crate",
        "carton",
        "bag",
        "container",
        "package",
      ],
      transit_mode: ["road", "sea", "air", "rail", "multimodal"],
      transit_operation_type: [
        "import",
        "export",
        "transit",
        "national",
        "international",
      ],
      transit_partner_type: [
        "carrier",
        "forwarder",
        "warehouse_operator",
        "handler",
        "agent",
        "supplier",
        "service_provider",
      ],
      transit_payment_schedule_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      transit_quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      transit_request_status: [
        "open",
        "quoted",
        "converted",
        "closed",
        "cancelled",
      ],
      transit_tracking_status: [
        "created",
        "picked_up",
        "loaded",
        "departed",
        "in_transit",
        "arrived_port",
        "customs_processing",
        "cleared",
        "warehouse",
        "out_for_delivery",
        "delivered",
      ],
      transport_availability_status: ["online", "offline", "busy", "scheduled"],
      transport_booking_status: [
        "requested",
        "searching",
        "accepted",
        "driver_arriving",
        "driver_arrived",
        "in_progress",
        "completed",
        "cancelled",
        "failed",
      ],
      transport_delivery_status: [
        "created",
        "awaiting_pickup",
        "picked_up",
        "in_transit",
        "arrived",
        "out_for_delivery",
        "delivered",
        "failed",
        "cancelled",
        "returned",
      ],
      transport_driver_status: [
        "pending",
        "active",
        "unavailable",
        "suspended",
        "rejected",
        "inactive",
      ],
      transport_rental_status: [
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
      ],
      transport_request_status: [
        "open",
        "quoted",
        "converted",
        "closed",
        "cancelled",
      ],
      transport_review_status: ["pending", "published", "rejected", "hidden"],
      transport_review_target: ["driver", "vehicle", "delivery", "rental"],
      transport_seat_status: ["available", "reserved", "blocked"],
      transport_vehicle_status: [
        "active",
        "maintenance",
        "suspended",
        "retired",
      ],
      transport_verification_status: [
        "unverified",
        "submitted",
        "under_review",
        "verified",
        "rejected",
        "suspended",
      ],
      travel_booking_status: [
        "pending",
        "awaiting_payment",
        "confirmed",
        "cancelled",
        "completed",
        "expired",
        "refunded",
        "partially_refunded",
      ],
      travel_publish_status: ["draft", "published", "unavailable", "archived"],
      travel_quote_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
      ],
      travel_request_status: [
        "open",
        "quoted",
        "converted",
        "closed",
        "cancelled",
      ],
      travel_resource_type: ["room", "activity", "tour"],
      travel_review_status: ["pending", "published", "rejected", "hidden"],
      travel_target_type: [
        "destination",
        "accommodation",
        "activity",
        "tour",
        "agency",
        "guide",
      ],
      travel_verification_status: [
        "unverified",
        "submitted",
        "under_review",
        "verified",
        "rejected",
        "suspended",
      ],
      wallet_status: ["active", "suspended", "locked", "closed"],
      webhook_event_status: [
        "received",
        "processing",
        "processed",
        "failed",
        "ignored",
      ],
    },
  },
} as const
