'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut, X, Download, Image as ImageIcon, FileDigit, Scissors, Sparkles, Bot, Edit3, Trash2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API_URL } from '@/app/lib/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  } | null;
}

interface SavedNote {
  id: string;
  content: string;
  selectionText?: string;
  pageNumber?: number;
  fileId?: string;
  selectionCoords?: {
    version?: number;
    pageNumber?: number;
    quote?: string;
    startOffset?: number;
    endOffset?: number;
    rects?: Array<{ x: number; y: number; w: number; h: number }>;
  } | null;
  createdAt: string;
}

interface SelectionState {
  text: string;
  menuX: number;
  menuY: number;
  pageNumber: number;
  selectionCoords: {
    version: number;
    pageNumber: number;
    quote: string;
    rects: Array<{ x: number; y: number; w: number; h: number }>;
  };
}

interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function PDFViewer({
  url, fileName, mimeType = 'application/pdf',
  onClose, onSelection, onPageChange, classId, selectedFileId, sourceFocusRequest
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [snippetMode, setSnippetMode] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Selection & Notes state
  const [selState, setSelState] = useState<SelectionState | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [noteAnchor, setNoteAnchor] = useState<{ x: number; y: number } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [allNotes, setAllNotes] = useState<SavedNote[]>([]);
  const [hoveredNote, setHoveredNote] = useState<SavedNote | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [sourceHighlightRects, setSourceHighlightRects] = useState<NormalizedRect[]>([]);
  const [activeSourceFocus, setActiveSourceFocus] = useState<{
    requestId: string;
    fileId: string;
    page?: number | null;
    snippet?: string | null;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ x: number; y: number } | null>(null);
  const pageRefs = useRef<{ [k: number]: HTMLDivElement | null }>({});
  const lastAppliedSourceFocusRef = useRef<string | null>(null);

  const isPDF = mimeType.includes('pdf');
  const isImage = mimeType.includes('image');
  const token = typeof window !== 'undefined' ? localStorage.getItem('student-token') : '';
  const authenticatedUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

  // ── Fetch all notes for this file ─────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await fetch(`${API_URL}/students/classes/${classId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const fileNotes = (Array.isArray(data) ? data : []).filter(
        (n: any) => !selectedFileId || n.fileId === selectedFileId
      );
      setAllNotes(fileNotes);
    } catch (e) {
      console.error('Failed to fetch notes', e);
    }
  }, [classId, selectedFileId, token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Inject highlight CSS once ─────────────────────────────────────────────
  useEffect(() => {
    const styleId = 'student-note-highlight-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .student-note-overlay {
          background: rgba(59, 130, 246, 0.18);
          border-bottom: 1px solid rgba(37, 99, 235, 0.9);
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.2s;
          pointer-events: auto;
          border: 0;
        }
        .student-note-overlay:hover {
          background: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.22);
        }
        .student-note-overlay.active {
          background: rgba(37, 99, 235, 0.28);
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.32);
        }
        .ai-source-highlight {
          background: rgba(251, 191, 36, 0.22);
          border-bottom: 1px solid rgba(245, 158, 11, 0.95);
          border-radius: 2px;
          padding: 0;
          box-shadow: none;
          animation: ai-source-pulse 1.6s ease-out 1;
        }
        .ai-source-overlay {
          background: rgba(251, 191, 36, 0.2);
          border-bottom: 1px solid rgba(245, 158, 11, 0.92);
          border-radius: 2px;
          pointer-events: none;
          animation: ai-source-pulse 1.2s ease-out 1;
        }
        @keyframes ai-source-pulse {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6); }
          100% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
        }
        .react-pdf__Page__textContent span {
          cursor: text;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const getSelectionCoords = useCallback((range: Range, text: string) => {
    const common = range.commonAncestorContainer;
    const commonElement = (common.nodeType === Node.TEXT_NODE
      ? common.parentElement
      : common as Element) || null;
    const pageContainer = commonElement?.closest('[data-page-number]') as HTMLElement | null;
    if (!pageContainer) return null;

    const pageNumber = Number(pageContainer.getAttribute('data-page-number') || currentPage);
    const pageRect = pageContainer.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return null;

    const clamp01 = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(6))));

    const rects = Array.from(range.getClientRects())
      .map((rect) => {
        const left = Math.max(rect.left, pageRect.left);
        const top = Math.max(rect.top, pageRect.top);
        const right = Math.min(rect.right, pageRect.right);
        const bottom = Math.min(rect.bottom, pageRect.bottom);
        const width = right - left;
        const height = bottom - top;
        if (width <= 1 || height <= 1) return null;
        return {
          x: clamp01((left - pageRect.left) / pageRect.width),
          y: clamp01((top - pageRect.top) / pageRect.height),
          w: clamp01(width / pageRect.width),
          h: clamp01(height / pageRect.height),
        };
      })
      .filter((rect): rect is { x: number; y: number; w: number; h: number } => !!rect);

    if (!rects.length) return null;

    return {
      pageNumber,
      selectionCoords: {
        version: 1,
        pageNumber,
        quote: text,
        rects,
      },
    };
  }, [currentPage]);

  const clearSourceHighlights = useCallback(() => {
    setSourceHighlightRects([]);
  }, []);

  const setSourceRectsFromRange = useCallback((range: Range, pageContainer: HTMLElement) => {
    const pageRect = pageContainer.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) {
      setSourceHighlightRects([]);
      return;
    }

    const clamp01 = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(6))));

    const rects = Array.from(range.getClientRects())
      .map((rect) => {
        const left = Math.max(rect.left, pageRect.left);
        const top = Math.max(rect.top, pageRect.top);
        const right = Math.min(rect.right, pageRect.right);
        const bottom = Math.min(rect.bottom, pageRect.bottom);
        const width = right - left;
        const height = bottom - top;
        if (width <= 1 || height <= 1) return null;
        return {
          x: clamp01((left - pageRect.left) / pageRect.width),
          y: clamp01((top - pageRect.top) / pageRect.height),
          w: clamp01(width / pageRect.width),
          h: clamp01(height / pageRect.height),
        };
      })
      .filter((rect): rect is NormalizedRect => !!rect);

    setSourceHighlightRects(rects);
  }, []);

  const highlightSourceSnippet = useCallback((snippet?: string | null) => {
    clearSourceHighlights();
    const pageContainer = pageRefs.current[currentPage];
    if (!pageContainer || !snippet) return;

    const textLayer = pageContainer.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if ((node.textContent || '').trim()) {
        textNodes.push(node);
      }
    }
    if (!textNodes.length) return;

    const fullText = textNodes.map(n => n.textContent || '').join('');
    const normalizedSnippet = snippet
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      // Backend snippets may include synthetic metadata lines that never appear in PDF text layers.
      .filter((line) => !/^\[(source|classification):/i.test(line))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalizedSnippet.length < 12) return;
    const fullTextLower = fullText.toLowerCase();

    const candidates = [
      normalizedSnippet,
      normalizedSnippet.slice(0, 180),
      normalizedSnippet.slice(0, 120),
      normalizedSnippet.slice(0, 80),
    ].filter(s => s.length >= 24);

    let matchIdx = -1;
    let matchText = '';
    for (const candidate of candidates) {
      const idx = fullTextLower.indexOf(candidate.toLowerCase());
      if (idx >= 0) {
        matchIdx = idx;
        matchText = candidate;
        break;
      }
    }

    if (matchIdx >= 0) {
      let cursor = 0;
      for (const tn of textNodes) {
        const len = tn.textContent?.length || 0;
        if (matchIdx >= cursor && matchIdx < cursor + len) {
          const startOffset = matchIdx - cursor;
          const endOffset = Math.min(startOffset + matchText.length, len);
          const range = document.createRange();
          range.setStart(tn, startOffset);
          range.setEnd(tn, endOffset);
          setSourceRectsFromRange(range, pageContainer);
          return;
        }
        cursor += len;
      }
    }

    const tokens = Array.from(
      new Set((normalizedSnippet.toLowerCase().match(/[a-z0-9]{4,}/g) || []).slice(0, 24))
    );
    if (!tokens.length) return;

    const words = normalizedSnippet.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
    const phraseCandidates: string[] = [];
    for (let size = Math.min(10, words.length); size >= 5; size--) {
      for (let i = 0; i + size <= words.length; i++) {
        phraseCandidates.push(words.slice(i, i + size).join(' '));
      }
      if (phraseCandidates.length >= 20) break;
    }

    for (const tn of textNodes) {
      const text = (tn.textContent || '').toLowerCase();
      let bestPhrase = '';
      let bestIdx = -1;

      for (const phrase of phraseCandidates) {
        const idx = text.indexOf(phrase);
        if (idx >= 0 && phrase.length > bestPhrase.length) {
          bestPhrase = phrase;
          bestIdx = idx;
        }
      }

      if (bestIdx >= 0 && bestPhrase.length >= 24) {
        const range = document.createRange();
        range.setStart(tn, bestIdx);
        range.setEnd(tn, Math.min(bestIdx + bestPhrase.length, tn.textContent?.length || 0));
        setSourceRectsFromRange(range, pageContainer);
        return;
      }
    }

    let bestNode: Text | null = null;
    let bestScore = 0;
    let bestPositions: Array<{ start: number; end: number }> = [];

    for (const tn of textNodes) {
      const text = (tn.textContent || '').toLowerCase();
      const positions: Array<{ start: number; end: number }> = [];

      for (const token of tokens) {
        const idx = text.indexOf(token);
        if (idx >= 0) {
          positions.push({ start: idx, end: idx + token.length });
        }
      }

      if (positions.length > bestScore) {
        bestScore = positions.length;
        bestNode = tn;
        bestPositions = positions;
      }
    }

    if (!bestNode || bestScore < 3) return;

    const nodeLen = bestNode.textContent?.length || 0;
    const start = Math.max(0, Math.min(...bestPositions.map(p => p.start)) - 6);
    const coreEnd = Math.min(nodeLen, Math.max(...bestPositions.map(p => p.end)) + 6);
    const end = Math.min(nodeLen, Math.max(coreEnd, start + 40));

    if (end <= start) return;

    const range = document.createRange();
    range.setStart(bestNode, start);
    range.setEnd(bestNode, end);
    setSourceRectsFromRange(range, pageContainer);
  }, [clearSourceHighlights, currentPage, setSourceRectsFromRange]);

  useEffect(() => {
    if (!sourceFocusRequest || !isPDF) return;

    // New citation request: allow one fresh highlight application.
    lastAppliedSourceFocusRef.current = null;

    setActiveSourceFocus({
      requestId: sourceFocusRequest.requestId,
      fileId: sourceFocusRequest.fileId,
      page: sourceFocusRequest.page,
      snippet: sourceFocusRequest.snippet,
    });

    const targetPage = sourceFocusRequest.page && sourceFocusRequest.page > 0
      ? sourceFocusRequest.page
      : 1;

    setCurrentPage(targetPage);
    onPageChange?.(targetPage);

    setTimeout(() => {
      const pageEl = pageRefs.current[targetPage];
      if (pageEl && containerRef.current) {
        containerRef.current.scrollTo({
          top: Math.max(0, pageEl.offsetTop - 24),
          behavior: 'smooth',
        });
      }
    }, 120);
  }, [sourceFocusRequest, isPDF, onPageChange]);

  useEffect(() => {
    if (!activeSourceFocus || !isPDF) return;
    if (activeSourceFocus.page && activeSourceFocus.page !== currentPage) return;

    const applyKey = `${activeSourceFocus.requestId}:${currentPage}`;
    if (lastAppliedSourceFocusRef.current === applyKey) return;

    const timeout = setTimeout(() => {
      highlightSourceSnippet(activeSourceFocus.snippet);
      lastAppliedSourceFocusRef.current = applyKey;
    }, 420);

    return () => clearTimeout(timeout);
  }, [activeSourceFocus, currentPage, isPDF, highlightSourceSnippet]);

  // ── Page intersection observer ─────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          const p = parseInt(entry.target.getAttribute('data-page-number') || '1');
          setCurrentPage(p);
          onPageChange?.(p);
        }
      }),
      { threshold: 0.5, root: containerRef.current }
    );
    Object.values(pageRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, onPageChange]);

  // ── Text selection handler ─────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    if (snippetMode) return;
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && text.length > 2) {
      const range = sel?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect && range) {
        const captured = getSelectionCoords(range, text);
        if (!captured) return;
        setSelState({
          text,
          menuX: rect.left + rect.width / 2,
          menuY: rect.top - 10,
          pageNumber: captured.pageNumber,
          selectionCoords: captured.selectionCoords,
        });
        setAddingNote(false);
        setNoteAnchor(null);
      }
    } else {
      // Only clear if not in note editor
      if (!addingNote) setSelState(null);
    }
  }, [snippetMode, addingNote, getSelectionCoords]);

  useEffect(() => {
    if (!isPDF) return;
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isPDF, handleMouseUp]);

  // ── Note creation ──────────────────────────────────────────────────────────
  const handleSaveNote = async () => {
    if (!noteText.trim() || !classId || !selState) return;
    setSavingNote(true);
    try {
      const response = await fetch(`${API_URL}/students/classes/${classId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: noteText,
          fileId: selectedFileId,
          pageNumber: selState.pageNumber,
          selectionText: selState.text,
          selectionCoords: selState.selectionCoords,
        }),
      });

      if (!response.ok) {
        let message = 'Could not save note. Please try again.';
        try {
          const payload = await response.json();
          if (payload?.message) {
            message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
          }
        } catch {
          // Ignore JSON parse errors and keep generic message.
        }
        throw new Error(message);
      }

      setNoteText('');
      setAddingNote(false);
      setSelState(null);
      setNoteAnchor(null);
      window.getSelection()?.removeAllRanges();
      await fetchNotes();
    } catch (e) {
      console.error('Failed to save note', e);
      alert(e instanceof Error ? e.message : 'Could not save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`${API_URL}/students/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHoveredNote(null);
      await fetchNotes();
    } catch (e) {
      console.error('Failed to delete note', e);
    }
  };

  const getPageNoteRects = useCallback((note: SavedNote, pageNumber: number) => {
    const raw = note.selectionCoords;
    if (!raw || typeof raw !== 'object') return [] as Array<{ x: number; y: number; w: number; h: number }>;
    const targetPage = typeof raw.pageNumber === 'number' ? raw.pageNumber : note.pageNumber;
    if (targetPage !== pageNumber) return [];
    const rects = Array.isArray(raw.rects) ? raw.rects : [];
    return rects.filter((rect: any) => (
      rect
      && typeof rect.x === 'number'
      && typeof rect.y === 'number'
      && typeof rect.w === 'number'
      && typeof rect.h === 'number'
      && rect.w > 0
      && rect.h > 0
    ));
  }, []);

  const handleOverlayClick = useCallback((note: SavedNote, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveNoteId(note.id);
    setHoveredNote(note);
    setTooltipPos({ x: event.clientX, y: event.clientY - 60 });
  }, []);

  // ── Snippet capture ────────────────────────────────────────────────────────
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
      const canvases = Array.from(containerRef.current.querySelectorAll('.react-pdf__Page__canvas')) as HTMLCanvasElement[];
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
      alert('Could not capture snippet. Try selecting text instead.');
    } finally {
      setIsCapturing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isPDF) {
      return (
        <div className="flex flex-col items-center gap-6">
          <Document
            file={authenticatedUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="py-20 text-slate-400 text-sm font-bold animate-pulse">Loading document…</div>}
          >
            {Array.from(new Array(numPages), (_, i) => (
              <div
                key={i + 1}
                ref={el => { pageRefs.current[i + 1] = el; }}
                data-page-number={i + 1}
                className="relative mb-6"
              >
                <Page
                  pageNumber={i + 1}
                  scale={scale}
                  renderAnnotationLayer
                  renderTextLayer
                  className="shadow-2xl rounded-sm"
                />
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {allNotes.flatMap(note => getPageNoteRects(note, i + 1).map((rect, idx) => (
                    <button
                      key={`${note.id}-${idx}`}
                      type="button"
                      title={note.content}
                      onClick={(e) => handleOverlayClick(note, e)}
                      className={`student-note-overlay ${activeNoteId === note.id ? 'active' : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.w * 100}%`,
                        height: `${rect.h * 100}%`,
                      }}
                    />
                  )))}
                </div>
                {i + 1 === currentPage && sourceHighlightRects.length > 0 && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {sourceHighlightRects.map((rect, idx) => (
                      <div
                        key={`source-highlight-${idx}`}
                        className="ai-source-overlay"
                        style={{
                          position: 'absolute',
                          left: `${rect.x * 100}%`,
                          top: `${rect.y * 100}%`,
                          width: `${rect.w * 100}%`,
                          height: `${rect.h * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Document>
        </div>
      );
    }
    if (isImage) {
      return (
        <div className="flex flex-col items-center p-4">
          <img src={authenticatedUrl} alt={fileName} className="max-w-full h-auto rounded-lg shadow-2xl" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} />
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col items-center justify-center py-20 px-10 text-center">
        <FileDigit size={40} className="text-blue-600 mb-6" />
        <h3 className="text-lg font-black text-slate-900 mb-4">{fileName}</h3>
        <button onClick={() => window.open(authenticatedUrl, '_blank')} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
          <Download size={18} /> Download & View
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-100 bg-slate-50/80 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
            {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold truncate block max-w-[180px] text-slate-800" title={fileName}>{fileName}</span>
            {allNotes.length > 0 && (
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                {allNotes.filter(n => n.pageNumber === currentPage).length} note{allNotes.filter(n => n.pageNumber === currentPage).length !== 1 ? 's' : ''} on this page
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Snippet tool */}
          <button
            onClick={() => { setSnippetMode(s => !s); setSelState(null); setCropBox(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${snippetMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600'}`}
            title="Capture Visual Snippet"
          >
            <Scissors size={13} /> Snippet
          </button>

          {/* Zoom */}
          {(isPDF || isImage) && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <ToolBtn onClick={() => setScale(s => Math.max(0.5, s - 0.1))} title="Zoom out"><ZoomOut size={15} /></ToolBtn>
              <span className="text-[10px] font-black w-9 text-center text-slate-600">{Math.round(scale * 100)}%</span>
              <ToolBtn onClick={() => setScale(s => Math.min(3, s + 0.1))} title="Zoom in"><ZoomIn size={15} /></ToolBtn>
            </div>
          )}

          <button onClick={() => window.open(authenticatedUrl, '_blank')} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors" title="Open in new tab">
            <Download size={15} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Close">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Viewer area */}
      <div
        ref={containerRef}
        onMouseDown={handleDragDown}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragUp}
        className={`flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50 relative ${snippetMode ? 'cursor-crosshair select-none' : ''}`}
      >
        <div className={snippetMode ? 'pointer-events-none' : ''}>
          {renderContent()}
        </div>

        {/* Crop box */}
        {cropBox && (
          <div
            className="absolute border-2 border-blue-600 bg-blue-500/10 pointer-events-none z-20 rounded-sm"
            style={{ left: cropBox.x, top: cropBox.y, width: cropBox.w, height: cropBox.h, borderStyle: 'dashed' }}
          >
            {!isDrawing && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={captureSnippet}
                  disabled={isCapturing}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {isCapturing ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Sparkles size={14} className="text-blue-400" />}
                  {isCapturing ? 'Analyzing…' : 'Analyze Snippet'}
                </button>
                <button onClick={() => setCropBox(null)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-500 shadow-xl transition-all">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Selection Context Menu ───────────────────────────────── */}
      <AnimatePresence>
        {selState && !addingNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            className="fixed z-[200] pointer-events-auto"
            style={{ left: selState.menuX - 120, top: selState.menuY - 52 }}
          >
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 flex overflow-hidden">
              <button
                onClick={() => {
                  onSelection?.(selState.text);
                  setSelState(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:bg-white/10 transition-colors border-r border-white/10"
              >
                <Sparkles size={13} /> Analyze
              </button>
              <button
                onClick={() => {
                  // anchor the note editor to the cursor area
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  if (containerRect) {
                    setNoteAnchor({
                      x: Math.min(selState.menuX - containerRect.left, (containerRect.width || 300) - 270),
                      y: selState.menuY - containerRect.top + 20 + (containerRef.current?.scrollTop || 0),
                    });
                  }
                  setAddingNote(true);
                }}
                className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:bg-white/10 transition-colors border-r border-white/10"
              >
                <Edit3 size={13} /> Note
              </button>
              <button
                onClick={() => {
                  onSelection?.(`Explain this passage in detail: "${selState.text}"`);
                  setSelState(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:bg-white/10 transition-colors border-r border-white/10"
              >
                <Bot size={13} /> Ask AI
              </button>
              <button
                onClick={() => { setSelState(null); window.getSelection()?.removeAllRanges(); }}
                className="px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            {/* caret */}
            <div className="w-3 h-3 bg-slate-900 transform rotate-45 border-r border-b border-white/10 mx-auto -mt-[7px] relative z-[-1]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Note Editor ───────────────────────────────────────────── */}
      <AnimatePresence>
        {addingNote && selState && noteAnchor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-[200] bg-white rounded-2xl shadow-2xl border-2 border-blue-400 p-4 w-64"
            style={{ left: noteAnchor.x, top: noteAnchor.y }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Pin Note</span>
              </div>
              <button onClick={() => { setAddingNote(false); setSelState(null); setNoteAnchor(null); window.getSelection()?.removeAllRanges(); }}>
                <X size={14} className="text-slate-300 hover:text-red-400 transition-colors" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic mb-3 border-l-2 border-blue-200 pl-2 line-clamp-2">
              "{selState.text}"
            </p>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSaveNote(); }}
              placeholder="Write your insight… (Ctrl+Enter to save)"
              className="w-full h-24 bg-slate-50 rounded-xl p-3 text-xs font-bold outline-none border border-transparent focus:border-blue-300 focus:bg-white transition-all text-slate-800 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setAddingNote(false); setSelState(null); setNoteAnchor(null); }} className="flex-1 py-2 rounded-lg border border-slate-200 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !noteText.trim()}
                className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {savingNote ? 'Saving…' : 'Pin ✦'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Note Tooltip (click on highlight) ─────────────────────────────── */}
      <AnimatePresence>
        {hoveredNote && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-[300] bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 max-w-xs"
            style={{ left: Math.min(tooltipPos.x, window.innerWidth - 320), top: tooltipPos.y }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Your Note · Page {hoveredNote.pageNumber}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDeleteNote(hoveredNote.id)} className="p-1 rounded-md hover:bg-red-500/20 text-red-400 transition-colors" title="Delete note">
                  <Trash2 size={13} />
                </button>
                <button onClick={() => setHoveredNote(null)} className="p-1 rounded-md hover:bg-white/10 text-slate-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic mb-2 border-l-2 border-blue-400/40 pl-2 line-clamp-1">"{hoveredNote.selectionText}"</p>
            <p className="text-sm font-bold text-white leading-relaxed">{hoveredNote.content}</p>
            <p className="text-[9px] text-slate-500 mt-2">{new Date(hoveredNote.createdAt).toLocaleDateString()}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolBtn({ children, onClick, disabled, title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'}`}
    >
      {children}
    </button>
  );
}
