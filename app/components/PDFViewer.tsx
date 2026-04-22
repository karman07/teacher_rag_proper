'use client';

import { useState, useCallback, useMemo } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import { Button } from '@heroui/react';
import { ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
}

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [scale, setScale] = useState(1.0);

  const zoomPluginInstance = zoomPlugin();
  const plugins = useMemo(() => [zoomPluginInstance], [zoomPluginInstance]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => {
      const next = Math.min(2.0, prev + 0.1);
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
          <Button isIconOnly size="sm" variant="light" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-[10px] font-black w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button isIconOnly size="sm" variant="light" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="light" onClick={() => window.open(url, '_blank')}>
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 flex justify-center scrollbar-hide bg-slate-100 dark:bg-slate-950/50 relative">
        <Worker workerUrl={`//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
          <Viewer fileUrl={url} defaultScale={scale} plugins={plugins} />
        </Worker>
      </div>
    </div>
  );
}
