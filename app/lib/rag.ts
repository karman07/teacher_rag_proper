// lib/rag.ts — Client for Student RAG Service

const RAG_API = process.env.NEXT_PUBLIC_RAG_API_URL ?? 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGSource {
  file_id:   string;
  file_name: string;
  relevance: number;
  chunk_idx?: number | null;
  page?: number | null;
  image_index?: number | null;
  content_type?: string | null;
  snippet?: string | null;
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
  fileId?: string,
  imageBase64?: string,
): Promise<RAGQueryResponse> {
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
      image_base64:    imageBase64,
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
