import type {
  DemoStatus,
  LeadQuality,
  LeadRecord,
  PlanOption,
  LeadStatus,
  PaymentStatus,
  GroupRecord,
  TransactionRecord,
  UserRole
} from "@/types/crm";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRecord;
        Insert: {
          id?: string;
          group_id?: string | null;
          business_name: string;
          business_type?: string | null;
          owner_name: string;
          phone: string;
          city?: string | null;
          address?: string | null;
          location: string;
          source: string;
          lead_by?: string | null;
          lead_quality?: LeadQuality;
          assigned_to?: string | null;
          status?: LeadStatus;
          interest?: string | null;
          budget?: string | null;
          attempts_count?: number;
          next_followup_date?: string | null;
          demo_status?: DemoStatus | null;
          demo_feedback?: string | null;
          deal_closed?: boolean;
          deal_amount?: number | null;
          selected_plan?: PlanOption | null;
          discount_given?: number | null;
          payment_status?: PaymentStatus | null;
          advance_amount?: number | null;
          lead_commission?: number | null;
          caller_commission?: number | null;
          demo_commission?: number | null;
          total_commission?: number | null;
          admin_profit?: number | null;
          closing_date?: string | null;
          lost_reason?: string | null;
          final_remarks?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          email: string;
          name: string;
          role: UserRole;
          created_at: string;
        }>;
        Relationships: [];
      };
      groups: {
        Row: GroupRecord;
        Insert: {
          id?: string;
          group_name: string;
          lead_user_id: string;
          caller_user_id: string;
          demo_user_id: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          group_name: string;
          lead_user_id: string;
          caller_user_id: string;
          demo_user_id: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      transactions: {
        Row: TransactionRecord;
        Insert: {
          id?: string;
          lead_id: string;
          user_id: string;
          role: "lead" | "caller" | "demo";
          amount: number;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          lead_id: string;
          user_id: string;
          role: "lead" | "caller" | "demo";
          amount: number;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
