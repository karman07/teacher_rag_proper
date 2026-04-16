import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

  createNote: async (subjectId: string, content: string, fileId?: string) => {
    const res = await axios.post(`${API_URL}/students/classes/${subjectId}/notes`, { content, fileId }, { headers: getAuthHeaders() });
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
};
