// lib/studyApi.ts — client for the human-evaluation study mode (setup, blinded expert review, results, export)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('teachai-token');
  return { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' };
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    let msg = fallback;
    try { msg = (await res.json())?.message || fallback; } catch { /* keep fallback */ }
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return res.json();
}

export interface StudyConfig {
  enabled: boolean;
  consentText: string;
  consentVersion: number;
  reviewers: { userId: string; email: string; name: string | null }[];
}

export interface RubricDimension { key: string; label: string; description: string }
export interface StudyInstruments { rubric: RubricDimension[] }

export interface ReviewItem {
  messageId: string;
  question: string;
  answer: string;
  hasCitations: boolean;
  sources: { fileName: string | null; page: number | null; snippet: string | null; contentType: string | null; timestamp: string | null }[];
}

export interface ReviewQueue { items: ReviewItem[]; progress: { reviewedByMe: number; eligible: number } }

export interface ReviewInput {
  messageId: string;
  relevance: number; factualAccuracy: number; groundingQuality: number; educationalValue: number;
  citationQuality?: number | null;
  revealedSolution?: boolean | null;
  notes?: string;
}

export interface StudySummary {
  participants: { agreed: number; declined: number };
  studentRatings: { n: number; meanHelpful: number | null };
  surveys: { sus: { n: number; mean: number | null }; usefulness: { n: number; mean: number | null } };
  expertReviews: { n: number; reviewers: number; itemsWithTwoOrMoreReviewers: number; means: Record<string, number | null> };
}

export const studyApi = {
  instruments: async (): Promise<StudyInstruments> =>
    json(await fetch(`${API}/study/instruments`, { headers: authHeaders() }), 'Failed to load instruments'),

  getConfig: async (subjectId: string): Promise<StudyConfig> =>
    json(await fetch(`${API}/study/config/${subjectId}`, { headers: authHeaders() }), 'Failed to load study setup'),

  updateConfig: async (subjectId: string, body: { enabled?: boolean; consentText?: string }): Promise<StudyConfig> =>
    json(await fetch(`${API}/study/config/${subjectId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }), 'Failed to save study setup'),

  addReviewer: async (subjectId: string, email: string): Promise<StudyConfig> =>
    json(await fetch(`${API}/study/config/${subjectId}/reviewers`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }) }), 'Failed to add reviewer'),

  removeReviewer: async (subjectId: string, userId: string): Promise<StudyConfig> =>
    json(await fetch(`${API}/study/config/${subjectId}/reviewers/${userId}`, { method: 'DELETE', headers: authHeaders() }), 'Failed to remove reviewer'),

  reviewSubjects: async (): Promise<{ id: string; name: string; isOwner: boolean }[]> =>
    json(await fetch(`${API}/study/review/subjects`, { headers: authHeaders() }), 'Failed to load review subjects'),

  queue: async (subjectId: string, limit = 5): Promise<ReviewQueue> =>
    json(await fetch(`${API}/study/review/queue?subjectId=${subjectId}&limit=${limit}`, { headers: authHeaders() }), 'Failed to load review queue'),

  submitReview: async (body: ReviewInput) =>
    json(await fetch(`${API}/study/review`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }), 'Failed to save review'),

  summary: async (subjectId: string): Promise<StudySummary> =>
    json(await fetch(`${API}/study/summary/${subjectId}`, { headers: authHeaders() }), 'Failed to load summary'),

  /** Downloads the anonymised export as a JSON file. */
  downloadExport: async (subjectId: string, includeText: boolean) => {
    const res = await fetch(`${API}/study/export/${subjectId}?includeText=${includeText ? 1 : 0}`, { headers: authHeaders() });
    const data = await json<unknown>(res, 'Failed to export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachai-study-export${includeText ? '-with-text' : ''}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
