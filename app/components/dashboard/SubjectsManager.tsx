'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, CardBody, Skeleton, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Plus, Trash2, BookOpen, Layers, ChevronRight, AlertCircle, Loader2, Copy, Check, Users, Edit3 } from 'lucide-react';
import { subjectsApi, Subject } from '../../lib/subjects';
import { analyticsApi } from '../../lib/analyticsApi';
import { COLORS } from '../../constants/colors';
import { Mail, Clock, Calendar, Link as LinkIcon, Share2, MessageSquare } from 'lucide-react';

export default function SubjectsManager() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  


  // Edit State
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');



  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyInviteLink = (code: string, id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_STUDENT_APP_URL || 'http://localhost:3002';
    const link = `${baseUrl}/join/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.list();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setActionLoading(true);
      const newSubject = await subjectsApi.create(newName);
      setSubjects([...subjects, newSubject]);
      setNewName('');
      setCreating(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    try {
      setActionLoading(true);
      await subjectsApi.update(editId, editName);
      setEditId(null);
      await fetchSubjects();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await subjectsApi.delete(deleteId);
      setSubjects(subjects.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            My Subjects
          </h1>
          <p className="text-sm font-medium opacity-60 mt-1">
            Organise your knowledge files into specialized subject collections.
          </p>
        </div>
        <Button 
          onPress={() => setCreating(true)}
          className="font-black bg-white text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-50 transition-all"
          startContent={<Plus size={18} className="text-blue-600" />}
        >
          New Subject
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none py-12">
          <CardBody className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BookOpen size={30} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-black opacity-80">No Subjects Yet</h3>
            <p className="text-sm opacity-60 max-w-xs mt-2">
              Create your first subject to start building specialized AI knowledge bases.
            </p>
            <Button 
              onPress={() => setCreating(true)}
              variant="flat" 
              className="mt-6 font-bold"
            >
              Get Started
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {subjects.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-xl transition-all border border-slate-200/60 dark:border-slate-800/60 group">
                  <CardBody className="p-5">
                    {/* Card Content Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 bg-blue-50 border border-blue-100">
                          <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{s.name}</h3>
                            <Button 
                              isIconOnly 
                              variant="light" 
                              size="sm" 
                              className="w-6 h-6 min-w-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setEditId(s.id); setEditName(s.name); }}
                            >
                              <Edit3 size={12} />
                            </Button>
                          </div>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classroom Identifier</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Active</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        isIconOnly 
                        variant="light" 
                        color="danger" 
                        size="sm" 
                        radius="full"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(s.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1 group/metric hover:bg-blue-50/30 transition-all">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Layers size={13} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Materials</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 tabular-nums">
                          {s._count?.files ?? 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1 group/metric hover:bg-blue-50/30 transition-all">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users size={13} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Students</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 tabular-nums">
                          {s._count?.enrollments ?? 0}
                        </p>
                      </div>
                    </div>
                    
                    {/* Class Code Section */}
                    {s.classCode && (
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between group/code shadow-sm dark:shadow-none">
                        <div className="flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Invite Students</p>
                          <div className="flex items-center gap-2">
                             <p className="text-base font-black text-slate-900 dark:text-white tracking-[0.2em]">{s.classCode}</p>
                             <div className="h-4 w-px bg-slate-200 mx-1" />
                             <p className="text-[10px] font-bold text-blue-600 uppercase">Magic Link</p>
                          </div>
                        </div>
                         <div className="flex gap-2">
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="flat" 
                            className="bg-white border border-blue-100 hover:bg-blue-50 shadow-sm"
                            onClick={() => copyInviteLink(s.classCode!, s.id)}
                            title="Copy Invite Link"
                          >
                            {copiedLinkId === s.id ? <Check size={14} className="text-blue-600" /> : <Share2 size={14} className="text-blue-600" />}
                          </Button>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="solid" 
                            className="h-8 w-8 min-w-8 bg-blue-600 text-white shadow-lg shadow-blue-200"
                            onClick={() => copyToClipboard(s.classCode!, s.id)}
                            title="Copy Code"
                          >
                            {copiedId === s.id ? <Check size={14} className="text-white" /> : <Copy size={14} className="text-white" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="light"
                        size="sm"
                        className="text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest px-0 min-w-0"
                        onPress={() => router.push(`/dashboard/students?subject=${encodeURIComponent(s.name)}`)}
                        startContent={<Users size={14} />}
                      >
                        Manage Students
                      </Button>
                       <Button
                        variant="flat"
                        size="sm"
                        className="bg-slate-50 hover:bg-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest h-8 border border-slate-200"
                        onPress={() => router.push(`/dashboard/files?subjectId=${s.id}`)}
                        endContent={<ChevronRight size={14} className="text-slate-400" />}
                      >
                        Manage Class
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={creating} onClose={() => setCreating(false)} hideCloseButton>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-black">Create New Subject</h2>
            <p className="text-xs font-medium text-slate-500">Give your specialized knowledge base a name.</p>
          </ModalHeader>
          <ModalBody>
            <Input
              autoFocus
              label="Subject Name"
              placeholder="e.g. Advanced Mathematics"
              variant="bordered"
              value={newName}
              onValueChange={setNewName}
              classNames={{
                label: "text-xs font-black uppercase tracking-wider",
                input: "font-semibold"
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setCreating(false)} className="font-bold">Cancel</Button>
            <Button 
              color="primary" 
              className="font-black bg-blue-600"
              onPress={handleCreate}
              isLoading={actionLoading}
            >
              Create Subject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editId} onClose={() => setEditId(null)}>
        <ModalContent>
          <ModalHeader className="text-xl font-black">Rename Subject</ModalHeader>
          <ModalBody>
            <Input
              label="Subject Name"
              placeholder="e.g. Advanced Calculus"
              variant="bordered"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="font-bold"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setEditId(null)} className="font-bold">Cancel</Button>
            <Button 
              color="primary" 
              className="font-black bg-blue-600"
              onPress={handleUpdate}
              isLoading={actionLoading}
            >
              Update Name
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 text-danger">
            <AlertCircle size={20} />
            <span className="text-xl font-black">Delete Subject?</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm font-medium">
              This will permanently delete the subject and remove its relationship with all knowledge files. 
              <span className="block mt-2 text-danger font-bold text-xs uppercase tracking-tight">Existing file chunks in ChromaDB will persist but won't be indexed under this subject.</span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteId(null)} className="font-bold">Keep it</Button>
            <Button 
              color="danger" 
              className="font-black"
              onPress={handleDelete}
              isLoading={actionLoading}
            >
              Delete Permanently
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


    </div>
  );
}
