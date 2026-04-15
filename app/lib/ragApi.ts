// lib/ragApi.ts — Client for FastAPI RAG Service

const RAG_API = process.env.NEXT_PUBLIC_RAG_API_URL ?? 'http://localhost:8000';

function authHeaders() {
  const token = localStorage.getItem('teachai-token');
  const userRaw = localStorage.getItem('teachai-user');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch { /* ignore */ }
  return { tok: token, user };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGSource {
  file_id:   string;
  file_name: string;
  relevance: number;
}

export interface RAGQueryResponse {
  answer:  string;
  sources: RAGSource[];
}

export async function queryRAG(
  question: string,
  collectionName: string,
  teacherId: string,
  history: ChatMessage[] = [],
  fileId?: string,   // scope to single file if provided
): Promise<RAGQueryResponse> {
  // Build a question scoped to a specific file if provided
  const scopedQuestion = fileId
    ? `[Context: Only answer from the file with id ${fileId}] ${question}`
    : question;

  const res = await fetch(`${RAG_API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacher_id:      teacherId,
      collection_name: collectionName,
      question:        scopedQuestion,
      top_k:           6,
      chat_history:    history.slice(-8),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'RAG query failed');
  }
  return res.json();
}
