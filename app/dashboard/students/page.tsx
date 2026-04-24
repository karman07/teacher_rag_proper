'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, Button, Input, Skeleton, Avatar, Chip } from '@heroui/react';
import { 
  Users, Search, ChevronRight, Mail, Clock, 
  Calendar, MessageSquare, TrendingUp, Filter,
  ArrowUpRight, Target
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { analyticsApi } from '../../lib/analyticsApi';

function StudentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get('subject');

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(subjectFilter || '');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.student.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.joinedSubjects.some((sub: string) => sub.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Student Directory</h1>
            <p className="text-sm font-bold mt-3 text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Monitoring {students.length} active enrollments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name or email..."
              startContent={<Search size={18} className="text-slate-400" />}
              className="w-full md:w-80"
              variant="bordered"
              value={search}
              onValueChange={setSearch}
              classNames={{
                input: "font-semibold text-sm",
                inputWrapper: "rounded-2xl border-slate-200 bg-white shadow-sm h-12"
              }}
            />
            <Button isIconOnly variant="bordered" className="rounded-2xl h-12 w-12 border-slate-200 bg-white">
              <Filter size={18} className="text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-[2rem]" />)
          ) : filteredStudents.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-transparent shadow-none py-20">
               <CardBody className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-blue-50 flex items-center justify-center text-blue-200 mb-6">
                    <Users size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">No Students Found</h3>
                 <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs">
                   {search ? `No results for "${search}"` : "You don't have any students enrolled in your subjects yet."}
                 </p>
               </CardBody>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredStudents.map((s, i) => (
                <motion.div
                  key={s.student.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/dashboard/students/${s.student.id}`)}
                  className="group cursor-pointer"
                >
                  <Card className="border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-blue-600/30 transition-all rounded-[2rem] overflow-hidden">
                    <CardBody className="p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center">
                        <div className="p-6 flex items-center gap-6">
                          <Avatar 
                            name={s.student.name} 
                            src={s.student.avatarUrl}
                            className="w-16 h-16 rounded-[1.5rem] font-black text-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                          />
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                              {s.student.name || s.student.email?.split('@')[0] || 'Anonymous Student'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <Mail size={12} /> {s.student.email}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <Calendar size={12} /> Joined {new Date(s.firstJoinedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                               {s.joinedSubjects.map((sub: string) => (
                                 <Chip key={sub} size="sm" variant="flat" className="bg-slate-50 text-slate-600 font-bold text-[9px] h-5 uppercase tracking-widest px-2">
                                   {sub}
                                 </Chip>
                               ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 lg:bg-transparent lg:border-l border-slate-100 p-6 flex flex-wrap lg:flex-nowrap items-center gap-8 min-w-[400px]">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                              <MessageSquare size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Questions</span>
                            </div>
                            <p className="text-xl font-black text-slate-900 tabular-nums">{s.questionsCount}</p>
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                              <Clock size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Time Spent</span>
                            </div>
                            <p className="text-xl font-black text-slate-900 tabular-nums">
                              {Math.floor(s.totalTimeSpent / 60)}<span className="text-xs font-bold text-slate-400 ml-0.5 tracking-tighter">m</span>
                            </p>
                          </div>

                          <div className="hidden sm:flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                              <TrendingUp size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                              {s.lastActiveAt ? `Online ${new Date(s.lastActiveAt).toLocaleDateString()}` : 'No activity'}
                            </p>
                          </div>

                          <div className="ml-auto">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                               <ChevronRight size={20} />
                             </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <StudentsPageContent />
    </Suspense>
  );
}
