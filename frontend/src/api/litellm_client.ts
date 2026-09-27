import { Channel, Message, HealthStatus, HITLProposal, ChatSession, LearnedFact, CompanyDocument, UserProfile } from '../types/workbench';

const API_BASE = '/api';

export async function loginUser(username: string, password?: string, role?: string): Promise<{ success: boolean; token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: password || 'sovereign2026', role })
  });
  if (!res.ok) throw new Error('Authentication failed');
  return res.json();
}

export async function fetchLoginProfiles(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/auth/profiles`);
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// --- ChatGPT Sessions API ---
export async function fetchSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to load sessions');
  return res.json();
}

export async function createSession(title: string = 'New Industrial Chat', model: string = 'llama3.2:latest', category: string = 'general'): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model, category })
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  return res.ok;
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.ok;
}

export async function clearSessionMessages(sessionId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/clear`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

// --- Chat Dispatch API ---
export async function sendChatMessage(
  sessionId: string,
  content: string,
  userRole: string = 'Lead Reliability Engineer',
  model: string = 'llama3.2:latest',
  agentMode: string = 'general',
  attachments?: any[]
): Promise<{ user_message: Message; agent_response?: Message; learned_info?: any; citations?: any[]; model_used?: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      channel_id: sessionId,
      content,
      user_role: userRole,
      model,
      agent_mode: agentMode,
      attachments: attachments || []
    })
  });
  if (!res.ok) throw new Error('Failed to dispatch message');
  return res.json();
}

// --- Continuous Learned Memory API ---
export async function fetchLearnedFacts(): Promise<LearnedFact[]> {
  const res = await fetch(`${API_BASE}/memory/list`);
  if (!res.ok) throw new Error('Failed to load learned memories');
  return res.json();
}

export async function addLearnedFact(fact: string, category: string = 'general', taughtBy: string = 'Director M. Sharma'): Promise<LearnedFact> {
  const res = await fetch(`${API_BASE}/memory/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fact, category, taught_by: taughtBy })
  });
  if (!res.ok) throw new Error('Failed to add memory');
  return res.json();
}

export async function deleteLearnedFact(factId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/memory/${factId}`, { method: 'DELETE' });
  return res.ok;
}

// --- Company Knowledge Documents API ---
export async function fetchCompanyDocuments(): Promise<CompanyDocument[]> {
  const res = await fetch(`${API_BASE}/knowledge/documents`);
  if (!res.ok) throw new Error('Failed to load company docs');
  return res.json();
}

// --- HITL & SIEM API ---
export async function submitHITLDecision(
  workOrderId: string,
  action: 'APPROVE' | 'REJECT',
  signedBy: string,
  clearanceCode: string,
  comments?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/hitl/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      work_order_id: workOrderId,
      action,
      signed_by: signedBy,
      clearance_code: clearanceCode,
      comments
    })
  });
  if (!res.ok) throw new Error('HITL signoff failed');
  return res.json();
}

export async function fetchLiveTelemetry(): Promise<any> {
  const res = await fetch(`${API_BASE}/telemetry/live`);
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  return res.json();
}

export async function fetchSIEMLogs(): Promise<any> {
  const res = await fetch(`${API_BASE}/siem/logs`);
  if (!res.ok) throw new Error('Failed to fetch SIEM logs');
  return res.json();
}

// Compatibility helper
export async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_BASE}/channels`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMessages(channelId: string): Promise<Message[]> {
  return fetchSessionMessages(channelId);
}
