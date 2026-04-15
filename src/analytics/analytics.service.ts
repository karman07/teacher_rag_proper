// analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Log a query ────────────────────────────────────────────────────────────
  async logQuery(
    teacherId: string,
    question: string,
    answer: string,
    fileId?: string | null,
    askedBy: 'teacher' | 'student' = 'teacher',
    responseMs?: number,
    chunkCount?: number,
    studentId?: string | null,
    subjectId?: string | null,
    topic?: string | null,
  ) {
    return this.prisma.queryLog.create({
      data: {
        teacherId,
        question,
        answer,
        fileId: fileId ?? null,
        askedBy,
        responseMs,
        chunkCount,
        studentId: studentId ?? null,
        subjectId: subjectId ?? null,
        topic: topic ?? null,
      },
    });
  }

  // ─── Summary stats ──────────────────────────────────────────────────────────
  async getSummary(teacherId: string, subjectId?: string) {
    const where = { teacherId, ...(subjectId ? { subjectId } : {}) };
    const [
      totalQueries,
      teacherQueries,
      studentQueries,
      avgResponseMs,
      last7Days,
      topFiles,
      engagement,
      pageViews,
      totalTimeData
    ] = await Promise.all([
      this.prisma.queryLog.count({ where }),
      this.prisma.queryLog.count({ where: { ...where, askedBy: 'teacher' } }),
      this.prisma.queryLog.count({ where: { ...where, askedBy: 'student' } }),
      this.prisma.queryLog.aggregate({
        where: { ...where, responseMs: { not: null } },
        _avg: { responseMs: true },
      }),
      this.getLast7DaysActivity(teacherId, subjectId),
      this.getTopQueriedFiles(teacherId, 5, subjectId),
      this.getStudentEngagement(teacherId, subjectId),
      this.prisma.activityLog.count({ 
        where: { 
          subject: { teacherId }, 
          type: 'page_view',
          ...(subjectId ? { subjectId } : {})
        } 
      }),
      this.prisma.enrollment.aggregate({
        where: { 
          subject: { teacherId },
          ...(subjectId ? { subjectId } : {})
        },
        _sum: { totalTimeSpent: true }
      })
    ]);

    return {
      totalQueries,
      teacherQueries,
      studentQueries,
      avgResponseMs: Math.round(avgResponseMs._avg.responseMs ?? 0),
      last7Days,
      topFiles,
      engagement: {
        ...engagement,
        pageViews,
        totalTimeSpent: totalTimeData._sum.totalTimeSpent ?? 0
      },
    };
  }

  // ─── Top questions ──────────────────────────────────────────────────────────
  async getTopQuestions(teacherId: string, limit = 10, subjectId?: string) {
    const logs = await this.prisma.queryLog.findMany({
      where: { teacherId, ...(subjectId ? { subjectId } : {}) },
      select: { question: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Count occurrences
    const counts = new Map<string, { count: number; lastSeen: Date }>();
    for (const log of logs) {
      const key = log.question.toLowerCase().trim().slice(0, 120);
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
        if (log.createdAt > existing.lastSeen) existing.lastSeen = log.createdAt;
      } else {
        counts.set(key, { count: 1, lastSeen: log.createdAt });
      }
    }

    return [...counts.entries()]
      .map(([question, data]) => ({ question, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ─── Daily activity (last 7 days) ───────────────────────────────────────────
  private async getLast7DaysActivity(teacherId: string, subjectId?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await this.prisma.queryLog.findMany({
      where: { 
        teacherId, 
        createdAt: { gte: sevenDaysAgo },
        ...(subjectId ? { subjectId } : {})
      },
      select: { askedBy: true, createdAt: true },
    });

    // Bucket by day in memory
    const days: { day: string; queries: number; teacherQ: number; studentQ: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = logs.filter(
        (l) => l.createdAt >= date && l.createdAt < nextDate,
      );

      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        queries: dayLogs.length,
        teacherQ: dayLogs.filter((l) => l.askedBy === 'teacher').length,
        studentQ: dayLogs.filter((l) => l.askedBy === 'student').length,
      });
    }

    return days;
  }

  // ─── Top queried files ───────────────────────────────────────────────────────
  private async getTopQueriedFiles(teacherId: string, limit = 5, subjectId?: string) {
    const grouped = await this.prisma.queryLog.groupBy({
      by: ['fileId'],
      where: { 
        teacherId, 
        fileId: { not: null },
        ...(subjectId ? { subjectId } : {})
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Enrich with file names
    const fileIds = grouped.map((g) => g.fileId).filter(Boolean) as string[];
    const files = await this.prisma.knowledgeFile.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, originalName: true, displayName: true },
    });

    const fileMap = new Map(files.map((f) => [f.id, f]));

    return grouped.map((g) => ({
      fileId:   g.fileId,
      count:    g._count.id,
      fileName: fileMap.get(g.fileId!)?.displayName || fileMap.get(g.fileId!)?.originalName || 'Unknown',
    }));
  }

  // ─── Popular topics ──────────────────────────────────────────────────────────
  async getTopicDistribution(teacherId: string, subjectId?: string) {
    const grouped = await this.prisma.queryLog.groupBy({
      by: ['topic'],
      where: { 
        teacherId, 
        topic: { not: null },
        ...(subjectId ? { subjectId } : {})
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    return grouped.map(g => ({ topic: g.topic, count: g._count.id }));
  }

  // ─── Student Engagement ──────────────────────────────────────────────────────
  async getStudentEngagement(teacherId: string, subjectId?: string) {
    const [totalStudents, activeStudents] = await Promise.all([
      subjectId 
        ? this.prisma.enrollment.count({ where: { subjectId } })
        : this.prisma.enrollment.count({ where: { subject: { teacherId } } }),
      
      this.prisma.queryLog.groupBy({
        by: ['studentId'],
        where: { 
          teacherId, 
          askedBy: 'student', 
          studentId: { not: null },
          ...(subjectId ? { subjectId } : {})
        },
        _count: { id: true }
      })
    ]);

    return {
      joined: totalStudents,
      active: activeStudents.length, // students who asked at least 1 question
      queriesPerStudent: activeStudents.length > 0 
        ? activeStudents.reduce((acc, curr) => acc + curr._count.id, 0) / activeStudents.length
        : 0
    };
  }

  // ─── Subject specific stats ──────────────────────────────────────────────────
  async getSubjectAnalytics(teacherId: string, subjectId: string) {
    const [topics, engagement, topQuestions] = await Promise.all([
      this.getTopicDistribution(teacherId, subjectId),
      this.getStudentEngagement(teacherId, subjectId),
      this.getTopQuestionsForSubject(teacherId, subjectId)
    ]);

    return { topics, engagement, topQuestions };
  }

  private async getTopQuestionsForSubject(teacherId: string, subjectId: string, limit = 5) {
    const logs = await this.prisma.queryLog.findMany({
      where: { teacherId, subjectId },
      select: { question: true },
      take: 200,
    });
    
    const counts = new Map<string, number>();
    for (const log of logs) {
      const q = log.question.trim().toLowerCase();
      counts.set(q, (counts.get(q) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([question, count]) => ({ question, count }));
  }

  // ─── Log student activity (views/time) ──────────────────────────────────────
  async logActivity(studentId: string, type: string, subjectId?: string, metadata?: any) {
    if (type === 'time_spent' && subjectId && metadata?.duration) {
      // Update the total time spent in Enrollment
      await this.prisma.enrollment.update({
        where: { studentId_subjectId: { studentId, subjectId } },
        data: { 
          totalTimeSpent: { increment: metadata.duration },
          lastActiveAt: new Date()
        }
      }).catch(() => null); // ignore if enrollment not found
    }

    return this.prisma.activityLog.create({
      data: {
        studentId,
        type,
        subjectId: subjectId ?? null,
        metadata: metadata ?? {},
      }
    });
  }

  // ─── Get students joined for a subject ──────────────────────────────────────
  async getSubjectStudents(teacherId: string, subjectId: string) {
    return this.prisma.enrollment.findMany({
      where: { subjectId, subject: { teacherId } },
      include: {
        student: { select: { id: true, name: true, email: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ─── Query log list (for the teacher to review) ─────────────────────────────
  async getRecentQueries(teacherId: string, limit = 20, subjectId?: string) {
    return this.prisma.queryLog.findMany({
      where: { teacherId, ...(subjectId ? { subjectId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        question: true,
        askedBy: true,
        responseMs: true,
        chunkCount: true,
        createdAt: true,
        topic: true,
        subject: { select: { name: true } },
        file: { select: { originalName: true, displayName: true } },
        student: { select: { name: true } },
      },
    });
  }
}
