'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut, X, Download, Image as ImageIcon, FileDigit, Scissors, Sparkles, Bot, Edit3, Trash2 } from 'lucide-react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import type { RenderPage, RenderPageProps } from '@react-pdf-viewer/core';
import { highlightPlugin, RenderHighlightTargetProps, RenderHighlightContentProps } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { API_URL } from '@/app/lib/api';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';


interface PDFViewerProps {
  url: string;
  fileName: string;
  mimeType?: string;
  onClose?: () => void;
  onSelection?: (text: string, image?: string) => void;
  onPageChange?: (page: number) => void;
  classId?: string;
  selectedFileId?: string;
  sourceFocusRequest?: {
    requestId: string;
    fileId: string;
    page?: number | null;
    chunkIdx?: number | null;
    snippet?: string | null;
    yOffset?: number | null;
  } | null;
}

interface SavedNote {
  id: string;
  content: string;
  selectionText?: string;
  pageNumber?: number;
  fileId?: string;
  selectionCoords?: any;
  createdAt: string;
}

export default function PDFViewer({
  url, fileName, mimeType = 'application/pdf',
  onClose, onSelection, onPageChange, classId, selectedFileId, sourceFocusRequest
}: PDFViewerProps) {
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [snippetMode, setSnippetMode] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Notes state
  const [allNotes, setAllNotes] = useState<SavedNote[]>([]);
  const [hoveredNote, setHoveredNote] = useState<SavedNote | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ x: number; y: number } | null>(null);

  const isPDF = mimeType.includes('pdf');
  const isImage = mimeType.includes('image');
  const token = typeof window !== 'undefined' ? localStorage.getItem('student-token') : '';
  const authenticatedUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

  // --- Refs for stable plugin callbacks ---
  const snippetModeRef = useRef(snippetMode);
  snippetModeRef.current = snippetMode;
  const onSelectionRef = useRef(onSelection);
  onSelectionRef.current = onSelection;
  const classIdRef = useRef(classId);
  classIdRef.current = classId;
  const selectedFileIdRef = useRef(selectedFileId);
  selectedFileIdRef.current = selectedFileId;
  const tokenRef = useRef(token);
  tokenRef.current = token;


  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    if (!classIdRef.current) return;
    try {
      const res = await fetch(`${API_URL}/students/classes/${classIdRef.current}/notes`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      const fileNotes = (Array.isArray(data) ? data : []).filter(
        (n: any) => !selectedFileIdRef.current || n.fileId === selectedFileIdRef.current
      );
      setAllNotes(fileNotes);
    } catch (e) {
      console.error('Failed to fetch notes', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotesRef = useRef(fetchNotes);
  fetchNotesRef.current = fetchNotes;

  useEffect(() => { fetchNotes(); }, [fetchNotes, classId, selectedFileId]);

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`${API_URL}/students/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      setHoveredNote(null);
      await fetchNotesRef.current();
    } catch (e) {
      console.error('Failed to delete note', e);
    }
  };

  // --- Stable plugin callbacks (empty deps, access state via refs) ---
  const renderHighlightTarget = useCallback((props: RenderHighlightTargetProps) => {
    if (snippetModeRef.current) return <></>;
    return (
      <div
        className="fixed z-[200] pointer-events-auto flex items-center bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          transform: 'translate(0, 8px)',
        }}
      >
        <button
          onClick={() => {
            onSelectionRef.current?.(props.selectedText);
            props.cancel();
          }}
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:bg-white/10 transition-colors border-r border-white/10"
        >
          <Sparkles size={13} /> Analyze
        </button>
        <button
          onClick={props.toggle}
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:bg-white/10 transition-colors border-r border-white/10"
        >
          <Edit3 size={13} /> Note
        </button>
        <button
          onClick={() => {
            onSelectionRef.current?.(`Explain this passage in detail: "${props.selectedText}"`);
            props.cancel();
          }}
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:bg-white/10 transition-colors border-r border-white/10"
        >
          <Bot size={13} /> Ask AI
        </button>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderHighlightContent = useCallback((props: RenderHighlightContentProps) => {
    return (
      <HighlightContentForm
        props={props}
        classIdRef={classIdRef}
        selectedFileIdRef={selectedFileIdRef}
        tokenRef={tokenRef}
        fetchNotesRef={fetchNotesRef}
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Plugins: called unconditionally at top level (they use hooks internally) ---
  // Highlight plugin: only for text selection → Note creation (no renderHighlights)
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
  });

  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();

  // Stable plugins array
  const plugins = useMemo(
    () => [highlightPluginInstance, searchPluginInstance, zoomPluginInstance],
    [highlightPluginInstance, searchPluginInstance, zoomPluginInstance]
  );

  // Store plugin methods in refs to avoid effect dependency loops
  const highlightMethodRef = useRef(searchPluginInstance.highlight);
  highlightMethodRef.current = searchPluginInstance.highlight;

  // Zoom handlers: call plugin directly + update UI state
  const handleZoomIn = useCallback(() => {
    setScale(prev => {
      const next = Math.min(3, prev + 0.1);
      zoomPluginInstance.zoomTo(next);
      return next;
    });
  }, [zoomPluginInstance]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(0.5, prev - 0.1);
      zoomPluginInstance.zoomTo(next);
      return next;
    });
  }, [zoomPluginInstance]);

  // React to source focus requests — DOM-based page scrolling + search highlight
  const lastSourceRequestId = useRef<string | null>(null);
  useEffect(() => {
    if (!sourceFocusRequest || !isPDF) return;
    if (lastSourceRequestId.current === sourceFocusRequest.requestId) return;
    lastSourceRequestId.current = sourceFocusRequest.requestId;

    console.log('[PDFViewer] sourceFocusRequest received:', sourceFocusRequest);

    const { page, snippet } = sourceFocusRequest;

    // Scroll to target page via DOM
    if (page && page > 0) {
      setCurrentPage(page);
      onPageChange?.(page);

      setTimeout(() => {
        const container = containerRef.current;
        console.log('[PDFViewer] container ref:', !!container);
        if (!container) return;

        // Debug: log all children class names to understand DOM structure
        const allEls = container.querySelectorAll('[data-testid]');
        console.log('[PDFViewer] data-testid elements:', Array.from(allEls).map(e => e.getAttribute('data-testid')).slice(0, 10));
        const rpvClasses = container.querySelectorAll('[class*="rpv-core"]');
        console.log('[PDFViewer] rpv-core elements:', Array.from(rpvClasses).map(e => e.className).slice(0, 10));

        // Try data-testid first
        const pageEl = container.querySelector(
          `[data-testid="core__page-layer-${page - 1}"]`
        ) as HTMLElement;
        console.log('[PDFViewer] pageEl by data-testid:', !!pageEl);

        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Broader fallback: any element with page-related classes
          const allPages = container.querySelectorAll('[class*="page-layer"], [class*="inner-page"], [data-testid*="page"]');
          console.log('[PDFViewer] fallback page elements found:', allPages.length);
          const target = allPages[page - 1] as HTMLElement;
          if (target) {
            console.log('[PDFViewer] scrolling to fallback target:', target.className || target.getAttribute('data-testid'));
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            console.warn('[PDFViewer] No page element found for page', page);
          }
        }
      }, 400);
    }

    // Highlight snippet text via search plugin
    if (snippet) {
       const cleanSnippet = snippet.replace(/\[\/?source.*?\]/g, '').trim().substring(0, 100);
       console.log('[PDFViewer] highlighting snippet:', cleanSnippet);
       setTimeout(() => {
         console.log('[PDFViewer] highlight method exists:', !!highlightMethodRef.current);
         highlightMethodRef.current?.(cleanSnippet);
       }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFocusRequest, isPDF]);

  // --- renderPage: inject note highlight overlays directly into each page ---
  const renderPage: RenderPage = useCallback((props: RenderPageProps) => {
    return (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}
        <NoteOverlayLayer
          pageIndex={props.pageIndex}
          allNotes={allNotes}
          onNoteClick={(note, e) => {
            setHoveredNote(note);
            setTooltipPos({ x: e.clientX, y: e.clientY - 60 });
          }}
        />
      </>
    );
  }, [allNotes]);


  // Snippet drawing logic
  const handleDragDown = (e: React.MouseEvent) => {
    if (!snippetMode) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    setIsDrawing(true);
    drawingRef.current = { x, y };
    setCropBox({ x, y, w: 0, h: 0 });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    setCropBox({
      x: Math.min(drawingRef.current.x, curX),
      y: Math.min(drawingRef.current.y, curY),
      w: Math.abs(curX - drawingRef.current.x),
      h: Math.abs(curY - drawingRef.current.y),
    });
  };

  const handleDragUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (cropBox && (cropBox.w < 10 || cropBox.h < 10)) setCropBox(null);
    }
  };

  const captureSnippet = async () => {
    if (!cropBox || !containerRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvases = Array.from(containerRef.current.querySelectorAll('.rpv-core__page-layer canvas')) as HTMLCanvasElement[];
      if (!canvases.length) throw new Error('No canvas found');
      
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropBox.w;
      finalCanvas.height = cropBox.h;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('No ctx');
      
      canvases.forEach(canvas => {
        const rect = canvas.getBoundingClientRect();
        const cRect = containerRef.current!.getBoundingClientRect();
        const canvasX = rect.left - cRect.left;
        const canvasY = rect.top - cRect.top + containerRef.current!.scrollTop;
        const iX = Math.max(cropBox.x, canvasX);
        const iY = Math.max(cropBox.y, canvasY);
        const iW = Math.min(cropBox.x + cropBox.w, canvasX + rect.width) - iX;
        const iH = Math.min(cropBox.y + cropBox.h, canvasY + rect.height) - iY;
        if (iW > 0 && iH > 0) {
          const ratio = canvas.width / rect.width;
          ctx.drawImage(canvas, (iX - canvasX) * ratio, (iY - canvasY) * ratio, iW * ratio, iH * ratio, iX - cropBox.x, iY - cropBox.y, iW, iH);
        }
      });
      const base64 = finalCanvas.toDataURL('image/png');
      onSelection?.(`Analyze this document snippet (Page ${currentPage})`, base64);
      setCropBox(null);
      setSnippetMode(false);
    } catch (err) {
      console.error('Snippet capture failed:', err);
      alert('Could not capture snippet.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-100 bg-slate-50/80 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
            {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold truncate block max-w-[180px] text-slate-800" title={fileName}>{fileName}</span>
            {allNotes.length > 0 && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                {allNotes.length} note(s) saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPDF && (
            <button
              onClick={() => { setSnippetMode(s => !s); setCropBox(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${snippetMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600'}`}
              title="Capture Visual Snippet"
            >
              <Scissors size={13} /> Snippet
            </button>
          )}

          {(isPDF || isImage) && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <ToolBtn onClick={handleZoomOut} title="Zoom out"><ZoomOut size={15} /></ToolBtn>
              <span className="text-[10px] font-black w-9 text-center text-slate-600">{Math.round(scale * 100)}%</span>
              <ToolBtn onClick={handleZoomIn} title="Zoom in"><ZoomIn size={15} /></ToolBtn>
            </div>
          )}

          <button onClick={() => window.open(authenticatedUrl, '_blank')} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors" title="Download">
            <Download size={15} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Close">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleDragDown}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragUp}
        className={`flex-1 overflow-auto bg-slate-100/50 relative ${snippetMode ? 'cursor-crosshair select-none' : ''}`}
      >
        <div className={snippetMode ? 'pointer-events-none' : ''} style={{ height: '100%' }}>
          {isPDF ? (
            <Worker workerUrl={`//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
              <Viewer 
                fileUrl={authenticatedUrl} 
                defaultScale={scale}
                plugins={plugins}
                renderPage={renderPage}
                onPageChange={(e) => {
                  setCurrentPage(e.currentPage + 1);
                  onPageChange?.(e.currentPage + 1);
                }}
              />
            </Worker>
          ) : isImage ? (
            <div className="flex justify-center p-4">
              <img src={authenticatedUrl} alt={fileName} className="max-w-full rounded-lg shadow-2xl" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <FileDigit size={40} className="text-blue-600 mb-6" />
              <h3 className="text-lg font-black text-slate-900 mb-4">{fileName}</h3>
              <button onClick={() => window.open(authenticatedUrl, '_blank')} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg">
                Download to View
              </button>
            </div>
          )}
        </div>

        {cropBox && (
          <div
            className="absolute border-2 border-blue-600 bg-blue-500/10 pointer-events-none z-[300] rounded-sm"
            style={{ left: cropBox.x, top: cropBox.y, width: cropBox.w, height: cropBox.h, borderStyle: 'dashed' }}
          >
            {!isDrawing && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                <button onClick={captureSnippet} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-blue-600">
                  <Sparkles size={14} className="text-blue-400" /> Analyze
                </button>
                <button onClick={() => setCropBox(null)} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:text-red-500 shadow-xl">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {hoveredNote && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed z-[400] bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 max-w-xs"
            style={{ left: Math.min(tooltipPos.x, window.innerWidth - 320), top: tooltipPos.y }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Note · Page {hoveredNote.pageNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleDeleteNote(hoveredNote.id)} className="p-1 rounded-md hover:bg-red-500/20 text-red-400"><Trash2 size={13} /></button>
                <button onClick={() => setHoveredNote(null)} className="p-1 rounded-md hover:bg-white/10 text-slate-400"><X size={13} /></button>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic mb-2 border-l-2 border-amber-400/60 pl-2 line-clamp-1">"{hoveredNote.selectionText}"</p>
            <p className="text-sm font-bold text-white max-h-40 overflow-y-auto">{hoveredNote.content}</p>
            <p className="text-[9px] text-slate-500 mt-2">{new Date(hoveredNote.createdAt).toLocaleDateString()}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Note overlay layer rendered PER PAGE via renderPage ---
function NoteOverlayLayer({ pageIndex, allNotes, onNoteClick }: {
  pageIndex: number;
  allNotes: SavedNote[];
  onNoteClick: (note: SavedNote, e: React.MouseEvent) => void;
}) {
  const pageNotes = allNotes.filter(note => {
    const coords = note.selectionCoords;
    if (!coords || !Array.isArray(coords.rects) || coords.rects.length === 0) return false;
    const pNum = typeof coords.pageNumber === 'number' ? coords.pageNumber : note.pageNumber;
    return pNum === pageIndex + 1; // pageIndex is 0-based, pageNumber is 1-based
  });

  if (pageNotes.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {pageNotes.map(note =>
        note.selectionCoords.rects.map((r: any, idx: number) => (
          <div
            key={`${note.id}-${idx}`}
            style={{
              position: 'absolute',
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.w * 100}%`,
              height: `${r.h * 100}%`,
              background: 'rgba(253, 224, 71, 0.4)',
              borderBottom: '2px solid rgba(234, 179, 8, 0.9)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(253, 224, 71, 0.6)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(253, 224, 71, 0.4)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick(note, e);
            }}
          />
        ))
      )}
    </div>
  );
}

// --- Note creation form (own component so it can use useState safely) ---
function HighlightContentForm({ props, classIdRef, selectedFileIdRef, tokenRef, fetchNotesRef }: {
  props: RenderHighlightContentProps;
  classIdRef: React.MutableRefObject<string | undefined>;
  selectedFileIdRef: React.MutableRefObject<string | undefined>;
  tokenRef: React.MutableRefObject<string | null>;
  fetchNotesRef: React.MutableRefObject<() => Promise<void>>;
}) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!noteText.trim() || !classIdRef.current) return;
    setSaving(true);
    try {
      const pageNumber = props.highlightAreas[0].pageIndex + 1;
      const rects = props.highlightAreas.map(h => ({
        x: h.left / 100, y: h.top / 100, w: h.width / 100, h: h.height / 100,
      }));

      const response = await fetch(`${API_URL}/students/classes/${classIdRef.current}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({
          content: noteText, fileId: selectedFileIdRef.current, pageNumber,
          selectionText: props.selectedText,
          selectionCoords: { version: 1, pageNumber, quote: props.selectedText, rects },
        }),
      });

      if (!response.ok) throw new Error('Failed to save note');
      await fetchNotesRef.current();
      props.cancel();
    } catch (e) {
      console.error(e);
      alert('Could not save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="absolute z-[200] bg-white rounded-2xl shadow-2xl border-2 border-amber-400 p-4 w-64"
      style={{
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: 'translate(0, 8px)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Pin Note</span>
        </div>
        <button onClick={props.cancel}>
          <X size={14} className="text-slate-300 hover:text-red-400 transition-colors" />
        </button>
      </div>
      <p className="text-[10px] text-slate-400 italic mb-3 border-l-2 border-blue-200 pl-2 line-clamp-2">
        "{props.selectedText}"
      </p>
      <textarea
        autoFocus
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Write your insight..."
        className="w-full h-24 bg-slate-50 rounded-xl p-3 text-xs font-bold outline-none border border-transparent focus:border-blue-300 transition-all text-slate-800 resize-none"
      />
      <div className="flex gap-2 mt-3">
        <button onClick={props.cancel} className="flex-1 py-2 rounded-lg border border-slate-200 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600">Cancel</button>
        <button onClick={onSave} disabled={saving || !noteText.trim()} className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Pin ✦'}
        </button>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors">
      {children}
    </button>
  );
}
