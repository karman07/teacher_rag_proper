'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button, Input, Tooltip, Card, CardBody, Modal, ModalContent,
  ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Chip, Skeleton, Pagination, Select, SelectItem
} from '@heroui/react';
import {
  Search, Grid3x3, List, Trash2, MessageCircle, Pencil,
  Tag, FileText, BookOpen, FileSpreadsheet, Presentation,
  CheckCircle2, Loader2, RefreshCw, AlertCircle, X,
  FolderOpen, SortAsc, SortDesc, ChevronDown, BookOpen as SubjectIcon, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import UploadDropzone from '../../components/dashboard/UploadDropzone';
import SourceConnectors from '../../components/dashboard/SourceConnectors';
import { knowledgeBaseApi, KnowledgeFile, formatBytes } from '../../lib/knowledgeBase';
import { subjectsApi, Subject } from '../../lib/subjects';
import { COLORS } from '../../constants/colors';

/* --- Constants from COLORS ----------------------------------------------- */
const C = {
  blue:   COLORS.primary[600],
  violet: COLORS.accent.violet,
  border: COLORS.dark.border,
};

/* --- File type icons (no custom colors, only primary) --------------------- */
const FILE_ICON: Record<string, React.ElementType> = {
  pdf: FileText, docx: BookOpen, doc: BookOpen,
  pptx: Presentation, xlsx: FileSpreadsheet, csv: FileSpreadsheet,
  txt: FileText, md: FileText,
};
const getIcon = (name: string): React.ElementType =>
  FILE_ICON[name.split('.').pop()?.toLowerCase() ?? ''] ?? FileText;

const getExt = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

/* --- Status --------------------------------------------------------------- */
type StatusCfg = { label: string; icon: React.ElementType; spin?: boolean };
const STATUS_CFG: Record<string, StatusCfg> = {
  ready:      { label: 'Ready',     icon: CheckCircle2 },
  processing: { label: 'Indexing',  icon: Loader2, spin: true },
  uploading:  { label: 'Uploading', icon: RefreshCw, spin: true },
  error:      { label: 'Error',     icon: AlertCircle },
};

const SOURCE_LABEL: Record<string, string> = {
  upload: 'Direct', google_drive: 'Drive', dropbox: 'Dropbox',
  notion: 'Notion', onedrive: 'OneDrive',
};

const PAGE_SIZE = 16;

/* --- Edit modal ----------------------------------------------------------- */
function EditModal({ file, subjects, onSave, onClose }: {
  file: KnowledgeFile;
  subjects: Subject[];
  onSave: (id: string, displayName: string, tags: string[], subjectId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(file.displayName ?? file.originalName);
  const [subjectId,   setSubjectId]   = useState<string>(file.subjectId ?? 'all');
  const [tagInput,    setTagInput]    = useState('');
  const [tags,        setTags]        = useState<string[]>(file.tags ?? []);
  const [saving,      setSaving]      = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (t && !tags.includes(t) && tags.length < 10) { setTags([...tags, t]); setTagInput(''); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = async () => {
    setSaving(true);
    try { 
      await onSave(
        file.id, 
        displayName.trim() || file.originalName, 
        tags, 
        subjectId === 'all' ? null : subjectId
      ); 
      onClose(); 
    }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <ModalContent>
      <ModalHeader className="text-sm font-bold">Edit File Details</ModalHeader>
      <ModalBody className="py-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-default-500 mb-1.5 uppercase tracking-wider">
            Display Name
          </label>
          <Input
            value={displayName}
            onValueChange={setDisplayName}
            size="sm"
            variant="bordered"
            placeholder="Enter a readable name…"
            classNames={{ inputWrapper: 'border-divider' }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-default-500 mb-1.5 uppercase tracking-wider">
            Assigned Subject
          </label>
          <Select
            selectedKeys={[subjectId]}
            onSelectionChange={(k) => setSubjectId(k.currentKey as string)}
            size="sm"
            variant="bordered"
            classNames={{ trigger: 'border-divider' }}
          >
            <SelectItem key="all" textValue="Global (None)">Global (None)</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.id} textValue={s.name}>{s.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-default-500 mb-1.5 uppercase tracking-wider">
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onValueChange={setTagInput}
              size="sm"
              variant="bordered"
              placeholder="Add tag…"
              classNames={{ inputWrapper: 'border-divider' }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            />
            <Button size="sm" variant="bordered" onClick={addTag}
              className="border-divider font-semibold text-xs flex-shrink-0 h-9">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold
                  px-2.5 py-0.5 rounded-full border border-divider text-default-600 dark:text-default-400">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-danger ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button size="sm" variant="bordered" className="border-divider font-semibold" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" color="primary" isLoading={saving} className="font-bold" onClick={handleSave}>
          Save Changes
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}

/* --- File row ------------------------------------------------------------- */
function FileRow({ file, isSelected, onToggle, onEdit, onDelete, onChat, deletingId }: {
  file: KnowledgeFile;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: (f: KnowledgeFile) => void;
  onDelete: (id: string) => void;
  onChat: (f: KnowledgeFile) => void;
  deletingId: string | null;
}) {
  const Icon = getIcon(file.originalName);
  const st   = STATUS_CFG[file.status] ?? STATUS_CFG.ready;
  const StIcon = st.icon;
  const displayedName = file.displayName ?? file.originalName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onToggle}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 cursor-pointer ${
        isSelected ? 'bg-primary/5 border-primary/20' : 'border-transparent hover:border-divider hover:bg-default-50 dark:hover:bg-default-100/5'
      }`}
    >
      {/* Checkbox */}
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
          isSelected ? 'bg-primary border-primary' : 'border-divider hover:border-primary/50'
        }`}
      >
        {isSelected && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white -rotate-45 -mt-0.5" />}
      </div>
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-divider bg-default-50 dark:bg-default-100/5">
        <Icon size={16} className="text-default-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{displayedName}</p>
          {file.displayName && file.displayName !== file.originalName && (
            <span className="text-[10px] text-default-400 truncate hidden sm:inline">({file.originalName})</span>
          )}
        </div>
        {/* Tags */}
        {file.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {file.tags.map((t) => (
              <span key={t} className="text-[9px] font-bold px-1.5 py-px rounded border border-divider text-default-500 uppercase tracking-wider">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-default-400 border border-divider px-1.5 py-px rounded">
          {getExt(file.originalName)}
        </span>
        <span className="text-xs text-default-400 tabular-nums w-14 text-right">{formatBytes(file.sizeBytes)}</span>
        <div className="flex items-center gap-1 text-[10px] font-semibold border border-divider rounded-full px-2 py-0.5">
          <StIcon size={10} className={`${st.spin ? 'animate-spin' : ''} ${
            file.status === 'ready' ? 'text-emerald-500' : file.status === 'error' ? 'text-rose-500' : 'text-amber-500'
          }`} />
          {st.label}
        </div>
        <span className="text-[11px] text-default-400 w-20 text-right">
          {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Tooltip content="Edit name & tags" size="sm">
          <Button isIconOnly size="sm" variant="light" className="h-7 w-7 min-w-7 text-default-500"
            onClick={() => onEdit(file)}>
            <Pencil size={12} />
          </Button>
        </Tooltip>
        <Tooltip content="Chat with file" size="sm">
          <Button isIconOnly size="sm" variant="light" className="h-7 w-7 min-w-7 text-default-500"
            onClick={() => onChat(file)}>
            <MessageCircle size={12} />
          </Button>
        </Tooltip>
        <Tooltip content="Delete" size="sm">
          <Button isIconOnly size="sm" variant="light" color="danger" className="h-7 w-7 min-w-7"
            isLoading={deletingId === file.id}
            onClick={() => onDelete(file.id)}>
            {deletingId !== file.id && <Trash2 size={11} />}
          </Button>
        </Tooltip>
      </div>
    </motion.div>
  );
}

/* --- Main page ------------------------------------------------------------ */
export default function FilesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [files,      setFiles]      = useState<KnowledgeFile[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterSt,   setFilterSt]   = useState('all');
  const [sortKey,    setSortKey]    = useState<'date' | 'name' | 'size'>('date');
  const [sortDir,    setSortDir]    = useState<'asc' | 'desc'>('desc');
  const [page,       setPage]       = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editFile,   setEditFile]   = useState<KnowledgeFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const searchParams = useSearchParams();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  // Chat state (router to /dashboard/chat?fileId=x)
  const openChat = (file: KnowledgeFile) => {
    router.push(`/dashboard/chat?fileId=${file.id}&fileName=${encodeURIComponent(file.displayName ?? file.originalName)}`);
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // intentionally omit router — its reference is unstable

  useEffect(() => {
    const sid = searchParams.get('subjectId');
    if (sid) setSelectedSubjectId(sid);
  }, [searchParams]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const [f, sb] = await Promise.all([
        knowledgeBaseApi.listFiles(undefined, selectedSubjectId !== 'all' ? selectedSubjectId : undefined),
        subjectsApi.list(),
      ]);
      setFiles(f);
      setSubjects(sb);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedSubjectId]);

  useEffect(() => { if (user) fetchFiles(); }, [user, fetchFiles]);

  /* Sort & filter */
  const sorted = [...files].filter((f) => {
    const q = search.toLowerCase();
    const name = (f.displayName ?? f.originalName).toLowerCase();
    const matchSearch = !q || name.includes(q) || f.tags?.some((t) => t.includes(q));
    const matchSt = filterSt === 'all' || f.status === filterSt;
    return matchSearch && matchSt;
  }).sort((a, b) => {
    let d = 0;
    if (sortKey === 'name') d = (a.displayName ?? a.originalName).localeCompare(b.displayName ?? b.originalName);
    if (sortKey === 'date') d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortKey === 'size') d = a.sizeBytes - b.sizeBytes;
    return sortDir === 'asc' ? d : -d;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this file from your knowledge base?')) return;
    setDeletingId(id);
    try { await knowledgeBaseApi.deleteFile(id); setFiles((p) => p.filter((f) => f.id !== id)); }
    catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };

  const handleSaveMeta = async (id: string, displayName: string, tags: string[], subjectId: string | null) => {
    const updated = await knowledgeBaseApi.updateFileMeta(id, { displayName, tags, subjectId });
    setFiles((p) => p.map((f) => f.id === id ? { ...f, ...updated } : f));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} files permanently?`)) return;
    setLoading(true);
    try {
      await knowledgeBaseApi.batchDelete(Array.from(selectedIds));
      setFiles((p) => p.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleBulkMove = async (sid: string) => {
    setLoading(true);
    try {
      const targetSid = sid === 'all' ? null : sid;
      await Promise.all(Array.from(selectedIds).map(id => 
        knowledgeBaseApi.updateFileMeta(id, { subjectId: targetSid })
      ));
      fetchFiles();
      setSelectedIds(new Set());
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const toggleSort = (key: 'name' | 'date' | 'size') => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(f => f.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* -- Header -- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-divider">
              <FolderOpen size={17} className="text-default-500" />
            </div>
            <div className="flex items-center gap-2 bg-content1 border border-divider rounded-xl px-3 py-1.5 shadow-sm">
              <SubjectIcon size={14} className="text-primary" />
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs font-black outline-none cursor-pointer pr-4 appearance-none"
                style={{ color: 'var(--text)' }}
              >
                <option value="all">Global Knowledge Base</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="text-default-400 pointer-events-none -ml-3" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">File Management</h1>
              <p className="text-xs text-default-400">{files.length} document{files.length !== 1 ? 's' : ''} in your knowledge base</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="bordered" onClick={fetchFiles} isLoading={loading}
              startContent={!loading ? <RefreshCw size={13} /> : undefined}
              className="border-divider font-semibold text-xs h-9">
              Refresh
            </Button>
            <Button size="sm" color="primary" onClick={onUploadOpen}
              startContent={<Plus size={15} />}
              className="font-bold text-xs h-9 shadow-lg shadow-primary/20">
              New File
            </Button>
          </div>
        </div>

        {/* -- Toolbar -- */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={search}
            onValueChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name or tag…"
            size="sm"
            variant="bordered"
            startContent={<Search size={14} className="text-default-400" />}
            classNames={{ inputWrapper: 'border-divider', input: 'text-sm' }}
            className="flex-1"
            isClearable
            onClear={() => setSearch('')}
          />
          <div className="flex gap-2 flex-shrink-0">
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[filterSt]}
              onSelectionChange={(k) => { setFilterSt(k.currentKey ?? 'all'); setPage(1); }}
              className="w-32"
              classNames={{ trigger: 'border-divider h-9' }}
              items={[
                { key: 'all', label: 'All Status' },
                { key: 'ready', label: 'Ready' },
                { key: 'processing', label: 'Indexing' },
                { key: 'error', label: 'Error' },
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            {/* Sort buttons */}
            {(['name', 'date', 'size'] as const).map((k) => (
              <Button key={k} size="sm" variant="bordered"
                className={`border-divider text-xs font-semibold h-9 capitalize ${sortKey === k ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                onClick={() => toggleSort(k)}
                endContent={sortKey === k ? (sortDir === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />) : undefined}>
                {k}
              </Button>
            ))}
          </div>
        </div>

        {/* -- Table -- */}
        <Card classNames={{ base: 'border border-divider shadow-none bg-content1' }}>
          {/* Header row */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4
            px-4 py-2.5 border-b border-divider text-[10px] font-black uppercase tracking-wider text-default-400">
            <div 
              onClick={toggleAll}
              className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${
                selectedIds.size === paginated.length && paginated.length > 0 ? 'bg-primary border-primary' : 'border-divider'
              }`}
            >
              {selectedIds.size === paginated.length && paginated.length > 0 && <div className="w-2 h-1 border-b-2 border-l-2 border-white -rotate-45" />}
            </div>
            <span>File</span>
            <span className="hidden sm:block text-center">Type</span>
            <span className="hidden sm:block text-right pr-4">Size</span>
            <span className="hidden sm:block text-center">Status</span>
            <span className="hidden sm:block text-right pr-4">Added</span>
            <span />
          </div>

          <CardBody className="p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <FolderOpen size={28} className="text-default-200" />
                <p className="text-sm font-semibold text-default-400">
                  {search ? `No files matching "${search}"` : 'No files yet'}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                  {paginated.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      isSelected={selectedIds.has(file.id)}
                      onToggle={() => toggleOne(file.id)}
                      onEdit={setEditFile}
                      onDelete={handleDelete}
                      onChat={openChat}
                      deletingId={deletingId}
                    />
                  ))}
              </AnimatePresence>
            )}
          </CardBody>
        </Card>

        {/* -- Pagination -- */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination total={totalPages} page={page} onChange={setPage}
              size="sm" color="primary" variant="flat" showControls />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background 
              px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md"
          >
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.size} SELECTED</span>
            <div className="h-4 w-px bg-white/20" />
            
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                variant="light" 
                className="text-background font-bold text-xs hover:bg-white/10"
                onClick={handleBulkDelete}
                startContent={<Trash2 size={13} />}
              >
                Delete
              </Button>

              <div className="relative group">
                <Button 
                  size="sm" 
                  variant="light" 
                  className="text-background font-bold text-xs hover:bg-white/10"
                  startContent={<FolderOpen size={13} />}
                  endContent={<ChevronDown size={11} />}
                >
                  Move To
                </Button>
                <div className="absolute bottom-full left-0 mb-0.5 w-48 bg-content1 text-foreground border border-divider rounded-xl shadow-xl overflow-hidden hidden group-hover:block translate-y-2 group-hover:translate-y-0 transition-all after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-2">
                  <div className="p-1 space-y-0.5">
                    <button 
                      onClick={() => handleBulkMove('all')}
                      className="w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-primary/10 hover:text-primary rounded-lg"
                    >
                      Global Knowledge
                    </button>
                    {subjects.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => handleBulkMove(s.id)}
                        className="w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-primary/10 hover:text-primary rounded-lg truncate"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button isIconOnly size="sm" variant="light" className="text-white/40 hover:text-white" onClick={() => setSelectedIds(new Set())}>
              <X size={14} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <Modal 
        isOpen={isUploadOpen} 
        onClose={onUploadClose} 
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-content1 border border-divider shadow-2xl rounded-3xl",
          header: "border-b border-divider",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-black">Add New Files</h2>
            <p className="text-xs font-medium text-default-500">
              Upload documents or import from cloud sources to your 
              <span className="text-primary font-bold"> {selectedSubjectId === 'all' ? 'Global Knowledge' : subjects.find(s => s.id === selectedSubjectId)?.name}</span>.
            </p>
          </ModalHeader>
          <ModalBody className="py-6 space-y-8">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-default-400 mb-3">Direct Upload</h3>
              <UploadDropzone 
                onUploadComplete={fetchFiles} 
                subjectId={selectedSubjectId === 'all' ? undefined : selectedSubjectId}
              />
            </section>
            <div className="h-px bg-divider w-full" />
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-default-400 mb-3">Cloud Sources</h3>
              <SourceConnectors 
                onImportComplete={fetchFiles} 
                subjectId={selectedSubjectId === 'all' ? undefined : selectedSubjectId}
              />
            </section>
          </ModalBody>
          <ModalFooter className="border-t border-divider py-4">
            <Button size="sm" variant="flat" className="font-bold" onClick={onUploadClose}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* -- Edit modal -- */}
      {editFile && (
        <Modal isOpen={!!editFile} onClose={() => setEditFile(null)} size="md">
          <EditModal 
            file={editFile} 
            subjects={subjects} 
            onSave={handleSaveMeta} 
            onClose={() => setEditFile(null)} 
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}
