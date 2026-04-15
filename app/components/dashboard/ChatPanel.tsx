'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button, Input, Card, CardBody, Chip, ScrollShadow, Spinner, Avatar
} from '@heroui/react';
import {
  Send, X, Bot, User, FileText, Sparkles, RotateCcw,
  ChevronDown, ExternalLink, AlertCircle
} from 'lucide-react';
import { queryRAG, ChatMessage, RAGSource } from '../../lib/ragApi';
import { KnowledgeFile } from '../../lib/knowledgeBase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  collectionName: string;
  focusedFile?: KnowledgeFile | null; // null = entire KB
  allFiles: KnowledgeFile[];
  initialQuestion?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the main topics covered?',
  'Summarize the key concepts',
  'What are the most important points?',
  'Create a quiz based on this content',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, sources }: { msg: ChatMessage; sources?: RAGSource[] }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser
          ? 'bg-primary text-white'
          : 'bg-primary/10 text-white'
      }`}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-default-100 dark:bg-default-50/10 text-foreground rounded-tl-sm border border-divider'
        }`}>
          {msg.content}
        </div>

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {sources.map((src) => (
              <span
                key={src.file_id}
                className="inline-flex items-center gap-1 text-[10px] text-default-500 bg-default-100 dark:bg-default-100/10 px-2 py-0.5 rounded-full border border-divider"
              >
                <FileText size={9} />
                {src.file_name.length > 25 ? src.file_name.slice(0, 25) + '…' : src.file_name}
                <span className="text-success-500 font-medium">{Math.round(src.relevance * 100)}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({
  isOpen, onClose, teacherId, collectionName, focusedFile, allFiles, initialQuestion
}: Props) {
  const [messages, setMessages] = useState<Array<ChatMessage & { sources?: RAGSource[] }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep a ref to handleSend so the initialQuestion effect always calls
  // the latest version (avoids stale closure over collectionName / teacherId)
  const handleSendRef = useRef<(text?: string) => void>(() => {});

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input and send initial question
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (initialQuestion && messages.length === 0) {
        // Use ref to always call the up-to-date handleSend (no stale closure)
        handleSendRef.current(initialQuestion);
      }
    }
  }, [isOpen, initialQuestion]); // handleSend intentionally excluded — ref handles freshness

  const handleSend = useCallback(async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || isLoading) return;
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await queryRAG(
        q, collectionName, teacherId, history,
        focusedFile?.id,
      );

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
      }]);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, collectionName, teacherId, focusedFile]);

  // Keep ref in sync so the initialQuestion effect is never stale
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const clearChat = () => setMessages([]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-content1 border-l border-divider shadow-2xl"
          >
            {/* -- Header -- */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-divider bg-content1/95 backdrop-blur-sm flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {focusedFile ? 'Document Chat' : 'Knowledge Base Chat'}
                </p>
                <p className="text-[11px] text-default-400 truncate">
                  {focusedFile ? focusedFile.originalName : `${allFiles.length} document${allFiles.length !== 1 ? 's' : ''} in context`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {messages.length > 0 && (
                  <Button isIconOnly size="sm" variant="light" onClick={clearChat} className="text-default-400">
                    <RotateCcw size={14} />
                  </Button>
                )}
                <Button isIconOnly size="sm" variant="light" onClick={onClose} className="text-default-400">
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Context chip */}
            {focusedFile && (
              <div className="px-4 py-2 bg-primary/5 border-b border-divider flex-shrink-0">
                <Chip
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<FileText size={10} />}
                  onClose={() => {}}
                  classNames={{ content: 'text-[11px] font-semibold' }}
                >
                  Scoped to: {focusedFile.originalName.length > 35
                    ? focusedFile.originalName.slice(0, 35) + '…'
                    : focusedFile.originalName}
                </Chip>
              </div>
            )}

            {/* -- Messages -- */}
            <ScrollShadow className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 py-10">
                  <div className="w-16 h-16 rounded-2xl border border-divider flex items-center justify-center">
                    <Bot size={28} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Ask anything about your knowledge base</p>
                    <p className="text-xs text-default-400 mt-1">
                      {focusedFile
                        ? 'Questions will be answered from this document'
                        : 'Your AI assistant has read all your uploaded documents'}
                    </p>
                  </div>

                  {/* Suggested questions */}
                  <div className="w-full space-y-2">
                    <p className="text-[11px] text-default-400 font-semibold uppercase tracking-wider">Try asking:</p>
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-xl border border-divider hover:border-primary/40 hover:bg-primary/5 transition-colors text-default-600 dark:text-default-400"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} sources={msg.sources} />
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-divider" style={{ backgroundColor: '#0f1a2e' }}>
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-default-100 dark:bg-default-50/10 border border-divider rounded-2xl rounded-tl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollShadow>

            {/* -- Error -- */}
            {error && (
              <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            {/* -- Input -- */}
            <div className="p-4 border-t border-divider flex-shrink-0 bg-content1/95 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onValueChange={setInput}
                  placeholder="Ask a question…"
                  size="sm"
                  variant="bordered"
                  classNames={{
                    input: 'text-sm',
                    inputWrapper: 'border-default-300 dark:border-default-200 focus-within:border-primary',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  isLoading={isLoading}
                  isDisabled={!input.trim()}
                  onClick={() => handleSend()}
                  className="h-10 w-10 min-w-10 flex-shrink-0"
                >
                  {!isLoading && <Send size={15} />}
                </Button>
              </div>
              <p className="text-[10px] text-default-400 mt-2 text-center">
                Powered by Gemini · Answers grounded in your documents
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
