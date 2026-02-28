export interface Accreditation {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  type: 'premsa' | 'professional' | 'nitoman';
  code_id: number | null;
  code?: string;
  status: 'pending' | 'code_assigned' | 'email_sent';
  created_at: string;
  email_sent_at: string | null;
}

export interface Code {
  id: number;
  code: string;
  type: 'premsa' | 'professional' | 'nitoman';
  is_used: boolean;
  assigned_at: string | null;
}

export interface EmailTemplate {
  id: number;
  name: string;
  type: 'premsa' | 'professional' | 'nitoman';
  subject: string;
  body: string;
  is_active: boolean;
}

export type AccreditationType = 'premsa' | 'professional' | 'nitoman';

export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  types: AccreditationType[];
  created_at?: string;
}

export interface TypeSettings {
  type: AccreditationType;
  auto_assign_codes: boolean;
  auto_send_emails: boolean;
  display_name: string;
}
