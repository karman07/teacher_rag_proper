'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button, Spinner } from '@heroui/react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  fileName?: string;
}

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                <FileText size={16} />
            </div>
            <span className="text-xs font-black truncate max-w-[150px]">{fileName || 'Document'}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="light" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-[10px] font-black w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button isIconOnly size="sm" variant="light" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
            <ZoomIn size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button 
                isIconOnly 
                size="sm" 
                variant="flat" 
                disabled={pageNumber <= 1} 
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                className="rounded-lg h-7 w-7"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-[10px] font-black min-w-[50px] text-center">
              {pageNumber} / {numPages || '--'}
            </span>
            <Button 
                isIconOnly 
                size="sm" 
                variant="flat" 
                disabled={numPages ? pageNumber >= numPages : true} 
                onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
                className="rounded-lg h-7 w-7"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
          <Button isIconOnly size="sm" variant="light" onClick={() => window.open(url, '_blank')}>
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 flex justify-center scrollbar-hide bg-slate-100 dark:bg-slate-950/50">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Document...</p>
            </div>
          }
          error={
             <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                    <FileText size={32} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Failed to load PDF</h3>
                <p className="text-xs font-medium text-slate-500">Please check your connection or try again later.</p>
             </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            className="shadow-2xl rounded-sm overflow-hidden"
          />
        </Document>
      </div>
    </div>
  );
}
