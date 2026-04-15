'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Table, TableHeader, TableBody, TableColumn, TableRow, TableCell,
  Button, Chip, Tooltip, Card, CardBody, Spinner, User
} from '@heroui/react';
import {
  Trash2, FileText, FileSpreadsheet, Presentation, BookOpen,
  CheckCircle2, Loader2, AlertCircle, Clock, RefreshCw,
  HardDrive, Cloud, Upload
} from 'lucide-react';
import { KnowledgeFile, knowledgeBaseApi, formatBytes } from '../../lib/knowledgeBase';

/* --- File type config ------------------------------------------------------- */
const FILE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pdf:  { label: 'PDF',  color: '#ef4444', bg: '#fef2f2', icon: FileText },
  docx: { label: 'DOCX', color: '#2563eb', bg: '#eff6ff', icon: BookOpen },
  doc:  { label: 'DOC',  color: '#2563eb', bg: '#eff6ff', icon: BookOpen },
  pptx: { label: 'PPTX', color: '#f97316', bg: '#fff7ed', icon: Presentation },
  xlsx: { label: 'XLSX', color: '#16a34a', bg: '#f0fdf4', icon: FileSpreadsheet },
  csv:  { label: 'CSV',  color: '#16a34a', bg: '#f0fdf4', icon: FileSpreadsheet },
  txt:  { label: 'TXT',  color: '#6b7280', bg: '#f9fafb', icon: FileText },
  md:   { label: 'MD',   color: '#8b5cf6', bg: '#f5f3ff', icon: FileText },
};

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? 'txt';
  return FILE_TYPE_CONFIG[ext] ?? { label: ext.toUpperCase(), color: '#6b7280', bg: '#f9fafb', icon: FileText };
}

/* --- Source config ----------------------------------------------------------- */
const SOURCE_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; variant: 'flat' | 'bordered' | 'solid' }> = {
  upload:       { label: 'Direct Upload',  color: 'primary',   variant: 'flat' },
  google_drive: { label: 'Google Drive',   color: 'success',   variant: 'flat' },
  dropbox:      { label: 'Dropbox',        color: 'secondary', variant: 'flat' },
  notion:       { label: 'Notion',         color: 'warning',   variant: 'flat' },
  onedrive:     { label: 'OneDrive',       color: 'default',   variant: 'flat' },
};

/* --- Status config ----------------------------------------------------------- */
const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; icon: React.ElementType; spin?: boolean }> = {
  ready:      { label: 'Ready',      color: 'success', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'warning', icon: Loader2, spin: true },
  uploading:  { label: 'Uploading',  color: 'primary', icon: RefreshCw, spin: true },
  error:      { label: 'Error',      color: 'danger',  icon: AlertCircle },
};

/* --- Props ------------------------------------------------------------------- */
interface Props {
  files: KnowledgeFile[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const COLUMNS = [
  { key: 'name',      label: 'FILE NAME' },
  { key: 'source',    label: 'SOURCE' },
  { key: 'size',      label: 'SIZE' },
  { key: 'date',      label: 'ADDED' },
  { key: 'status',    label: 'STATUS' },
  { key: 'actions',   label: '' },
];

/* --- Component --------------------------------------------------------------- */
export default function FileTable({ files, isLoading, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this file from your knowledge base?')) return;
    setDeletingId(id);
    try {
      await knowledgeBaseApi.deleteFile(id);
      onDelete(id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* Loading skeleton */
  if (isLoading) {
    return (
      <Card className="border border-divider bg-content1 shadow-none">
        <CardBody className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-default-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 bg-default-200 rounded-lg" />
                <div className="h-2.5 w-32 bg-default-100 rounded-lg" />
              </div>
              <div className="h-5 w-20 bg-default-200 rounded-full" />
              <div className="h-5 w-24 bg-default-100 rounded-lg" />
              <div className="h-5 w-14 bg-default-200 rounded-full" />
            </div>
          ))}
        </CardBody>
      </Card>
    );
  }

  /* Empty state */
  if (files.length === 0) {
    return (
      <Card className="border border-dashed border-default-300 dark:border-default-200 bg-default-50 dark:bg-default-100/5 shadow-none">
        <CardBody className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-default-100 dark:bg-default-200/10 flex items-center justify-center">
            <HardDrive size={28} className="text-default-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-default-600">Your knowledge base is empty</p>
            <p className="text-xs text-default-400 mt-1 max-w-xs">
              Upload files above or connect a cloud source to start building your personal RAG knowledge base.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  /* Data table */
  return (
    <Card className="shadow-none border border-divider bg-content1 overflow-hidden">
      <Table
        aria-label="Knowledge base files"
        removeWrapper
        classNames={{
          th: 'bg-default-50 dark:bg-default-100/5 text-default-500 text-[11px] font-bold tracking-wider first:rounded-tl-none last:rounded-tr-none',
          td: 'py-3 border-b border-divider last-of-type:border-b-0',
          tr: 'group transition-colors hover:bg-default-50 dark:hover:bg-default-100/5',
        }}
      >
        <TableHeader columns={COLUMNS}>
          {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
        </TableHeader>

        <TableBody>
          {files.map((file) => {
            const ft = getFileType(file.originalName);
            const FileIcon = ft.icon;
            const src = SOURCE_CONFIG[file.source] ?? SOURCE_CONFIG.upload;
            const status = STATUS_CONFIG[file.status] ?? STATUS_CONFIG.ready;
            const StatusIcon = status.icon;

            return (
              <TableRow key={file.id}>
                {/* -- File name -- */}
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: ft.bg }}
                    >
                      <FileIcon size={16} style={{ color: ft.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate max-w-[220px]" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-[11px] text-default-400 mt-0.5 font-mono">{ft.label}</p>
                    </div>
                  </div>
                </TableCell>

                {/* -- Source -- */}
                <TableCell>
                  <Chip
                    size="sm"
                    color={src.color}
                    variant={src.variant}
                    classNames={{ content: 'text-[11px] font-semibold px-0.5' }}
                  >
                    {src.label}
                  </Chip>
                </TableCell>

                {/* -- Size -- */}
                <TableCell>
                  <span className="text-xs text-default-500 font-medium tabular-nums">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </TableCell>

                {/* -- Date -- */}
                <TableCell>
                  <span className="text-xs text-default-500 whitespace-nowrap">
                    {new Date(file.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </TableCell>

                {/* -- Status -- */}
                <TableCell>
                  <Chip
                    size="sm"
                    color={status.color}
                    variant="flat"
                    startContent={
                      <StatusIcon
                        size={11}
                        className={status.spin ? 'animate-spin' : ''}
                      />
                    }
                    classNames={{ content: 'text-[11px] font-semibold pl-0' }}
                  >
                    {status.label}
                  </Chip>
                </TableCell>

                {/* -- Actions -- */}
                <TableCell>
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Delete file" color="danger" size="sm" placement="left">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        isLoading={deletingId === file.id}
                        onClick={() => handleDelete(file.id)}
                        className="h-7 w-7 min-w-7"
                      >
                        {deletingId !== file.id && <Trash2 size={13} />}
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
