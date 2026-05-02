import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('student-token') : null;
  return { Authorization: token ? `Bearer ${token}` : '' };
};

// ─── Question counter (persisted per student in localStorage) ─────────────────
const QS_KEY = 'student-questions-asked';

export function getQuestionsAsked(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(QS_KEY) || '0', 10);
}

export function incrementQuestionsAsked(): number {
  const next = getQuestionsAsked() + 1;
  localStorage.setItem(QS_KEY, String(next));
  return next;
}

// ─── REST calls ───────────────────────────────────────────────────────────────
export const studentApi = {
  getClasses: async () => {
    const res = await axios.get(`${API_URL}/students/classes`, { headers: getAuthHeaders() });
    return res.data;
  },

  getClassDetails: async (id: string) => {
    const res = await axios.get(`${API_URL}/students/classes/${id}`, { headers: getAuthHeaders() });
    return res.data;
  },

  joinClass: async (code: string) => {
    const res = await axios.post(`${API_URL}/students/join`, { code }, { headers: getAuthHeaders() });
    return res.data;
  },

  /** Signed-in file URL with bearer token via query param (for iframe/pdf) */
  fileUrl: (fileId: string) =>
    `${API_URL}/students/files/${fileId}`,

  // ─── Notes ──────────────────────────────────────────────────────────────────
  getNotes: async (subjectId: string) => {
    const res = await axios.get(`${API_URL}/students/classes/${subjectId}/notes`, { headers: getAuthHeaders() });
    return res.data;
  },

  createNote: async (subjectId: string, content: string, fileId?: string, pageNumber?: number, selectionText?: string, selectionCoords?: any) => {
    const res = await axios.post(`${API_URL}/students/classes/${subjectId}/notes`, { content, fileId, pageNumber, selectionText, selectionCoords }, { headers: getAuthHeaders() });
    return res.data;
  },

  updateNote: async (noteId: string, content: string) => {
    const res = await axios.patch(`${API_URL}/students/notes/${noteId}`, { content }, { headers: getAuthHeaders() });
    return res.data;
  },

  deleteNote: async (noteId: string) => {
    const res = await axios.delete(`${API_URL}/students/notes/${noteId}`, { headers: getAuthHeaders() });
    return res.data;
  },

  // ─── Analytics ──────────────────────────────────────────────────────────────
  getPersonalAnalytics: async (timeframe: '7d' | '30d' | 'all' = '7d') => {
    // Triggers hot reload for Turbopack to pick up the headers fix
    const res = await axios.get(`${API_URL}/analytics/student/personal?timeframe=${timeframe}`, { headers: getAuthHeaders() });
    return res.data;
  },

  logQuery: async (data: { 
    question: string; 
    answer: string; 
    subjectId: string; 
    fileId?: string; 
    topic?: string;
    responseMs?: number;
    chunkCount?: number;
  }) => {
    const res = await axios.post(`${API_URL}/analytics/log`, { 
      ...data, 
      askedBy: 'student' 
    }, { headers: getAuthHeaders() });
    return res.data;
  },

  logActivity: async (type: string, subjectId?: string, metadata?: any) => {
    try {
      await axios.post(`${API_URL}/analytics/activity`, { type, subjectId, metadata }, { headers: getAuthHeaders() });
    } catch (err) {
      // Slient fail for analytics to not disturb user
      console.warn('Analytics log failed');
    }
  },

  // ─── Chat History ────────────────────────────────────────────────────────────

  getChatSessions: async (subjectId: string) => {
    const res = await axios.get(`${API_URL}/students/classes/${subjectId}/chat-sessions`, { headers: getAuthHeaders() });
    return res.data as ChatSession[];
  },

  createChatSession: async (subjectId: string, title?: string) => {
    const res = await axios.post(`${API_URL}/students/classes/${subjectId}/chat-sessions`, { title }, { headers: getAuthHeaders() });
    return res.data as ChatSession;
  },

  getChatMessages: async (sessionId: string) => {
    const res = await axios.get(`${API_URL}/students/chat-sessions/${sessionId}/messages`, { headers: getAuthHeaders() });
    return res.data as StoredChatMessage[];
  },

  appendChatMessage: async (sessionId: string, role: string, content: string, sources?: any[]) => {
    const res = await axios.post(`${API_URL}/students/chat-sessions/${sessionId}/messages`, { role, content, sources }, { headers: getAuthHeaders() });
    return res.data;
  },

  deleteChatSession: async (sessionId: string) => {
    const res = await axios.delete(`${API_URL}/students/chat-sessions/${sessionId}`, { headers: getAuthHeaders() });
    return res.data;
  },
};

// ─── Chat Types ───────────────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  subjectId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: { content: string; createdAt: string }[];
  _count?: { messages: number };
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  sources?: any[];
  createdAt: string;
}
