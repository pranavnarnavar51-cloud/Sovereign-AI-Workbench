export interface Channel {
  id: string;
  name: string;
  category: 'executive' | 'agent' | 'incident' | 'general';
  role: string;
  avatar_badge: string;
  clearance: string;
  last_message: string;
  unread_count: number;
  is_p2p: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface LearnedFact {
  id: string;
  key: string;
  fact: string;
  category: string;
  taught_by: string;
  confidence: number;
  created_at: string;
  verified?: number;
}

export interface CompanyDocument {
  id: string;
  title: string;
  doc_type: string;
  content: string;
  equipment_tag?: string;
  tags?: string;
  last_updated?: string;
}

export interface Citation {
  id: string;
  type: string;
  title: string;
  source: string;
  content?: string;
  score?: number;
  category?: string;
}

export interface Attachment {
  type: 'image' | 'cad' | 'scada' | 'audio';
  filename: string;
  url?: string;
  preview?: string;
  base64?: string;
  size_kb?: number;
}

export interface HITLProposal {
  work_order_id: string;
  equipment_tag: string;
  priority: string;
  description: string;
  required_craft: string;
  estimated_downtime_hours: number;
  status: 'PENDING_HITL_APPROVAL' | 'AUTHORIZED_AND_EXECUTING' | 'ABORTED_BY_DIRECTOR';
  created_at: string;
  spare_parts_allocated?: Array<{ part_no: string; description: string; quantity: number }>;
}

export interface Message {
  id: string;
  session_id?: string;
  sender: string;
  role: 'user' | 'assistant' | 'system' | 'executive';
  content: string;
  timestamp: string;
  reasoning?: string;
  evidence?: any;
  citations?: Citation[];
  hitl_required?: boolean;
  hitl_proposal?: HITLProposal;
  attachments?: Attachment[];
  trace?: Array<{ step: string; [key: string]: any }>;
  learned_info?: {
    fact_id: string;
    key: string;
    fact: string;
    category: string;
    taught_by: string;
  };
}

export interface HealthStatus {
  status: string;
  facility_node: string;
  company?: string;
  air_gap_active: boolean;
  egress_firewall: string;
  ollama: {
    status: string;
    host: string;
    installed_models: string[];
    active_text_model: string;
    active_vision_model: string;
  };
  memory?: {
    learned_facts_count: number;
    company_documents_count: number;
  };
  timestamp: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  department: string;
  clearance: string;
  clearance_code: string;
  initials: string;
  avatar_badge?: string;
  theme_color?: string;
}
