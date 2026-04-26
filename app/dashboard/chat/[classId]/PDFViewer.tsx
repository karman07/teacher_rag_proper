'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut, X, Download, Image as ImageIcon, FileDigit, Scissors, Sparkles, Bot, Edit3, Trash2, Video, Music } from 'lucide-react';
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
    highlightText?: string | null;
    yOffset?: number | null;
    timestamp?: string | null;
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
  onClose, onSelection, onPageChange, classId, selectedFileId, sourceFocusRequest,
  fileSource, originalName
}: PDFViewerProps & { fileSource?: string, originalName?: string }) {
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
  const similarityHighlightedSpansRef = useRef<HTMLElement[]>([]);

  const isPDF = mimeType.includes('pdf');
  const isImage = mimeType.includes('image');
  const isVideo = mimeType.includes('video');
  const isAudio = mimeType.includes('audio');
  const isYouTube = fileSource === 'youtube' || fileName.endsWith('.youtube') || mimeType === 'application/vnd.youtube.yt' || mimeType === 'text/plain' && originalName?.includes('youtube.com');
  
  const extractYoutubeVideoId = (urlStr: string) => {
    const match = urlStr.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
    return match ? match[1] : null;
  };

  const parseTimestampToSeconds = (ts: string | null | undefined) => {
    if (!ts) return null;
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  const youtubeVideoId = isYouTube ? extractYoutubeVideoId(originalName || '') : null;
  const startSeconds = parseTimestampToSeconds(sourceFocusRequest?.timestamp);
  const youtubeUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}${startSeconds ? `?start=${startSeconds}&autoplay=1` : ''}` : '';

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

  useEffect(() => { 
    fetchNotes(); 
    // Log file open activity
    if (classId && selectedFileId) {
      import('@/app/lib/api').then(({ studentApi }) => {
        studentApi.logActivity('file_open', classId, { fileId: selectedFileId, fileName });
      });
    }
  }, [fetchNotes, classId, selectedFileId, fileName]);

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

  const debugLog = (...args: any[]) => {
    console.log('[PDFViewer]', ...args);
  };

  const clearSimilarityHighlights = useCallback(() => {
    for (const el of similarityHighlightedSpansRef.current) {
      const prevBg = el.dataset.simPrevBg ?? '';
      const prevRadius = el.dataset.simPrevRadius ?? '';
      const prevShadow = el.dataset.simPrevShadow ?? '';
      el.style.background = prevBg;
      el.style.borderRadius = prevRadius;
      el.style.boxShadow = prevShadow;
      delete el.dataset.simPrevBg;
      delete el.dataset.simPrevRadius;
      delete el.dataset.simPrevShadow;
    }
    similarityHighlightedSpansRef.current = [];
  }, []);

  // Keep plugin creation at top-level render. This plugin internally uses hooks,
  // so wrapping it in useMemo callback breaks Rules of Hooks.
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
  });

  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  const jumpToPageRef = useRef<((pageIndex: number) => Promise<void> | void) | null>(null);

  const navigationBridgePlugin = useMemo(() => ({
    install: (pluginFunctions: any) => {
      jumpToPageRef.current = pluginFunctions?.jumpToPage ?? null;
      debugLog('navigation bridge installed', { hasJumpToPage: !!jumpToPageRef.current });
    },
    uninstall: () => {
      jumpToPageRef.current = null;
    },
  }), []);

  const plugins = useMemo(() => [
    highlightPluginInstance,
    searchPluginInstance,
    zoomPluginInstance,
    navigationBridgePlugin,
  ], [highlightPluginInstance, searchPluginInstance, zoomPluginInstance, navigationBridgePlugin]);

  // Store plugin methods in refs to avoid effect dependency loops
  const highlightMethodRef = useRef(searchPluginInstance.highlight);
  highlightMethodRef.current = searchPluginInstance.highlight;
  const clearHighlightsRef = useRef(searchPluginInstance.clearHighlights);
  clearHighlightsRef.current = searchPluginInstance.clearHighlights;
  const setTargetPagesRef = useRef(searchPluginInstance.setTargetPages);
  setTargetPagesRef.current = searchPluginInstance.setTargetPages;
  const jumpToMatchRef = useRef(searchPluginInstance.jumpToMatch);
  jumpToMatchRef.current = searchPluginInstance.jumpToMatch;

  // Zoom handlers: call plugin directly + update UI state
  const handleZoomIn = useCallback(() => {
    setScale(prev => {
      const next = Math.min(3, prev + 0.1);
      debugLog('zoom in', { prev, next, hasZoomTo: !!zoomPluginInstance.zoomTo });
      zoomPluginInstance.zoomTo(next);
      return next;
    });
  }, [debugLog, zoomPluginInstance]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(0.5, prev - 0.1);
      debugLog('zoom out', { prev, next, hasZoomTo: !!zoomPluginInstance.zoomTo });
      zoomPluginInstance.zoomTo(next);
      return next;
    });
  }, [debugLog, zoomPluginInstance]);

  // React to source focus requests — DOM-based page scrolling + search highlight
  const lastSourceRequestId = useRef<string | null>(null);
  useEffect(() => {
    if (!sourceFocusRequest || !isPDF) return;
    if (lastSourceRequestId.current === sourceFocusRequest.requestId) return;
    lastSourceRequestId.current = sourceFocusRequest.requestId;
    clearSimilarityHighlights();

    const timers: number[] = [];
    const pushTimer = (id: number) => timers.push(id);
    const cleanupTimers = () => timers.forEach((id) => window.clearTimeout(id));

    debugLog('sourceFocusRequest received', sourceFocusRequest);

    const { page, snippet, highlightText } = sourceFocusRequest;

    const findPageLayer = (targetPage: number) => {
      const container = containerRef.current;
      if (!container || targetPage <= 0) return null;
      return container.querySelector(`[data-testid="core__page-layer-${targetPage - 1}"]`) as HTMLElement | null;
    };

    // Scroll to target page via DOM
    if (page && page > 0) {
      setCurrentPage(page);
      onPageChange?.(page);

      const targetIndex = page - 1;
      if (jumpToPageRef.current) {
        debugLog('jumpToPage call', { page, targetIndex });
        Promise.resolve(jumpToPageRef.current(targetIndex))
          .then(() => debugLog('jumpToPage resolved', { page, targetIndex }))
          .catch((error) => console.error('[PDFViewer] jumpToPage failed', error));
      } else {
        debugLog('jumpToPage unavailable, using page-layer lookup only');
      }

      pushTimer(window.setTimeout(() => {
        const container = containerRef.current;
        debugLog('container ref', !!container);
        if (!container) return;

        // Debug: log all children class names to understand DOM structure
        const allEls = container.querySelectorAll('[data-testid]');
        debugLog('data-testid elements', Array.from(allEls).map(e => e.getAttribute('data-testid')).slice(0, 10));

        // Try direct target page layer first
        const pageEl = findPageLayer(page);
        debugLog('page element by data-testid', !!pageEl);

        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          debugLog('target page layer still missing after jump', { page });
        }
      }, 420));
    }

    // Highlight snippet text via search plugin
    const effectiveHighlight = (highlightText || snippet || '').replace(/\[\/?source.*?\]/g, '').trim();
    if (effectiveHighlight) {
      const normalizeForSearch = (input: string) => {
        return input
          .normalize('NFKC')
          .replace(/[•◦●·]/g, ' ')
          .replace(/[^\p{L}\p{N}\s.,:%()\/-]/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const buildCandidates = (primary: string, fallback?: string | null) => {
        const rawInputs = [primary, fallback || ''].filter(Boolean);
        const out: string[] = [];

        const addCandidate = (candidate: string, minLen = 12) => {
          const v = candidate.trim();
          if (v.length >= minLen) out.push(v);
        };

        for (const raw of rawInputs) {
          const normalized = normalizeForSearch(raw);
          if (!normalized) continue;

          addCandidate(normalized, 18);
          addCandidate(normalized.replace(/[.,;:()]/g, ' ').replace(/\s+/g, ' '), 18);

          const words = normalized.split(' ').filter((w) => w.length > 2);
          if (words.length >= 10) {
            addCandidate(words.slice(0, 10).join(' '), 16);
            const mid = Math.max(0, Math.floor(words.length / 2) - 5);
            addCandidate(words.slice(mid, mid + 10).join(' '), 16);
            addCandidate(words.slice(-10).join(' '), 16);
          }
          if (words.length >= 6) {
            addCandidate(words.slice(0, 6).join(' '), 12);
            addCandidate(words.slice(-6).join(' '), 12);
          }
        }

        return Array.from(new Set(out));
      };

      const candidates = buildCandidates(effectiveHighlight, snippet);
      const strictCandidates = candidates.filter((c) => c.length >= 24);
      const looseCandidates = candidates.filter((c) => c.length >= 12);

      debugLog('highlight candidates prepared', {
        total: candidates.length,
        strict: strictCandidates.length,
        loose: looseCandidates.length,
      });

      const maxAttempts = 18;
      let attempts = 0;

      if (page && page > 0) {
        const targetIndex = page - 1;
        const hasExactHighlight = !!(highlightText && highlightText.trim());
        setTargetPagesRef.current?.((target) => {
          if (hasExactHighlight) {
            return target.pageIndex === targetIndex;
          }
          // Heuristic snippets can be slightly off in page metadata.
          return Math.abs(target.pageIndex - targetIndex) <= 2;
        });
        debugLog('search target page set', {
          page,
          targetIndex,
          hasExactHighlight,
          window: hasExactHighlight ? 0 : 2,
        });
      }

      const tryHighlight = async () => {
        attempts += 1;
        const keywordBatch = attempts <= 6 ? strictCandidates : looseCandidates;
        const searchKeywords = (keywordBatch.length ? keywordBatch : looseCandidates)
          .slice(0, attempts <= 6 ? 6 : 10)
          .map((k) => ({ keyword: k, matchCase: false, wholeWords: false }));

        const pageLayerReady = !page || page <= 0 ? true : !!findPageLayer(page);
        debugLog('highlight attempt', {
          attempts,
          keywordsTried: searchKeywords.length,
          sampleKeywordLength: searchKeywords[0]?.keyword?.length ?? 0,
          usingFallback: attempts > 6,
          hasHighlightMethod: !!highlightMethodRef.current,
          pageLayerReady,
        });

        try {
          clearHighlightsRef.current?.();

          const matches = await Promise.resolve(highlightMethodRef.current?.(searchKeywords) || []);
          const matchedCount = Array.isArray(matches) ? matches.length : 0;

          debugLog('highlight result', {
            attempts,
            matchedCount,
            matchedPages: Array.isArray(matches) ? Array.from(new Set(matches.map((m: any) => m.pageIndex))) : [],
          });

          if (matchedCount > 0) {
            jumpToMatchRef.current?.(0);
            debugLog('highlight finished', {
              attempts,
              success: true,
              matchedCount,
            });
            return;
          }

          // Fallback: similarity-match against rendered text spans on target page.
          const trySimilarityHighlight = () => {
            if (!page || page <= 0) return false;

            const pageLayer = findPageLayer(page);
            if (!pageLayer) return false;

            const textLayer = pageLayer.querySelector(`[data-testid="core__text-layer-${page - 1}"]`) as HTMLElement | null;
            if (!textLayer) return false;

            const spanEls = Array.from(textLayer.querySelectorAll('.rpv-core__text-layer-text')) as HTMLElement[];
            if (!spanEls.length) return false;

            const normalize = (s: string) => s
              .normalize('NFKC')
              .toLowerCase()
              .replace(/[•◦●·]/g, ' ')
              .replace(/[^\p{L}\p{N}\s]/gu, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            const query = normalize(effectiveHighlight || snippet || '');
            const queryTokens = new Set(query.split(' ').filter((t) => t.length > 2));
            if (!queryTokens.size) return false;

            let best: { start: number; end: number; score: number } | null = null;

            for (let i = 0; i < spanEls.length; i++) {
              let combined = '';
              const maxWindow = Math.min(i + 8, spanEls.length);
              for (let j = i; j < maxWindow; j++) {
                const t = normalize(spanEls[j].textContent || '');
                if (!t) continue;
                combined = combined ? `${combined} ${t}` : t;

                const tokens = new Set(combined.split(' ').filter((w) => w.length > 2));
                if (!tokens.size) continue;

                let overlap = 0;
                queryTokens.forEach((tok) => {
                  if (tokens.has(tok)) overlap += 1;
                });

                const recall = overlap / queryTokens.size;
                const precision = overlap / Math.max(tokens.size, 1);
                const score = (0.72 * recall) + (0.28 * precision);

                if (!best || score > best.score) {
                  best = { start: i, end: j, score };
                }
              }
            }

            if (!best || best.score < 0.2) {
              debugLog('similarity fallback: no strong span match', { score: best?.score ?? 0 });
              return false;
            }

            clearSimilarityHighlights();
            const selected = spanEls.slice(best.start, best.end + 1);
            selected.forEach((el) => {
              el.dataset.simPrevBg = el.style.background || '';
              el.dataset.simPrevRadius = el.style.borderRadius || '';
              el.dataset.simPrevShadow = el.style.boxShadow || '';
              el.style.background = 'rgba(250, 204, 21, 0.45)';
              el.style.borderRadius = '4px';
              el.style.boxShadow = '0 0 0 1px rgba(234, 179, 8, 0.35)';
            });
            similarityHighlightedSpansRef.current = selected;
            selected[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            debugLog('similarity fallback applied', {
              score: best.score,
              spanStart: best.start,
              spanEnd: best.end,
              spanCount: selected.length,
            });
            return true;
          };

          if (attempts >= 4 && trySimilarityHighlight()) {
            debugLog('highlight finished', {
              attempts,
              success: true,
              via: 'similarity-fallback',
            });
            return;
          }
        } catch (error) {
          console.error('[PDFViewer] highlight call failed', error);
        }

        if (attempts >= maxAttempts) {
          debugLog('highlight finished', {
            attempts,
            success: false,
            candidatesTried: looseCandidates.length,
          });
          return;
        }

        const delay = attempts < 4 ? 120 : 220;
        pushTimer(window.setTimeout(tryHighlight, delay));
      };

      // First attempt quickly, then retry while PDF text layers settle.
      pushTimer(window.setTimeout(tryHighlight, 520));
    } else {
      debugLog('no highlight text found in sourceFocusRequest');
    }

    return () => {
      setTargetPagesRef.current?.(() => true);
      clearSimilarityHighlights();
      cleanupTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFocusRequest, isPDF, clearSimilarityHighlights]);

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
            {isYouTube || isVideo ? <Video size={16} /> : isAudio ? <Music size={16} /> : isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
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
          ) : isYouTube ? (
            <div className="h-full w-full flex items-center justify-center p-4 bg-slate-900 border-2 border-dashed border-slate-700 m-2 rounded-2xl overflow-hidden shadow-2xl">
              {youtubeVideoId ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={youtubeUrl} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  className="rounded-xl"
                />
              ) : (
                <p className="text-white text-sm font-bold">Could not load YouTube Video</p>
              )}
            </div>
          ) : isVideo ? (
            <div className="h-full flex items-center justify-center p-4 bg-slate-900 border-2 border-dashed border-slate-700 m-2 rounded-2xl overflow-hidden shadow-2xl">
              <video 
                src={authenticatedUrl} 
                controls 
                autoPlay
                className="max-h-full w-full rounded-xl"
              />
            </div>
          ) : isAudio ? (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-slate-50">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                <Music size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-6">{fileName}</h3>
              <audio 
                src={authenticatedUrl} 
                controls 
                autoPlay
                className="w-full max-w-md"
              />
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
