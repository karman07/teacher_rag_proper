'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, Chip } from '@heroui/react';
import { ChevronDown, FileText, Image as ImageIcon, Hash, Eye } from 'lucide-react';
import { RAGSource } from '../../lib/ragApi';

function buildReferenceLabel(src: RAGSource): string[] {
  const parts: string[] = [];
  if (typeof src.page === 'number' && src.page > 0) parts.push(`page ${src.page}`);
  if (typeof src.image_index === 'number' && src.image_index > 0) parts.push(`image ${src.image_index}`);
  if (typeof src.chunk_idx === 'number' && src.chunk_idx >= 0) parts.push(`chunk ${src.chunk_idx}`);
  return parts;
}

function SourceTypeIcon({ contentType }: { contentType?: string | null }) {
  if (contentType === 'pdf_image' || contentType === 'image') {
    return <ImageIcon size={10} />;
  }
  return <FileText size={10} />;
}

export default function SourceCitations({ sources }: { sources: RAGSource[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!sources.length) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src) => {
          const key = `${src.file_id}:${src.chunk_idx ?? 'x'}`;
          const isOpen = openKey === key;
          const refLabel = buildReferenceLabel(src);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenKey((prev) => (prev === key ? null : key))}
              className="inline-flex items-center gap-1.5 text-[10px] text-default-500 bg-default-100/80 dark:bg-default-100/10 px-2.5 py-1 rounded-full border border-divider hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <SourceTypeIcon contentType={src.content_type} />
              <span className="max-w-[170px] truncate">{src.file_name}</span>
              {refLabel.length > 0 && (
                <span className="inline-flex items-center gap-1 text-default-400">
                  <Hash size={9} />
                  {refLabel.join(' • ')}
                </span>
              )}
              <span className="font-semibold text-success-500">{Math.round(src.relevance * 100)}%</span>
              <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {openKey && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            {sources
              .filter((src) => `${src.file_id}:${src.chunk_idx ?? 'x'}` === openKey)
              .map((src) => (
                <Card key={`${src.file_id}:${src.chunk_idx ?? 'x'}`} classNames={{ base: 'border border-divider bg-content1 shadow-none' }}>
                  <CardBody className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{src.file_name}</p>
                        <p className="text-[10px] text-default-400">
                          {buildReferenceLabel(src).join(' • ') || 'file-level reference'}
                          {src.content_type ? ` • ${src.content_type}` : ''}
                        </p>
                      </div>
                      <Chip size="sm" variant="flat" color="primary" classNames={{ content: 'text-[10px] font-bold' }}>
                        {Math.round(src.relevance * 100)}%
                      </Chip>
                    </div>

                    {src.snippet && (
                      <div className="rounded-xl border border-divider bg-default-50/60 dark:bg-default-100/5 p-2.5 text-[11px] leading-relaxed text-default-600">
                        <div className="flex items-center gap-1 mb-1 text-default-400 uppercase tracking-wider text-[9px] font-bold">
                          <Eye size={10} />
                          Answer source snippet
                        </div>
                        <p className="whitespace-pre-wrap">{src.snippet}</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
