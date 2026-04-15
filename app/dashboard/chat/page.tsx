'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, CardBody, Skeleton } from '@heroui/react';
import {
  Send, Bot, User, RotateCcw, FileText, Sparkles,
  AlertCircle, ChevronDown, BookOpen as SubjectIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { queryRAG, ChatMessage, RAGSource } from '../../lib/ragApi';
import { analyticsApi } from '../../lib/analyticsApi';
import { knowledgeBaseApi, KnowledgeBaseStats } from '../../lib/knowledgeBase';
import { subjectsApi, Subject } from '../../lib/subjects';
import { COLORS } from '../../constants/colors';

const C = { blue: COLORS.primary[600], violet: COLORS.accent.violet };

const SUGGESTED = [
  'What are the main topics in my documents?',
  'Summarize the key concepts',
  'What are the most important points?',
  'Create a quiz based on this content',
  'What are common student questions about this?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: C.blue }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage & { sources?: RAGSource[] } }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
        isUser
          ? 'border-primary/30 bg-primary/10'
          : 'border-divider bg-default-50 dark:bg-default-100/5'
      }`}>
        {isUser
          ? <User size={13} style={{ color: C.blue }} />
          : <Bot size={13} className="text-default-500" />}
      </div>
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'rounded-tr-sm text-foreground border border-divider bg-default-50 dark:bg-default-100/5'
            : 'rounded-tl-sm text-foreground border border-divider bg-content1'
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.sources.map((s) => (
              <span key={s.file_id} className="inline-flex items-center gap-1 text-[10px] border border-divider px-2 py-0.5 rounded-full text-default-500">
                <FileText size={9} />
                {s.file_name.length > 22 ? s.file_name.slice(0, 22) + '…' : s.file_name}
                <span className="font-bold" style={{ color: COLORS.accent.emerald }}>{Math.round(s.relevance * 100)}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatPageInner() {
  const { user, isLoading: authLoading } = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();
  const fileId  = params.get('fileId');
  const fileName = params.get('fileName');

  const [kbStats, setKbStats] = useState<KnowledgeBaseStats | null>(null);
  const [messages, setMessages] = useState<Array<ChatMessage & { sources?: RAGSource[] }>>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [kbLoading, setKbLoading] = useState(true);
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (user) {
      Promise.all([
        knowledgeBaseApi.getStats(),
        subjectsApi.list()
      ]).then(([stats, subs]) => {
        setKbStats(stats);
        setSubjects(subs);
      }).catch(() => {})
        .finally(() => { setKbLoading(false); inputRef.current?.focus(); });
    }
  }, [user]);

  const handleSend = useCallback(async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading || !kbStats) return;
    setInput('');
    setError(null);
    setMessages((p) => [...p, { role: 'user', content: q }]);
    setLoading(true);
    const t0 = Date.now();
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      
      let activeCollection = kbStats!.collectionName;
      if (selectedSubjectId !== 'all') {
        const sub = subjects.find(s => s.id === selectedSubjectId);
        if (sub) activeCollection = sub.collectionName;
      }

      const res = await queryRAG(q, activeCollection, user!.id, history, fileId ?? undefined);
      const responseMs = Date.now() - t0;
      setMessages((p) => [...p, { role: 'assistant', content: res.answer, sources: res.sources }]);
      // Log to analytics (non-blocking)
      analyticsApi.logQuery({
        question:  q,
        answer:    res.answer,
        fileId:    fileId ?? undefined,
        askedBy:   'teacher',
        responseMs,
        chunkCount: res.sources.length,
      }).catch(() => {});
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, kbStats, user, fileId]);

  const clearChat = () => setMessages([]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">

        {/* -- Header -- */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-divider flex items-center justify-center">
              <Sparkles size={16} className="text-default-500" />
            </div>
            <div className="flex items-center gap-2 bg-content1 border border-divider rounded-xl px-3 py-1 shadow-sm">
              <SubjectIcon size={13} className="text-primary" />
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-[11px] font-black outline-none cursor-pointer pr-4 appearance-none"
                style={{ color: 'var(--text)' }}
              >
                <option value="all">Global Knowledge</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={11} className="text-default-400 pointer-events-none -ml-3" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground">
                {fileName ? `Chat: ${decodeURIComponent(fileName)}` : 'Knowledge Base Chat'}
              </h1>
              <p className="text-[11px] text-default-400">
                {kbLoading ? 'Loading…' : kbStats
                  ? `${kbStats.totalFiles} document${kbStats.totalFiles !== 1 ? 's' : ''} · ${fileName ? 'scoped to file' : 'entire knowledge base'}`
                  : 'No knowledge base found'}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button size="sm" variant="bordered" startContent={<RotateCcw size={12} />}
              onClick={clearChat} className="border-divider text-xs font-semibold">
              Clear
            </Button>
          )}
        </div>

        {/* -- Messages -- */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-divider bg-content1 p-5 space-y-5">
          {kbLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-14 h-14 rounded-2xl border border-divider flex items-center justify-center">
                <Bot size={24} className="text-default-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Ask anything about your knowledge base</p>
                <p className="text-xs text-default-400 mt-1">Every question you ask is logged for analytics</p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                {SUGGESTED.map((q) => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="w-full text-left text-xs px-3 py-2.5 rounded-xl border border-divider
                      hover:border-primary/30 hover:bg-primary/5 transition-colors text-default-500 dark:text-default-400">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full border border-divider flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-default-500" />
                  </div>
                  <div className="border border-divider rounded-2xl rounded-tl-sm bg-content1">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* -- Error -- */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-divider text-xs text-default-500 flex-shrink-0">
            <AlertCircle size={13} className="text-rose-500 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* -- Input -- */}
        <div className="flex gap-2 flex-shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onValueChange={setInput}
            placeholder={kbStats ? 'Ask a question…' : 'Upload files first to start chatting'}
            size="sm"
            variant="bordered"
            isDisabled={!kbStats || kbLoading}
            classNames={{
              input: 'text-sm',
              inputWrapper: 'border-divider focus-within:border-primary/50 h-11',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button isIconOnly color="primary" isLoading={loading} isDisabled={!input.trim() || !kbStats}
            onClick={() => handleSend()} className="h-11 w-11 min-w-11 flex-shrink-0 rounded-xl">
            {!loading && <Send size={15} />}
          </Button>
        </div>

        <p className="text-[10px] text-default-400 text-center flex-shrink-0">
          Powered by Gemini · All queries logged for analytics
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
