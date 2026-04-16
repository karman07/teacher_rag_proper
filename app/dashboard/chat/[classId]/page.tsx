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

const MarkdownContent = ({ content, role }: { content: string, role: 'user' | 'assistant' }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Detect list items: "1. ", "* ", "- ", "1. **"
        const listMatch = trimmed.match(/^(\d+\.|[*-])\s+(.*)/);
        const isListItem = !!listMatch;
        const displayLine = isListItem ? listMatch[2] : trimmed;

        return (
          <div key={idx} className={`${isListItem ? 'pl-5 relative' : ''}`}>
            {isListItem && (
              <span className={`absolute left-0 font-black ${role === 'user' ? 'text-white/60' : 'text-blue-600'}`}>
                {listMatch[1]}
              </span>
            )}
            {displayLine.split(/(\*\*.*?\*\*)/g).map((part, pidx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pidx} className={`font-black ${role === 'user' ? 'text-white' : 'text-slate-900 underline decoration-blue-500/20 underline-offset-2'}`}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pidx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
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
  const [chatScope, setChatScope] = useState<'all' | 'file'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
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
    console.log('--- sendMessage triggered ---', { overrideQuery: !!overrideQuery, image: !!imageBase64 });
    const q = overrideQuery || input.trim();
    if ((!q && !imageBase64) || sending) return;
    if (!overrideQuery) setInput('');

    if (imageBase64) {
      // toast.info("Visual analysis started..."); // If toast exists
      console.log('Sending visual snippet to AI...');
    }

    const userMsg: AugmentedMessage = { id: crypto.randomUUID(), role: 'user', content: q || 'Analyze this snippet' };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    incrementQuestionsAsked();

    try {
      const res = await queryRAG(
        q,
        classroom.collectionName,
        classroom.teacherId,
        messages.map(({ role, content }) => ({ role, content })),
        chatScope === 'file' ? selectedFile?.id : undefined,
        imageBase64
      );
      const botMsg: AugmentedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
                <div className="flex p-1 rounded-xl bg-slate-200/50 mr-4">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    AI Chat
                  </button>
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === 'notes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Notes
                  </button>
                </div>
                {activeTab === 'chat' && (
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Agent Ready</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/50">
                {activeTab === 'chat' && (['all', 'file'] as const).map(k => (
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

            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeTab === 'chat' ? (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                    <MessageSquare size={36} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">How can I help to clarify?</h3>
                  <p className="text-sm font-medium text-slate-500 mb-10 max-w-xs">
                    I can answer questions using {chatScope === 'file' ? 'only the selected document' : 'all available course materials'}.
                  </p>
                  <div className="grid gap-3 w-full max-w-sm">
                    {['Summarize this document', 'What are the key concepts?', 'Quiz me on this topic'].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                        className="px-5 py-4 rounded-2xl text-sm font-bold text-slate-700 text-left bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-between group"
                      >
                        {prompt}
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3.5 text-sm leading-relaxed rounded-2xl shadow-sm border ${
                        msg.role === 'user' ? 'bg-blue-600 border-blue-600 text-white rounded-br-sm font-medium' : msg.isError ? 'bg-red-50 border-red-200 text-red-600 rounded-bl-sm font-medium' : 'bg-white border-slate-200 text-slate-700 rounded-bl-sm'
                      }`}>
                        <MarkdownContent content={msg.content} role={msg.role} />
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.sources.slice(0, 3).map((s, si) => (
                            <button key={si} onClick={() => { const f = files.find((f: any) => f.id === s.file_id); if (f) setSelectedFile(f); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                              <FileText size={10} /> {s.file_name?.split('/').pop()?.substring(0, 20)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {sending && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-white border border-slate-200 flex items-center gap-1.5 shadow-sm">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

                    <div className="p-4 shrink-0 bg-white border-t border-slate-100">
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-blue-600 focus-within:bg-white transition-all">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder={chatScope === 'file' ? `Ask about "${(selectedFile?.displayName || selectedFile?.name || 'this file')?.substring(0, 20)}…"` : 'Type your question…'}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-800 placeholder-slate-400 h-10"
                        />
                        <button onClick={sendMessage} disabled={sending || !input.trim()} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          (sending || !input.trim()) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-md'
                        }`}>
                          {sending ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send size={18} className="translate-x-[1px]" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="notes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <NotesArea 
                      classId={classId} 
                      selectedFileId={selectedFile?.id} 
                      currentPage={currentPage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
