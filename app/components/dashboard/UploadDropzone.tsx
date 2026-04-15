'use client';

import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardBody, Progress, Chip } from '@heroui/react';
import {
  CloudUpload, FileText, CheckCircle2, AlertCircle, Loader2, X, Upload
} from 'lucide-react';
import { knowledgeBaseApi, KnowledgeFile, formatBytes } from '../../lib/knowledgeBase';

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  onUploadComplete: (file: KnowledgeFile) => void;
  subjectId?: string;
}

const ALLOWED_EXT = '.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv';
const ACCEPTED_LABELS = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT', 'MD', 'CSV'];

function getFileExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export default function UploadDropzone({ onUploadComplete, subjectId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const uploadId = Math.random().toString(36).slice(2);
        setUploadingFiles((prev) => [
          { id: uploadId, name: file.name, size: file.size, progress: 0, status: 'uploading' },
          ...prev,
        ]);
        try {
          const result = await knowledgeBaseApi.uploadFile(file, (pct) => {
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === uploadId ? { ...f, progress: pct } : f))
            );
          }, subjectId);
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, status: 'done', progress: 100 } : f))
          );
          onUploadComplete(result);
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
          }, 3500);
        } catch (err: any) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadId ? { ...f, status: 'error', error: err.message } : f
            )
          );
        }
      }
    },
    [onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const dismissError = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer select-none transition-colors duration-200 ${
          isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-default-300 dark:border-default-200 hover:border-primary/50 hover:bg-default-50 dark:hover:bg-default-50/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXT}
          className="hidden"
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); }}
        />

        <div className="flex flex-col items-center gap-5">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-primary text-white' : 'bg-default-100 dark:bg-default-200/10 text-default-500'
          }`}>
            {isDragging
              ? <Upload size={28} className="text-white" />
              : <CloudUpload size={28} />
            }
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {isDragging ? 'Release to upload' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-default-400 mb-3">
              Max 50 MB per file
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {ACCEPTED_LABELS.map((ext) => (
                <span
                  key={ext}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-default-100 dark:bg-default-200/10 text-default-500 uppercase tracking-wide"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {!isDragging && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Upload size={14} />}
              className="font-semibold pointer-events-none"
            >
              Choose files
            </Button>
          )}
        </div>
      </motion.div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadingFiles.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1 overflow-hidden' }}>
              <CardBody className="p-3">
                <div className="flex items-center gap-3">
                  {/* File type badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 ${
                    f.status === 'error' ? 'bg-danger' :
                    f.status === 'done'  ? 'bg-success' : 'bg-primary'
                  }`}>
                    {getFileExt(f.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">{f.name}</p>
                      <span className="text-[10px] text-default-400 flex-shrink-0">{formatBytes(f.size)}</span>
                    </div>

                    {f.status === 'uploading' && (
                      <Progress
                        size="sm"
                        value={f.progress}
                        color="primary"
                        className="h-1"
                        classNames={{ track: 'h-1', indicator: 'h-1' }}
                        aria-label={`Uploading ${f.name}`}
                      />
                    )}
                    {f.status === 'done' && (
                      <p className="text-[10px] text-success font-medium">Upload complete ✓</p>
                    )}
                    {f.status === 'error' && (
                      <p className="text-[10px] text-danger font-medium truncate">{f.error}</p>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {f.status === 'uploading' && <Loader2 size={16} className="text-primary animate-spin" />}
                    {f.status === 'done'      && <CheckCircle2 size={16} className="text-success" />}
                    {f.status === 'error'     && (
                      <Button isIconOnly size="sm" variant="light" color="danger" className="h-6 w-6 min-w-6"
                        onClick={() => dismissError(f.id)}>
                        <X size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
