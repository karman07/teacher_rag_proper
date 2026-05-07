// lib/rag.ts — Client for Student RAG Service

export const RAG_API = process.env.NEXT_PUBLIC_RAG_API_URL ?? 'http://localhost:8000';

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
  highlight_text?: string | null;
  highlight_start?: number | null;
  highlight_end?: number | null;
  y_offset?: number | null;  // normalized Y position (0–1) within the PDF page
  timestamp?: string | null; // video timestamp like 01:23
}

export interface RAGQueryResponse {
  answer:  string;
  sources: RAGSource[];
}

export async function* queryRAGStream(
  question: string,
  collectionName: string,
  teacherId: string,
  history: ChatMessage[] = [],
  fileId?: string,
  imageBase64?: string,
): AsyncGenerator<string> {
  const scopedQuestion = fileId
    ? `[Context: Only answer from the file with id ${fileId}] ${question}`
    : question;

  const res = await fetch(`${RAG_API}/query-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacher_id:      teacherId,
      collection_name: collectionName,
      question:        scopedQuestion,
      image_base64:    imageBase64,
      top_k:           8,
      chat_history:    history.slice(-8),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'RAG query failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

