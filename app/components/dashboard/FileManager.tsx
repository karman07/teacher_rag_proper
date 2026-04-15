'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button, Input, Chip, Card, CardBody, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem, Tooltip, Pagination, Select, SelectItem
} from '@heroui/react';
import {
  Search, Grid3x3, List, Trash2, MessageCircle, FileText,
  BookOpen, FileSpreadsheet, Presentation, Filter, SortAsc,
  SortDesc, Upload, ChevronDown, Eye, RefreshCw, AlertCircle,
  CheckCircle2, Loader2, Clock
} from 'lucide-react';
import { KnowledgeFile, knowledgeBaseApi, formatBytes } from '../../lib/knowledgeBase';

/* --- Types ---------------------------------------------------------------- */
type ViewMode = 'grid' | 'list';
type SortKey  = 'name' | 'date' | 'size' | 'status';
type SortDir  = 'asc' | 'desc';

/* --- File type config ----------------------------------------------------- */
const FILE_TYPE: Record<string, { label: string; color: string; bg: string; darkBg: string; icon: React.ElementType }> = {
  pdf:  { label: 'PDF',  color: '#ef4444', bg: '#fef2f2', darkBg: '#ef44441a', icon: FileText },
  docx: { label: 'DOCX', color: '#2563eb', bg: '#eff6ff', darkBg: '#2563eb1a', icon: BookOpen },
  doc:  { label: 'DOC',  color: '#2563eb', bg: '#eff6ff', darkBg: '#2563eb1a', icon: BookOpen },
  pptx: { label: 'PPTX', color: '#f97316', bg: '#fff7ed', darkBg: '#f973161a', icon: Presentation },
  xlsx: { label: 'XLSX', color: '#16a34a', bg: '#f0fdf4', darkBg: '#16a34a1a', icon: FileSpreadsheet },
  csv:  { label: 'CSV',  color: '#16a34a', bg: '#f0fdf4', darkBg: '#16a34a1a', icon: FileSpreadsheet },
  txt:  { label: 'TXT',  color: '#6b7280', bg: '#f9fafb', darkBg: '#6b72801a', icon: FileText },
  md:   { label: 'MD',   color: '#8b5cf6', bg: '#f5f3ff', darkBg: '#8b5cf61a', icon: FileText },
};
const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? 'txt';
  return FILE_TYPE[ext] ?? { label: ext.toUpperCase(), color: '#6b7280', bg: '#f9fafb', darkBg: '#6b72801a', icon: FileText };
};

/* --- Status config -------------------------------------------------------- */
const STATUS_CFG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'default'; icon: React.ElementType; spin?: boolean }> = {
  ready:      { label: 'Ready',      color: 'success', icon: CheckCircle2 },
  processing: { label: 'Indexing',   color: 'warning', icon: Loader2, spin: true },
  uploading:  { label: 'Uploading',  color: 'primary', icon: RefreshCw, spin: true },
  error:      { label: 'Error',      color: 'danger',  icon: AlertCircle },
};

/* --- Source labels -------------------------------------------------------- */
const SOURCE_LABEL: Record<string, string> = {
  upload: 'Direct Upload', google_drive: 'Google Drive',
  dropbox: 'Dropbox', notion: 'Notion', onedrive: 'OneDrive',
};

const PAGE_SIZE = 12;

/* --- Grid card ------------------------------------------------------------ */
function FileCard({
  file, selected, onSelect, onDelete, onChat, deletingId
}: {
  file: KnowledgeFile; selected: boolean; onSelect: () => void;
  onDelete: (id: string) => void; onChat: (file: KnowledgeFile) => void;
  deletingId: string | null;
}) {
  const ft = getFileType(file.originalName);
  const Icon = ft.icon;
  const st = STATUS_CFG[file.status] ?? STATUS_CFG.ready;
  const StIcon = st.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`relative group cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden ${
        selected
          ? 'border-primary/60 bg-primary/5 ring-2 ring-primary/20'
          : 'border-divider bg-content1 hover:border-primary/30 hover:shadow-md dark:hover:shadow-none'
      }`}
      onClick={onSelect}
    >
      {/* Checkbox overlay */}
      <div className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        selected ? 'bg-primary border-primary scale-100' : 'bg-content1/90 border-default-300 scale-0 group-hover:scale-100'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Type header */}
      <div className="h-24 flex items-center justify-center" style={{ backgroundColor: ft.bg }}>
        <Icon size={36} style={{ color: ft.color }} />
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-foreground truncate mb-1" title={file.originalName}>
          {file.originalName}
        </p>
        <div className="flex items-center justify-between gap-1">
          <Chip size="sm" color={st.color} variant="flat"
            startContent={<StIcon size={9} className={st.spin ? 'animate-spin' : ''} />}
            classNames={{ content: 'text-[9px] font-bold px-0', base: 'h-4' }}>
            {st.label}
          </Chip>
          <span className="text-[10px] text-default-400 tabular-nums">{formatBytes(file.sizeBytes)}</span>
        </div>
        <p className="text-[10px] text-default-400 mt-1">
          {SOURCE_LABEL[file.source] ?? file.source} · {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content="Chat with file" size="sm" color="primary">
          <Button isIconOnly size="sm" variant="flat" color="primary"
            className="h-7 w-7 min-w-7"
            onClick={(e) => { e.stopPropagation(); onChat(file); }}>
            <MessageCircle size={12} />
          </Button>
        </Tooltip>
        <Tooltip content="Delete" size="sm" color="danger">
          <Button isIconOnly size="sm" variant="flat" color="danger"
            className="h-7 w-7 min-w-7"
            isLoading={deletingId === file.id}
            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}>
            {deletingId !== file.id && <Trash2 size={11} />}
          </Button>
        </Tooltip>
      </div>

      {/* Chunk count badge */}
      {file.status === 'ready' && file.chunkCount > 0 && (
        <div className="absolute top-2.5 right-2.5 text-[9px] font-black bg-success/90 text-white px-1.5 py-0.5 rounded-full">
          {file.chunkCount}c
        </div>
      )}
    </motion.div>
  );
}

/* --- List row ------------------------------------------------------------- */
function FileRow({
  file, selected, onSelect, onDelete, onChat, deletingId
}: {
  file: KnowledgeFile; selected: boolean; onSelect: () => void;
  onDelete: (id: string) => void; onChat: (file: KnowledgeFile) => void;
  deletingId: string | null;
}) {
  const ft = getFileType(file.originalName);
  const Icon = ft.icon;
  const st = STATUS_CFG[file.status] ?? STATUS_CFG.ready;
  const StIcon = st.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={onSelect}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-primary/50 bg-primary/5'
          : 'border-transparent hover:border-divider hover:bg-default-50 dark:hover:bg-default-100/5'
      }`}
    >
      {/* Checkbox */}
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'bg-primary border-primary' : 'border-default-300'
      }`}>
        {selected && <div className="w-2 h-2 rounded-sm bg-white" />}
      </div>

      {/* Icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ft.bg }}>
        <Icon size={15} style={{ color: ft.color }} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{file.originalName}</p>
        <p className="text-[11px] text-default-400">{SOURCE_LABEL[file.source] ?? file.source}</p>
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <span className="text-xs text-default-400 tabular-nums w-16 text-right">{formatBytes(file.sizeBytes)}</span>
        <Chip size="sm" color={st.color} variant="flat"
          startContent={<StIcon size={10} className={st.spin ? 'animate-spin' : ''} />}
          classNames={{ content: 'text-[10px] font-semibold', base: 'h-5' }}>
          {st.label}
        </Chip>
        <span className="text-xs text-default-400 w-24 text-right">
          {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Actions — shown on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Tooltip content="Chat" size="sm" color="primary">
          <Button isIconOnly size="sm" variant="light" color="primary" className="h-7 w-7 min-w-7"
            onClick={(e) => { e.stopPropagation(); onChat(file); }}>
            <MessageCircle size={13} />
          </Button>
        </Tooltip>
        <Tooltip content="Delete" size="sm" color="danger">
          <Button isIconOnly size="sm" variant="light" color="danger" className="h-7 w-7 min-w-7"
            isLoading={deletingId === file.id}
            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}>
            {deletingId !== file.id && <Trash2 size={12} />}
          </Button>
        </Tooltip>
      </div>
    </motion.div>
  );
}

/* --- Main component ------------------------------------------------------- */
interface Props {
  files: KnowledgeFile[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onChatWithFile: (file: KnowledgeFile) => void;
}

export default function FileManager({ files, isLoading, onDelete, onChatWithFile }: Props) {
  const [viewMode,   setViewMode]   = useState<ViewMode>('grid');
  const [search,     setSearch]     = useState('');
  const [sortKey,    setSortKey]    = useState<SortKey>('date');
  const [sortDir,    setSortDir]    = useState<SortDir>('desc');
  const [filterSrc,  setFilterSrc]  = useState<string>('all');
  const [filterSt,   setFilterSt]   = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [page,       setPage]       = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  /* Derived */
  const sorted = useMemo(() => {
    let list = files.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch = !q || f.originalName.toLowerCase().includes(q);
      const matchSrc  = filterSrc  === 'all' || f.source  === filterSrc;
      const matchSt   = filterSt   === 'all' || f.status  === filterSt;
      const matchType = filterType === 'all' || f.originalName.toLowerCase().endsWith(filterType);
      return matchSearch && matchSrc && matchSt && matchType;
    });

    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name')   diff = a.originalName.localeCompare(b.originalName);
      if (sortKey === 'date')   diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === 'size')   diff = a.sizeBytes - b.sizeBytes;
      if (sortKey === 'status') diff = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? diff : -diff;
    });

    return list;
  }, [files, search, sortKey, sortDir, filterSrc, filterSt, filterType]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((f) => f.id)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this file from your knowledge base?')) return;
    setDeletingId(id);
    try { await knowledgeBaseApi.deleteFile(id); onDelete(id); }
    catch (err: any) { alert(err.message); }
    finally { setDeletingId(null); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} selected file(s)?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    // Fire all deletes concurrently instead of one-by-one
    const results = await Promise.allSettled(
      ids.map((id) => knowledgeBaseApi.deleteFile(id)),
    );
    // Remove from UI only the ones that successfully deleted
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') onDelete(ids[i]);
    });
    setSelected(new Set());
    setBulkDeleting(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  /* Unique sources / types from data */
  const sources = useMemo(() => [...new Set(files.map((f) => f.source))], [files]);
  const types   = useMemo(() => [...new Set(files.map((f) => f.originalName.split('.').pop()?.toLowerCase() ?? ''))], [files]);

  return (
    <div className="space-y-4">
      {/* -- Toolbar -- */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <Input
          value={search}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search files…"
          size="sm"
          variant="bordered"
          startContent={<Search size={14} className="text-default-400" />}
          classNames={{ inputWrapper: 'border-default-300 dark:border-default-200', input: 'text-sm' }}
          className="flex-1"
          isClearable
          onClear={() => setSearch('')}
        />

        <div className="flex gap-2 flex-shrink-0">
          {/* Filter by source */}
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[filterSrc]}
            onSelectionChange={(k) => { setFilterSrc(k.currentKey ?? 'all'); setPage(1); }}
            className="w-36"
            placeholder="Source"
            classNames={{ trigger: 'border-default-300 dark:border-default-200 h-9' }}
            items={[{ key: 'all', label: 'All Sources' }, ...sources.map((s) => ({ key: s, label: SOURCE_LABEL[s] ?? s }))]}
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>

          {/* Filter by status */}
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[filterSt]}
            onSelectionChange={(k) => { setFilterSt(k.currentKey ?? 'all'); setPage(1); }}
            className="w-32"
            placeholder="Status"
            classNames={{ trigger: 'border-default-300 dark:border-default-200 h-9' }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="ready">Ready</SelectItem>
            <SelectItem key="processing">Indexing</SelectItem>
            <SelectItem key="error">Error</SelectItem>
          </Select>

          {/* Sort */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="bordered" endContent={<ChevronDown size={12} />}
                className="h-9 border-default-300 dark:border-default-200 text-xs font-semibold">
                {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                Sort
              </Button>
            </DropdownTrigger>
            <DropdownMenu onAction={(k) => toggleSort(k as SortKey)}>
              <DropdownItem key="date">By Date</DropdownItem>
              <DropdownItem key="name">By Name</DropdownItem>
              <DropdownItem key="size">By Size</DropdownItem>
              <DropdownItem key="status">By Status</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* View toggle */}
          <div className="flex border border-default-300 dark:border-default-200 rounded-lg overflow-hidden h-9">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 flex items-center transition-colors ${
                  viewMode === mode ? 'bg-primary text-white' : 'text-default-500 hover:bg-default-100'
                }`}
              >
                {mode === 'grid' ? <Grid3x3 size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Bulk action bar -- */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20"
          >
            <span className="text-xs font-bold text-primary">{selected.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" color="danger" variant="flat" isLoading={bulkDeleting}
              startContent={!bulkDeleting ? <Trash2 size={13} /> : undefined}
              onClick={handleBulkDelete} className="text-xs font-bold">
              Delete selected
            </Button>
            <Button size="sm" variant="flat" onClick={() => setSelected(new Set())} className="text-xs">
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Results info -- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-default-400">
            {sorted.length === files.length
              ? `${files.length} file${files.length !== 1 ? 's' : ''}`
              : `${sorted.length} of ${files.length} files`}
            {sorted.length > 0 && (
              <button onClick={toggleAll} className="ml-2 text-primary hover:underline">
                {selected.size === paginated.length ? 'Deselect all' : 'Select page'}
              </button>
            )}
          </p>
        </div>
        {totalPages > 1 && (
          <p className="text-xs text-default-400">Page {page} of {totalPages}</p>
        )}
      </div>

      {/* -- Loading -- */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl border border-divider overflow-hidden animate-pulse">
              <div className="h-24 bg-default-100" />
              <div className="p-3 space-y-1.5">
                <div className="h-3 w-3/4 bg-default-100 rounded" />
                <div className="h-2.5 w-1/2 bg-default-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -- Empty -- */}
      {!isLoading && sorted.length === 0 && (
        <Card className="border border-dashed border-default-300 shadow-none" classNames={{ base: 'bg-transparent' }}>
          <CardBody className="flex flex-col items-center py-16 gap-3">
            <Search size={28} className="text-default-300" />
            <p className="text-sm font-semibold text-default-400">
              {search ? `No files matching "${search}"` : 'No files yet'}
            </p>
            {search && (
              <Button size="sm" variant="flat" onClick={() => setSearch('')}>Clear search</Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* -- Grid view -- */}
      {!isLoading && sorted.length > 0 && viewMode === 'grid' && (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginated.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                selected={selected.has(file.id)}
                onSelect={() => toggleSelect(file.id)}
                onDelete={handleDelete}
                onChat={onChatWithFile}
                deletingId={deletingId}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* -- List view -- */}
      {!isLoading && sorted.length > 0 && viewMode === 'list' && (
        <div className="border border-divider rounded-2xl overflow-hidden bg-content1">
          {/* List header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-default-50 dark:bg-default-100/5 border-b border-divider text-[11px] font-bold text-default-500 uppercase tracking-wider">
            <button className="text-left flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('name')}>
              Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button className="hover:text-foreground" onClick={() => toggleSort('size')}>Size</button>
            <span>Status</span>
            <button className="hover:text-foreground" onClick={() => toggleSort('date')}>Added</button>
            <span />
          </div>
          <AnimatePresence mode="popLayout">
            <div className="p-2 space-y-0.5">
              {paginated.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  selected={selected.has(file.id)}
                  onSelect={() => toggleSelect(file.id)}
                  onDelete={handleDelete}
                  onChat={onChatWithFile}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {/* -- Pagination -- */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            size="sm"
            color="primary"
            variant="flat"
            showControls
          />
        </div>
      )}
    </div>
  );
}
