export type ChatMessageRole = 'user' | 'assistant';

export interface Message {
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  feedback?: 'up' | 'down';
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Prefer explicit env var, then window override, else same-origin
const API_BASE = (import.meta as any).env?.VITE_API_BASE || (window as any).__API_BASE__ || '';

export async function sendChat(message: string, sessionId: string): Promise<{ response: string; session_id: string }>{
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchLatestPatientName(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/data/latest?limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.data?.[0];
    const email: string | undefined = doc?.email;
    if (email) return email.split('@')[0];
    const profileName: string | undefined = doc?.profile?.name;
    return profileName ?? null;
  } catch {
    return null;
  }
}

export function loadSessions(): Session[] {
  const raw = localStorage.getItem('chat_sessions');
  if (!raw) return [];
  try { return JSON.parse(raw) as Session[]; } catch { return []; }
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem('chat_sessions', JSON.stringify(sessions));
}

export function createSession(): Session {
  const id = crypto.randomUUID();
  const now = Date.now();
  return { id, title: 'New chat', messages: [], createdAt: now, updatedAt: now };
}

