'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, CardBody, Skeleton, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Plus, Trash2, BookOpen, Layers, ChevronRight, AlertCircle, Loader2, Copy, Check, Users, Edit3 } from 'lucide-react';
import { subjectsApi, Subject } from '../../lib/subjects';
import { analyticsApi } from '../../lib/analyticsApi';
import { COLORS } from '../../constants/colors';
import { Mail, Clock, Calendar } from 'lucide-react';

export default function SubjectsManager() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New States for Students
  const [viewStudentsId, setViewStudentsId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Edit State
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchStudents = async (id: string) => {
    try {
      setStudentsLoading(true);
      const data = await analyticsApi.getSubjectStudents(id);
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleViewStudents = (id: string) => {
    setViewStudentsId(id);
    fetchStudents(id);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          className="font-black bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          startContent={<Plus size={18} />}
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
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                          style={{ background: `linear-gradient(135deg, ${COLORS.primary[600]}, ${COLORS.primary[400]})` }}>
                          <BookOpen size={20} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{s.name}</h3>
                            <Button 
                              isIconOnly 
                              variant="light" 
                              size="sm" 
                              className="w-6 h-6 min-w-0 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setEditId(s.id); setEditName(s.name); }}
                            >
                              <Edit3 size={12} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classroom Identifier</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Active</span>
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

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Layers size={13} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Materials</span>
                        </div>
                        <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">
                          {s._count?.files ?? 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users size={13} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Students</span>
                        </div>
                        <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">
                          {s._count?.enrollments ?? 0}
                        </p>
                      </div>
                    </div>
                    
                    {/* Class Code Section */}
                    {s.classCode && (
                      <div className="mt-4 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/50 flex items-center justify-between group/code">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Quick Access Code</p>
                          <p className="text-base font-black text-blue-700 dark:text-blue-400 tracking-[0.2em]">{s.classCode}</p>
                        </div>
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="solid" 
                          className="h-8 w-8 min-w-8 bg-white dark:bg-blue-600 shadow-sm border border-blue-100 dark:border-blue-700"
                          onClick={() => copyToClipboard(s.classCode!, s.id)}
                        >
                          {copiedId === s.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-blue-600 dark:text-white" />}
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="light"
                        size="sm"
                        className="text-[11px] font-black text-slate-500 hover:text-violet-600 transition-colors uppercase tracking-widest px-0 min-w-0"
                        onPress={() => handleViewStudents(s.id)}
                        startContent={<Users size={14} />}
                      >
                        Students
                      </Button>
                      <Button
                        variant="flat"
                        size="sm"
                        className="bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest h-8"
                        onPress={() => router.push(`/dashboard/files?subjectId=${s.id}`)}
                        endContent={<ChevronRight size={14} />}
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

      {/* View Students Modal */}
      <Modal size="2xl" isOpen={!!viewStudentsId} onClose={() => setViewStudentsId(null)} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Users size={20} className="text-violet-600" /> Subject Students
            </h3>
            <p className="text-xs font-medium text-slate-500 italic">View everyone enrolled in this classroom</p>
          </ModalHeader>
          <ModalBody className="pb-8">
            {studentsLoading ? (
              <div className="space-y-3 py-10">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 scale-x-[-1]">
                  <Users size={32} />
                </div>
                <p className="text-sm font-bold text-slate-400">No students have joined yet.</p>
                <p className="text-xs text-slate-400 mt-1 italic">Share your Class Code to get them started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_120px_100px] px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Student</span>
                  <span>Joined Date</span>
                  <span className="text-right">Time Spent</span>
                </div>
                {students.map((enrollment: any) => (
                  <div key={enrollment.id} className="grid grid-cols-[1fr_120px_100px] px-4 py-3 items-center rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{enrollment.student.name || 'Anonymous Student'}</p>
                      <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <Mail size={10} /> {enrollment.student.email}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-violet-600 flex items-center justify-end gap-1">
                        <Clock size={12} />
                        {Math.floor(enrollment.totalTimeSpent / 60)}m {enrollment.totalTimeSpent % 60}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
