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
      aktivitaeten: {
        Row: {
          beschreibung: string | null
          created_at: string
          erstellt_von: string | null
          id: string
          lead_id: string
          typ: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          erstellt_von?: string | null
          id?: string
          lead_id: string
          typ: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          erstellt_von?: string | null
          id?: string
          lead_id?: string
          typ?: string
        }
        Relationships: [
          {
            foreignKeyName: "aktivitaeten_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      einstellungen: {
        Row: {
          id: string
          schluessel: string
          wert: string | null
        }
        Insert: {
          id?: string
          schluessel: string
          wert?: string | null
        }
        Update: {
          id?: string
          schluessel?: string
          wert?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          adresse: string | null
          auftragnehmer_aufgabe: string | null
          auftragnehmer_beteiligt: boolean | null
          branche: string | null
          created_at: string
          email: string | null
          entwicklung: string | null
          entwicklung_herausforderungen: string | null
          entwicklungsaufwand_4j: string | null
          entwicklungsplan: string | null
          foerderfaehigkeit: string | null
          foerdersumme_genehmigt: number | null
          homepage: string | null
          id: string
          kontaktiert_am: string | null
          letzter_kontakt: string | null
          ma_in_entwicklung: string | null
          mandats_wert: number | null
          mitarbeiter: string | null
          nachname: string
          naechster_kontakt: string | null
          notizen: string | null
          ort: string | null
          plz: string | null
          position_titel: string | null
          prioritaet: string
          quelle: string | null
          rechner_ergebnis: number | null
          reine_produktentwicklung: boolean | null
          reminder_count: number | null
          revenue_share_mtm: number | null
          revenue_share_pca: number | null
          status: string
          steuerpflichtig_de: boolean | null
          telefon: string | null
          termin_am: string | null
          unternehmen: string | null
          unternehmen_schwierigkeiten: boolean | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          verbundene_unternehmen: boolean | null
          vorname: string
          wissenschaftliche_risiken: boolean | null
          zugewiesen_an: string | null
        }
        Insert: {
          adresse?: string | null
          auftragnehmer_aufgabe?: string | null
          auftragnehmer_beteiligt?: boolean | null
          branche?: string | null
          created_at?: string
          email?: string | null
          entwicklung?: string | null
          entwicklung_herausforderungen?: string | null
          entwicklungsaufwand_4j?: string | null
          entwicklungsplan?: string | null
          foerderfaehigkeit?: string | null
          foerdersumme_genehmigt?: number | null
          homepage?: string | null
          id?: string
          kontaktiert_am?: string | null
          letzter_kontakt?: string | null
          ma_in_entwicklung?: string | null
          mandats_wert?: number | null
          mitarbeiter?: string | null
          nachname: string
          naechster_kontakt?: string | null
          notizen?: string | null
          ort?: string | null
          plz?: string | null
          position_titel?: string | null
          prioritaet?: string
          quelle?: string | null
          rechner_ergebnis?: number | null
          reine_produktentwicklung?: boolean | null
          reminder_count?: number | null
          revenue_share_mtm?: number | null
          revenue_share_pca?: number | null
          status?: string
          steuerpflichtig_de?: boolean | null
          telefon?: string | null
          termin_am?: string | null
          unternehmen?: string | null
          unternehmen_schwierigkeiten?: boolean | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verbundene_unternehmen?: boolean | null
          vorname: string
          wissenschaftliche_risiken?: boolean | null
          zugewiesen_an?: string | null
        }
        Update: {
          adresse?: string | null
          auftragnehmer_aufgabe?: string | null
          auftragnehmer_beteiligt?: boolean | null
          branche?: string | null
          created_at?: string
          email?: string | null
          entwicklung?: string | null
          entwicklung_herausforderungen?: string | null
          entwicklungsaufwand_4j?: string | null
          entwicklungsplan?: string | null
          foerderfaehigkeit?: string | null
          foerdersumme_genehmigt?: number | null
          homepage?: string | null
          id?: string
          kontaktiert_am?: string | null
          letzter_kontakt?: string | null
          ma_in_entwicklung?: string | null
          mandats_wert?: number | null
          mitarbeiter?: string | null
          nachname?: string
          naechster_kontakt?: string | null
          notizen?: string | null
          ort?: string | null
          plz?: string | null
          position_titel?: string | null
          prioritaet?: string
          quelle?: string | null
          rechner_ergebnis?: number | null
          reine_produktentwicklung?: boolean | null
          reminder_count?: number | null
          revenue_share_mtm?: number | null
          revenue_share_pca?: number | null
          status?: string
          steuerpflichtig_de?: boolean | null
          telefon?: string | null
          termin_am?: string | null
          unternehmen?: string | null
          unternehmen_schwierigkeiten?: boolean | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verbundene_unternehmen?: boolean | null
          vorname?: string
          wissenschaftliche_risiken?: boolean | null
          zugewiesen_an?: string | null
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
