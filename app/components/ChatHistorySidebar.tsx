'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, ChevronRight, Clock, Loader2, History } from 'lucide-react';
import { studentApi, ChatSession } from '@/app/lib/api';

interface Props {
  subjectId: string;
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ChatHistorySidebar({ subjectId, activeSessionId, onSelectSession, onNewSession }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await studentApi.getChatSessions(subjectId);
      setSessions(data);
    } catch {
      // silent – not critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Refresh every 30s in case another tab updates
    const id = setInterval(fetchSessions, 30_000);
    return () => clearInterval(id);
  }, [subjectId]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleting(sessionId);
    try {
      await studentApi.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History size={15} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">Chat History</span>
        </div>
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm"
          title="New Chat"
        >
          <Plus size={12} strokeWidth={3} />
          New
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare size={28} className="mx-auto mb-3 text-slate-200" />
            <p className="text-xs font-bold text-slate-400">No chats yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sessions.map((session) => {
              const isActive = activeSessionId === session.id;
              const preview  = session.messages?.[0]?.content;
              const count    = session._count?.messages ?? 0;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => onSelectSession(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSession(session);
                    }
                  }}
                  className={`w-full group text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate leading-snug ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {session.title || 'New conversation'}
                      </p>
                      {preview && (
                        <p className={`text-[10px] mt-0.5 truncate leading-snug ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {preview.slice(0, 60)}
                        </p>
                      )}
                      <div className={`flex items-center gap-2 mt-1.5 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        <Clock size={9} />
                        <span className="text-[9px] font-semibold">{timeAgo(session.updatedAt)}</span>
                        <span className="text-[9px] font-semibold">·</span>
                        <span className="text-[9px] font-semibold">{count} msg{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={deleting === session.id}
                      className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                        isActive ? 'hover:bg-blue-500 text-blue-200' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                      }`}
                    >
                      {deleting === session.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
