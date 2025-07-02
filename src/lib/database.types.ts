export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      empresas: {
        Row: {
          id: string
          nome: string
          usuario_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          usuario_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          usuario_id?: string
          created_at?: string
        }
      }
      sessoes: {
        Row: {
          id: string
          session_id: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          gclid: string | null
          fbclid: string | null
          ip: string | null
          device_type: string | null
          created_at: string
          empresa_id: string
        }
        Insert: {
          id?: string
          session_id: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          gclid?: string | null
          fbclid?: string | null
          ip?: string | null
          device_type?: string | null
          created_at?: string
          empresa_id: string
        }
        Update: {
          id?: string
          session_id?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          gclid?: string | null
          fbclid?: string | null
          ip?: string | null
          device_type?: string | null
          created_at?: string
          empresa_id?: string
        }
      }
      conversoes: {
        Row: {
          id: string
          sessao_id: string | null
          valor: number
          produto: string
          webhook_source: string
          data_conversao: string
          empresa_id: string
        }
        Insert: {
          id?: string
          sessao_id?: string | null
          valor: number
          produto: string
          webhook_source: string
          data_conversao?: string
          empresa_id: string
        }
        Update: {
          id?: string
          sessao_id?: string | null
          valor?: number
          produto?: string
          webhook_source?: string
          data_conversao?: string
          empresa_id?: string
        }
      }
      campanhas: {
        Row: {
          id: string
          nome: string
          canal: string
          investimento: number
          empresa_id: string
          periodo: string
        }
        Insert: {
          id?: string
          nome: string
          canal: string
          investimento: number
          empresa_id: string
          periodo: string
        }
        Update: {
          id?: string
          nome?: string
          canal?: string
          investimento?: number
          empresa_id?: string
          periodo?: string
        }
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
  }
}