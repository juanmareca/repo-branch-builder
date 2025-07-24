export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string | null
          end_date: string | null
          hours_allocated: number
          hours_worked: number | null
          id: string
          notes: string | null
          person_id: string | null
          project_id: string | null
          start_date: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          hours_allocated?: number
          hours_worked?: number | null
          id?: string
          notes?: string | null
          person_id?: string | null
          project_id?: string | null
          start_date: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          hours_allocated?: number
          hours_worked?: number | null
          id?: string
          notes?: string | null
          person_id?: string | null
          project_id?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          changed_fields: string[] | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          session_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          session_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          session_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_data: Json | null
          created_at: string | null
          created_by: string | null
          file_name: string
          file_size: string | null
          id: string
          record_count: number | null
          table_name: string
        }
        Insert: {
          backup_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_size?: string | null
          id?: string
          record_count?: number | null
          table_name: string
        }
        Update: {
          backup_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_size?: string | null
          id?: string
          record_count?: number | null
          table_name?: string
        }
        Relationships: []
      }
      capacities: {
        Row: {
          certification: string | null
          comments: string | null
          created_at: string | null
          evaluation_date: string | null
          id: string
          level: string | null
          person_name: string
          skill: string
        }
        Insert: {
          certification?: string | null
          comments?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          level?: string | null
          person_name: string
          skill: string
        }
        Update: {
          certification?: string | null
          comments?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          level?: string | null
          person_name?: string
          skill?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          project_id: string | null
          uploaded_by: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          project_id?: string | null
          uploaded_by: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          project_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          comunidad_autonoma: string | null
          created_at: string | null
          date: string
          festivo: string
          id: string
          origen: string
          pais: string | null
        }
        Insert: {
          comunidad_autonoma?: string | null
          created_at?: string | null
          date: string
          festivo: string
          id?: string
          origen?: string
          pais?: string | null
        }
        Update: {
          comunidad_autonoma?: string | null
          created_at?: string | null
          date?: string
          festivo?: string
          id?: string
          origen?: string
          pais?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          categoria: string
          cex: string
          created_at: string | null
          fecha_incorporacion: string
          grupo: string
          id: string
          mail_empresa: string
          nombre: string
          num_pers: string
          oficina: string
          origen: string
          squad_lead: string
          updated_at: string | null
        }
        Insert: {
          categoria?: string
          cex?: string
          created_at?: string | null
          fecha_incorporacion?: string
          grupo?: string
          id?: string
          mail_empresa?: string
          nombre?: string
          num_pers?: string
          oficina?: string
          origen?: string
          squad_lead?: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          cex?: string
          created_at?: string | null
          fecha_incorporacion?: string
          grupo?: string
          id?: string
          mail_empresa?: string
          nombre?: string
          num_pers?: string
          oficina?: string
          origen?: string
          squad_lead?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          employee_code: string | null
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          squad_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          employee_code?: string | null
          id: string
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          squad_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          employee_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          squad_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          cliente: string
          codigo_inicial: string
          created_at: string | null
          denominacion: string
          descripcion: string | null
          gestor_proyecto: string
          grupo_cliente: string
          id: string
          origen: string
          socio_responsable: string
          tipologia: string
          tipologia_2: string | null
          updated_at: string | null
        }
        Insert: {
          cliente?: string
          codigo_inicial?: string
          created_at?: string | null
          denominacion?: string
          descripcion?: string | null
          gestor_proyecto?: string
          grupo_cliente?: string
          id?: string
          origen?: string
          socio_responsable?: string
          tipologia?: string
          tipologia_2?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente?: string
          codigo_inicial?: string
          created_at?: string | null
          denominacion?: string
          descripcion?: string | null
          gestor_proyecto?: string
          grupo_cliente?: string
          id?: string
          origen?: string
          socio_responsable?: string
          tipologia?: string
          tipologia_2?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      squad_lead_preferences: {
        Row: {
          card_order: string[]
          created_at: string
          id: string
          squad_lead_name: string
          updated_at: string
        }
        Insert: {
          card_order?: string[]
          created_at?: string
          id?: string
          squad_lead_name: string
          updated_at?: string
        }
        Update: {
          card_order?: string[]
          created_at?: string
          id?: string
          squad_lead_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          squad_name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          squad_name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          squad_name?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignment_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          date: string
          description: string
          hours: number
          id: string
          person_id: string | null
          task_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          date: string
          description: string
          hours: number
          id?: string
          person_id?: string | null
          task_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          hours?: number
          id?: string
          person_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_operation: string
          p_old_values?: Json
          p_new_values?: Json
          p_user_name?: string
        }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "squad_lead" | "operations"
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
      app_role: ["admin", "squad_lead", "operations"],
    },
  },
} as const
