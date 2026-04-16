'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ZoomIn, ZoomOut, ExternalLink, Sparkles, X, Download, Image as ImageIcon, FileDigit, Eye, Scissors, Square } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  fileName: string;
  mimeType?: string;
  onClose?: () => void;
  onSelection?: (text: string, image?: string) => void;
  onPageChange?: (page: number) => void;
}

export default function PDFViewer({ url, fileName, mimeType = 'application/pdf', onClose, onSelection, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.2);
  const [selection, setSelection] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number, y: number } | null>(null);
  const [snippetMode, setSnippetMode] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ x: number, y: number } | null>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const isPDF = mimeType.includes('pdf');
  const isImage = mimeType.includes('image');
  const isOffice = mimeType.includes('officedocument') || mimeType.includes('word') || mimeType.includes('presentation') || mimeType.includes('sheet');

  const token = typeof window !== 'undefined' ? localStorage.getItem('student-token') : '';
  const authenticatedUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
            setCurrentPage(pageNum);
            if (onPageChange) onPageChange(pageNum);
          }
        });
      },
      { threshold: 0.5, root: containerRef.current }
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Track text selection
  useEffect(() => {
    if (!isPDF || snippetMode) return;
    const handleSelection = () => {
      const sel = window.getSelection();
      const selectedText = sel?.toString().trim();
      
      if (selectedText && selectedText.length > 3) {
        setSelection(selectedText);
        
        try {
          const range = sel?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setSelectionCoords({
              x: rect.left - containerRect.left + (rect.width / 2),
              y: rect.top - containerRect.top - 10
            });
          }
        } catch (e) {}
      } else {
        setSelection('');
        setSelectionCoords(null);
      }
    };
    
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isPDF, snippetMode]);

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
      h: Math.abs(curY - drawingRef.current.y)
    });
  };

  const handleDragUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // If box is too small, just clear it
      if (cropBox && (cropBox.w < 10 || cropBox.h < 10)) {
        setCropBox(null);
      }
    }
  };

  const captureSnippet = async () => {
    if (!cropBox || !containerRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const canvases = Array.from(containerRef.current.querySelectorAll('.react-pdf__Page__canvas')) as HTMLCanvasElement[];
      
      if (canvases.length === 0) {
          throw new Error("No PDF canvases found in the viewer.");
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropBox.w;
      finalCanvas.height = cropBox.h;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not initialize 2D context.");

      canvases.forEach((canvas) => {
        const rect = canvas.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const canvasX = rect.left - containerRect.left;
        const canvasY = rect.top - containerRect.top + containerRef.current!.scrollTop;

        const interX = Math.max(cropBox.x, canvasX);
        const interY = Math.max(cropBox.y, canvasY);
        const interW = Math.min(cropBox.x + cropBox.w, canvasX + rect.width) - interX;
        const interH = Math.min(cropBox.y + cropBox.h, canvasY + rect.height) - interY;

        if (interW > 0 && interH > 0) {
          const ratio = canvas.width / rect.width;
          const sx = (interX - canvasX) * ratio;
          const sy = (interY - canvasY) * ratio;
          const sw = interW * ratio;
          const sh = interH * ratio;
          const dx = interX - cropBox.x;
          const dy = interY - cropBox.y;
          ctx.drawImage(canvas, sx, sy, sw, sh, dx, dy, interW, interH);
        }
      });

      const base64 = finalCanvas.toDataURL('image/png');
      if (onSelection) {
          onSelection(`Analyze this document snippet (Page ${currentPage})`, base64);
          console.log("Handoff to AI successful");
      }
      setCropBox(null);
      setSnippetMode(false);
    } catch (err) {
      console.error("Snippet capture failed:", err);
      alert("Note: Could not capture visual snippet. This can happen if the document server restricts visual access. Please try selecting text instead.");
    } finally {
      setIsCapturing(false);
    }
  };

  const renderViewer = () => {
    if (isPDF) {
      return (
        <div className="flex flex-col items-center gap-6">
          <Document
            file={authenticatedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <p className="label-caps text-slate-400">Loading curriculum…</p>
              </div>
            }
            error={
              <div className="py-20 text-center">
                <p className="text-sm font-bold text-red-500">Failed to load PDF</p>
                <p className="text-xs text-slate-500 mt-1">Please try refreshing the page</p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div 
                key={`page_${index + 1}`} 
                ref={el => { pageRefs.current[index + 1] = el }}
                data-page-number={index + 1}
                className="relative group mb-6"
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  className="shadow-xl"
                />
                <div className="absolute -left-12 top-0 h-full hidden lg:flex items-start pt-4">
                  <span className="text-[10px] font-black text-slate-300 transform -rotate-90 origin-top-left">PAGE {index + 1}</span>
                </div>
              </div>
            ))}
          </Document>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex flex-col items-center p-4">
          <img 
            src={authenticatedUrl} 
            alt={fileName} 
            className="max-w-full h-auto rounded-lg shadow-2xl border border-slate-200"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          />
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center py-20 px-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm border border-blue-100">
          <FileDigit size={36} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{fileName}</h3>
        <p className="text-sm font-medium text-slate-500 mb-8 max-w-xs">
          This file type ({mimeType.split('/').pop()?.toUpperCase()}) is best viewed by downloading.
        </p>
        <button 
          onClick={() => window.open(authenticatedUrl, '_blank')}
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
        >
          <Download size={18} /> Download and View
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      <style>{`
        .react-pdf__Page__textContent { opacity: 0.15; }
        .react-pdf__Page__canvas { margin: 0 auto; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1); border-radius: 4px; }
        .pdf-scroll-container::-webkit-scrollbar { width: 6px; }
        .pdf-scroll-container::-webkit-scrollbar-track { background: transparent; }
        .pdf-scroll-container::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .pdf-scroll-container::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-100 bg-slate-50 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0 bg-blue-100 text-blue-600">
            {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
          </div>
          <span className="text-sm font-bold truncate max-w-[200px] text-slate-800" title={fileName}>{fileName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm mr-2">
            <button 
              onClick={() => { setSnippetMode(!snippetMode); setSelection(''); setCropBox(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                snippetMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
              title="Snippet Tool (Select Area)"
            >
              <Scissors size={14} />
              <span>Snippet</span>
            </button>
          </div>
          {(isPDF || isImage) && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <ToolBtn onClick={() => setScale(s => Math.max(0.5, s - 0.1))} title="Zoom out"><ZoomOut size={16} /></ToolBtn>
              <span className="text-[10px] font-black w-10 text-center text-slate-600">{Math.round(scale * 100)}%</span>
              <ToolBtn onClick={() => setScale(s => Math.min(2.5, s + 0.1))} title="Zoom in"><ZoomIn size={16} /></ToolBtn>
            </div>
          )}
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => window.open(authenticatedUrl, '_blank')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm"
              title="Download/Open"
            >
              <Download size={16} />
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                title="Close Viewer"
              >
                <X size={16} className="group-active:scale-90 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Indicator (Context Menu Style) */}
      <AnimatePresence>
        {selection && selectionCoords && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50 pointer-events-none"
            style={{ 
              left: Math.max(10, Math.min(selectionCoords.x, (containerRef.current?.offsetWidth || 0) - 150)), 
              top: selectionCoords.y - 60 
            }}
          >
            <div className="pointer-events-auto bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10 flex items-center overflow-hidden h-12 shadow-blue-500/10 backdrop-blur-md">
              <div className="flex items-center gap-2 px-3 border-r border-white/10 bg-white/5 h-full">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-blue-300">Smart Tool</span>
              </div>
              
              <button 
                onClick={() => {
                  if (onSelection) onSelection(selection);
                  setSelection('');
                  setSelectionCoords(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="px-4 h-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 border-r border-white/5"
              >
                Explain with AI
              </button>

              <button 
                onClick={() => { setSelection(''); setSelectionCoords(null); window.getSelection()?.removeAllRanges(); }} 
                className="px-3 h-full hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            {/* Pointer arrow */}
            <div className="w-3 h-3 bg-slate-900 border-r border-b border-white/10 transform rotate-45 mx-auto -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewer Area */}
      <div 
        ref={containerRef} 
        onMouseDown={handleDragDown}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragUp}
        className={`flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50 pdf-scroll-container scroll-auto relative ${snippetMode ? 'cursor-crosshair' : ''}`}
      >
        <div className={snippetMode ? 'pointer-events-none' : ''}>
          {renderViewer()}
        </div>
        
        {/* Visual Crop Box Overlay */}
        {cropBox && (
          <div 
            className="absolute border-2 border-blue-600 bg-blue-500/10 pointer-events-none z-10 rounded-sm"
            style={{ 
              left: cropBox.x, 
              top: cropBox.y, 
              width: cropBox.w, 
              height: cropBox.h,
              borderStyle: 'dashed'
            }}
          >
            {!isDrawing && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                <button 
                  onClick={captureSnippet}
                  disabled={isCapturing}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-blue-600 transition-all border border-white/10 disabled:opacity-50"
                >
                  {isCapturing ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Sparkles size={14} className="text-blue-400" />
                  )}
                  {isCapturing ? 'Analyzing…' : 'Analyze Snippet'}
                </button>
                <button 
                  onClick={() => setCropBox(null)}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-500 shadow-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, disabled, title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${disabled ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}
