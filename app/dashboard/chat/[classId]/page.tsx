'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, FileText, ArrowLeft, ArrowRight, Search,
  Database, MessageSquare, BookOpen, Sparkles,
  ChevronRight, X, Menu, Download, ExternalLink,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight as ChevronRightIcon,
  RotateCcw,
} from 'lucide-react';
import { studentApi, incrementQuestionsAsked } from '@/app/lib/api';
import { queryRAG, ChatMessage, RAGSource } from '@/app/lib/rag';

interface AugmentedMessage extends ChatMessage {
  id: string;
  sources?: RAGSource[];
  isError?: boolean;
}

import dynamic from 'next/dynamic';

const renderInline = (text: string, role: 'user' | 'assistant') => {
  // Split on **bold** and `code` patterns
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`font-black ${role === 'user' ? 'text-white' : 'text-slate-900 bg-blue-100/30 px-1 rounded-md'}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-700 font-mono text-xs font-bold">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
};

const MarkdownContent = ({ content, role }: { content: string, role: 'user' | 'assistant' }) => {
  if (typeof content !== 'string') return null;
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-slate-200">
          {lang && <div className="px-3 py-1 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">{lang}</div>}
          <pre className="p-4 bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">{codeLines.join('\n')}</pre>
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (!trimmed) { result.push(<div key={i} className="h-2" />); i++; continue; }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed)) { result.push(<hr key={i} className="border-slate-200 my-3" />); i++; continue; }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const sizes = ['text-base', 'text-sm', 'text-xs'];
      result.push(
        <div key={i} className={`mt-4 mb-1 font-black tracking-tight ${
          role === 'user' ? 'text-white' : `text-slate-900 border-l-4 border-blue-600 pl-3 bg-blue-50/50 py-1 rounded-r-lg ${sizes[level - 1]}`
        }`}>
          {renderInline(headerMatch[2], role)}
        </div>
      );
      i++;
      continue;
    }

    // List items
    const listMatch = trimmed.match(/^(\d+\.|[*•\-])\s+(.+)/);
    if (listMatch) {
      const bullet = listMatch[1];
      const isNum = /\d+\./.test(bullet);
      result.push(
        <div key={i} className="pl-5 relative leading-relaxed">
          <span className={`absolute left-0 font-black text-sm ${role === 'user' ? 'text-white/60' : 'text-blue-600'}`}>
            {isNum ? bullet : '•'}
          </span>
          <span className="text-sm">{renderInline(listMatch[2], role)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Regular paragraph
    result.push(
      <p key={i} className="leading-relaxed text-sm">{renderInline(trimmed, role)}</p>
    );
    i++;
  }

  return <div className="space-y-2">{result}</div>;
};

const PDFViewer = dynamic(() => import('./PDFViewer'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
      <p className="label-caps text-slate-400">Loading viewer…</p>
    </div>
  )
});

const NotesArea = dynamic(() => import('./NotesArea'), { ssr: false });

export default function ClassroomPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [classroom, setClassroom]       = useState<any>(null);
  const [files, setFiles]               = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loadingClass, setLoadingClass] = useState(true);

  const [messages, setMessages]   = useState<AugmentedMessage[]>([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [chatScope, setChatScope] = useState<'all' | 'file'>('file');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showDoc, setShowDoc]         = useState(true);

  const [libOpen, setLibOpen]       = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchClass(); }, [classId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchClass = async () => {
    try {
      const data = await studentApi.getClassDetails(classId);
      setClassroom(data);
      const f = data.files || [];
      setFiles(f);
      if (f.length > 0) setSelectedFile(f[0]);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoadingClass(false);
    }
  };

  const sendMessage = async (overrideQuery?: string, imageBase64?: string) => {
    // Strict string coercion — prevents [object Object] artifacts
    const q = typeof overrideQuery === 'string' && overrideQuery.trim()
      ? overrideQuery.trim()
      : input.trim();

    if ((!q && !imageBase64) || sending) return;
    if (!overrideQuery) setInput('');

    const displayContent = q || 'Analyze this visual snippet';
    const userMsg: AugmentedMessage = { id: crypto.randomUUID(), role: 'user', content: displayContent };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    incrementQuestionsAsked();

    try {
      const res = await queryRAG(
        q || '',
        String(classroom?.collectionName || ''),
        String(classroom?.teacherId || ''),
        messages.map(({ role, content }) => ({ role: String(role), content: String(content) })),
        chatScope === 'file' ? selectedFile?.id : undefined,
        imageBase64
      );
      const botMsg: AugmentedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: typeof res.answer === 'string' ? res.answer : JSON.stringify(res.answer),
        sources: res.sources,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('sendMessage error:', err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I ran into an error. Please try again.',
        isError: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  const filteredFiles = files.filter((f: any) =>
    (f.displayName || f.name || f.originalName || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  if (loadingClass) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-blue-600 text-white shadow-xl animate-bounce">
          <BookOpen size={32} />
        </div>
        <p className="label-caps text-slate-500">Entering Classroom…</p>
      </div>
    );
  }

  const FileSidebar = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-5 shrink-0 border-b border-slate-100 flex items-center justify-between">
        <p className="label-caps text-slate-500">Knowledge Library</p>
        <button 
          onClick={() => setLibOpen(false)}
          className="hidden xl:flex w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-all"
          title="Collapse Sidebar"
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-5 py-4 shrink-0 border-b border-slate-100">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search materials…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold outline-none border-2 border-slate-100 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
        {filteredFiles.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
              <BookOpen size={24} />
            </div>
            <p className="text-sm font-bold text-slate-400">No documents found</p>
          </div>
        ) : filteredFiles.map((file: any) => {
          const active = selectedFile?.id === file.id;
          const name = file.displayName || file.originalName || file.name || 'Untitled';
          const sizeMB = file.sizeBytes ? `${(file.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '';
          return (
            <button
              key={file.id}
              onClick={() => { setSelectedFile(file); setSidebarOpen(false); setShowDoc(true); }}
              className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border shadow-sm ${
                active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold truncate">{name}</p>
                <p className={`text-xs mt-1 font-medium ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                  {sizeMB} {file.mimeType ? `• ${file.mimeType.split('/')[1]?.toUpperCase()}` : ''}
                </p>
              </div>
              {active && <ChevronRight size={18} className="mt-1 text-blue-200" />}
            </button>
          );
        })}
      </div>

      <div className="p-5 shrink-0 border-t border-slate-100 bg-blue-50/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-blue-600" />
          <span className="label-caps text-blue-600">Smart AI Study</span>
        </div>
        <p className="text-xs font-medium leading-relaxed text-slate-500">
          The built-in assistant reads your teacher's documents and answers based strictly on curriculum context.
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Top Header */}
      <header className="shrink-0 h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 z-30 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            onClick={() => setLibOpen(!libOpen)}
            className={`hidden xl:flex w-10 h-10 rounded-xl items-center justify-center transition-all border shadow-sm ${
              libOpen ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={libOpen ? 'Collapse Library' : 'Expand Library'}
          >
            <BookOpen size={18} />
          </button>

          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-900 leading-none">{classroom?.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Bot size={12} className="text-blue-600" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">AI Workspace</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 mr-2">
            <p className="label-caps mr-1 text-slate-500">Instructor</p>
            <p className="text-sm font-bold text-slate-800">{classroom?.teacher?.name}</p>
          </div>

          <button
            onClick={() => setShowDoc(!showDoc)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${
              showDoc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <FileText size={16} />
            <span className="hidden sm:inline">{showDoc ? 'Hide Document' : 'Show Document'}</span>
          </button>

          <button
            className="xl:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-700"
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <motion.aside 
          animate={{ width: libOpen ? 320 : 0, opacity: libOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'circOut' }}
          className="hidden xl:flex flex-col shrink-0 border-r border-slate-200 bg-white z-20 overflow-hidden relative"
        >
          <div className="w-80 h-full">
            <FileSidebar />
          </div>
        </motion.aside>

        {/* Reveal Button for Desktop when closed */}
        {!libOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setLibOpen(true)}
            className="hidden xl:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-32 bg-white border-r border-y border-slate-200 rounded-r-2xl items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all shadow-md group"
            title="Expand Knowledge Library"
          >
            <div className="flex flex-col items-center gap-4">
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-widest">Library</span>
            </div>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="xl:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="xl:hidden fixed top-16 left-0 bottom-0 z-50 w-[300px] flex flex-col border-r border-slate-200 bg-white">
                <FileSidebar />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Split */}
        <main className="flex-1 flex flex-col md:flex-row gap-5 p-5 overflow-hidden">
          {/* Document Section */}
          <AnimatePresence>
            {showDoc && (
              <motion.section 
                initial={{ width: 0, opacity: 0, scale: 0.95 }}
                animate={{ width: 'auto', opacity: 1, scale: 1 }}
                exit={{ width: 0, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'circOut' }}
                className="flex-[1.4] flex flex-col overflow-hidden min-h-[300px] md:min-h-0 relative z-10 origin-left"
              >
                {selectedFile ? (
                  <PDFViewer 
                    url={`http://localhost:3000/api/students/files/${selectedFile.id}`} 
                    fileName={selectedFile.displayName || selectedFile.originalName || selectedFile.name || 'Document'} 
                    mimeType={selectedFile.mimeType}
                    classId={classId}
                    selectedFileId={selectedFile.id}
                    onClose={() => setShowDoc(false)}
                    onPageChange={setCurrentPage}
                    onSelection={(text, image) => {
                      if (!sending) {
                        if (image) {
                            sendMessage(text, image);
                        } else {
                            sendMessage(`Summarize and explain this part of the document for me: "${text}"`);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
                    <FileText size={48} className="text-slate-200 mb-4" />
                    <p className="text-lg font-black text-slate-800">No Document Selected</p>
                    <p className="text-sm font-medium text-slate-500 mt-2">Pick a file from the sidebar to view</p>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* Chat Panel */}
          <section className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[400px] md:min-h-0 bg-white border border-slate-200 shadow-sm relative z-10">
            <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-inner mr-2">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">AI Learning Assistant</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active & Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/50">
                {(['all', 'file'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setChatScope(k)}
                    disabled={k === 'file' && !selectedFile}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                      chatScope === k ? 'bg-white text-blue-600 border border-slate-200/50' : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-700'
                    }`}
                    style={{ opacity: (k === 'file' && !selectedFile) ? 0.4 : 1 }}
                  >
                    {k === 'all' ? <Database size={12} /> : <FileText size={12} />}
                    {k === 'all' ? 'All' : 'File'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative border-t border-slate-100/50">
              <div className="flex flex-col h-full bg-slate-50/20">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-10">
                      <div className="w-20 h-20 rounded-[2rem] bg-blue-600/10 text-blue-600 flex items-center justify-center mb-8 shadow-inner animate-pulse">
                        <MessageSquare size={32} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Engage with your curriculum</h3>
                      <p className="text-sm font-medium text-slate-500 mb-10 max-w-xs leading-relaxed">
                        Query {chatScope === 'file' ? 'the active document' : 'the full course library'} for definitions, summaries, or deep dives.
                      </p>
                      <div className="grid gap-3 w-full max-w-sm">
                        {['Summarize key points', 'Explain the core theory', 'What should I study next?'].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                            className="px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 text-left bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-between group"
                          >
                            <span>{prompt}</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-md ${
                          msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-blue-600'
                        }`}>
                          {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>
                        <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-6 py-4 text-sm leading-relaxed rounded-3xl shadow-sm border ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 border-blue-600 text-white rounded-tr-sm font-bold antialiased' 
                              : msg.isError 
                                ? 'bg-red-50 border-red-200 text-red-600 rounded-tl-sm' 
                                : 'bg-white border-slate-100 text-slate-700 rounded-tl-sm'
                          }`}>
                            <MarkdownContent content={msg.content} role={msg.role} />
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1 px-1">
                              {msg.sources.slice(0, 3).map((s, si) => (
                                <button 
                                  key={si} 
                                  onClick={() => { const f = files.find((f: any) => f.id === s.file_id); if (f) setSelectedFile(f); }} 
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white border border-slate-100 text-slate-500 hover:border-blue-600 hover:text-blue-600 transition-all shadow-xs"
                                >
                                  <FileText size={12} /> {s.file_name?.split('/').pop()?.substring(0, 15)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                  {sending && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
                      <div className="shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-blue-400">
                        <Bot size={18} />
                      </div>
                      <div className="px-6 py-4 rounded-3xl rounded-tl-sm bg-white border border-slate-100 flex items-center gap-2 shadow-sm">
                        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-5 shrink-0 bg-white border-t border-slate-100/50">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-blue-500/5 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={chatScope === 'file' ? `Ask about active file…` : 'Type your question…'}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 bg-transparent text-sm font-black outline-none text-slate-800 placeholder-slate-400 h-10 tracking-tight"
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={sending || !input.trim()} 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        (sending || !input.trim()) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {sending ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send size={20} className="translate-x-[1px]" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
