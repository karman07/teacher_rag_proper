// lib/analyticsApi.ts — Client for the real analytics backend

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('teachai-token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
}

export interface DailyStat {
  day: string;
  queries: number;
  teacherQ: number;
  studentQ: number;
}

export interface TopFile {
  fileId: string | null;
  count: number;
  fileName: string;
}

export interface AnalyticsSummary {
  totalQueries:   number;
  teacherQueries: number;
  studentQueries: number;
  avgResponseMs:  number;
  last7Days:      DailyStat[];
  topFiles:       TopFile[];
  engagement: {
    joined: number;
    active: number;
    queriesPerStudent: number;
    pageViews: number;
    totalTimeSpent: number;
  };
}

export interface TopicStat {
  topic: string;
  count: number;
}

export interface RecentQuery {
  id:          string;
  question:    string;
  askedBy:     string;
  responseMs:  number | null;
  chunkCount:  number | null;
  createdAt:   string;
  topic:       string | null;
  subject:     { name: string } | null;
  file:        { originalName: string; displayName: string | null } | null;
  student:     { name: string } | null;
}

export const analyticsApi = {
  getSummary: async (subjectId?: string): Promise<AnalyticsSummary> => {
    const url = subjectId ? `${API}/analytics/summary?subjectId=${subjectId}` : `${API}/analytics/summary`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  getTopQuestions: async (limit = 10, subjectId?: string): Promise<TopQuestion[]> => {
    const url = subjectId ? `${API}/analytics/top-questions?limit=${limit}&subjectId=${subjectId}` : `${API}/analytics/top-questions?limit=${limit}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch top questions');
    return res.json();
  },

  getTopics: async (subjectId?: string): Promise<TopicStat[]> => {
    const url = subjectId ? `${API}/analytics/topics?subjectId=${subjectId}` : `${API}/analytics/topics`;
    const res = await fetch(url, { headers: authHeaders() });
    return res.json();
  },

  getSubjectStudents: async (subjectId: string): Promise<any[]> => {
    const res = await fetch(`${API}/analytics/subject/${subjectId}/students`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  logActivity: async (data: {
    type: string;
    subjectId?: string;
    metadata?: any;
  }): Promise<void> => {
    await fetch(`${API}/analytics/activity`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
  },

  getRecentQueries: async (limit = 20, subjectId?: string): Promise<RecentQuery[]> => {
    const url = subjectId ? `${API}/analytics/recent-queries?limit=${limit}&subjectId=${subjectId}` : `${API}/analytics/recent-queries?limit=${limit}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch recent queries');
    return res.json();
  },

  logQuery: async (data: {
    question: string;
    answer: string;
    fileId?: string;
    askedBy?: 'teacher' | 'student';
    studentId?: string;
    subjectId?: string;
    topic?: string;
    responseMs?: number;
    chunkCount?: number;
  }): Promise<void> => {
    await fetch(`${API}/analytics/log`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
  },
};
