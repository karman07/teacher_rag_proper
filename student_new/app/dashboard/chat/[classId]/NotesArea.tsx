'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit3, Trash2, Calendar, FileText, 
  ChevronRight, Save, X, BookOpen, AlertCircle
} from 'lucide-react';
import { studentApi } from '@/app/lib/api';

interface Note {
  id: string;
  content: string;
  fileId?: string;
  file?: { name: string; displayName?: string };
  pageNumber?: number;
  createdAt: string;
  updatedAt: string;
}

interface NotesAreaProps {
  classId: string;
  selectedFileId?: string;
  currentPage?: number;
}

export default function NotesArea({ classId, selectedFileId, currentPage }: NotesAreaProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [classId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getNotes(classId);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      setSaving(true);
      const payload = {
          content: newNoteContent,
          fileId: selectedFileId,
          pageNumber: currentPage
      };
      if (editingNote) {
        await studentApi.updateNote(editingNote.id, newNoteContent);
      } else {
        // We need to update api.ts to support pageNumber in createNote
        await axios.post(`http://localhost:3000/api/students/classes/${classId}/notes`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('student-token')}` } });
      }
      setNewNoteContent('');
      setEditingNote(null);
      setShowEditor(false);
      fetchNotes();
    } catch (err) {
      console.error('Failed to save note', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await studentApi.deleteNote(id);
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-6 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-inner">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Study Workspace</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Insights</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingNote(null); setNewNoteContent(''); setShowEditor(true); }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} /> New Note
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Search through your records…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
        <AnimatePresence>
          {showEditor && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border-2 border-blue-600 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-blue-50 text-blue-600">
                    {editingNote ? 'Reviewing Entry' : 'New Study Record'}
                  </span>
                  {selectedFileId && !editingNote && (
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <FileText size={10} /> Page {currentPage}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowEditor(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <X size={18} />
                </button>
              </div>
              
              <textarea 
                autoFocus
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                placeholder="Connect the dots... Write down your key takeaways from this section."
                className="w-full h-48 bg-slate-50/50 rounded-2xl p-5 text-sm font-medium outline-none focus:bg-white transition-all text-slate-800 resize-none border border-slate-100 placeholder:text-slate-300"
              />

              <div className="flex items-center justify-end mt-4">
                <button 
                  onClick={handleSaveNote}
                  disabled={saving || !newNoteContent.trim()}
                  className="px-8 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-blue-500/20"
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Save size={16} /> Finalize Note</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center animate-pulse mb-4">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Workspace…</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white text-slate-200 flex items-center justify-center mb-8 shadow-sm border border-slate-100">
              <BookOpen size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Workspace Empty</h3>
            <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
              Your personal insights help bridge the gap between reading and understanding. {searchQuery ? "No matches found." : "Create your first study record now!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredNotes.map(note => (
              <motion.div 
                key={note.id}
                layout
                className="group relative bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-600/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <FileText size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-900 tracking-tight">
                          {note.file ? (note.file.displayName || note.file.name.substring(0, 20)) : 'General Note'}
                        </span>
                        {note.pageNumber && (
                          <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            P.{note.pageNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                        Captured {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { setEditingNote(note); setNewNoteContent(note.content); setShowEditor(true); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 text-sm leading-relaxed font-semibold whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-1/3 opacity-20" />
                  </div>
                  <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em]">
                    Insight Verified
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
