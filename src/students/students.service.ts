import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private firebase: FirebaseService,
  ) {}

  async register(dto: any) {
    const existing = await this.prisma.student.findUnique({
      where: { email: dto.email }
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const student = await this.prisma.student.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      }
    });

    return this.generateToken(student);
  }

  async login(dto: any) {
    const student = await this.prisma.student.findUnique({
      where: { email: dto.email }
    });
    if (!student) throw new UnauthorizedException('Invalid credentials');
    if (!student.password) throw new UnauthorizedException('Please login with Google');

    const valid = await bcrypt.compare(dto.password, student.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(student);
  }

  async googleAuth(dto: { firebaseIdToken: string }) {
    let decodedToken;
    try {
      decodedToken = await this.firebase.verifyIdToken(dto.firebaseIdToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }

    const { uid, email, name, picture } = decodedToken;
    if (!email) throw new UnauthorizedException('Google account must have an email');

    const student = await this.prisma.student.upsert({
      where: { email },
      update: { firebaseUid: uid, avatarUrl: picture, name: name || email.split('@')[0] },
      create: { 
        email, 
        firebaseUid: uid, 
        name: name || email.split('@')[0],
        avatarUrl: picture
      }
    });

    return this.generateToken(student);
  }

  async getMyClasses(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        subject: {
          include: {
            teacher: { select: { name: true, email: true } },
            _count: { select: { files: true } }
          }
        }
      }
    });
  }

  async joinClass(studentId: string, classCode: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { classCode: classCode.trim().toUpperCase() }
    });
    if (!subject) throw new NotFoundException('Invalid class code. Please check with your teacher.');

    // Check if mapping exists
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_subjectId: { studentId, subjectId: subject.id } }
    });
    if (existing) return { message: 'You have already joined this classroom.', subject };

    const enrollment = await this.prisma.enrollment.create({
      data: { studentId, subjectId: subject.id },
      include: { subject: true }
    });

    return { message: 'Joined successfully!', subject: enrollment.subject };
  }

  async previewClass(classCode: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { classCode: classCode.trim().toUpperCase() },
      include: {
        teacher: { select: { name: true, avatarUrl: true } },
        _count: { select: { files: true, enrollments: true } }
      }
    });

    if (!subject) throw new NotFoundException('Invalid class code');
    return subject;
  }

  async getClassDetails(studentId: string, subjectId: string) {
    // 1. Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_subjectId: { studentId, subjectId } },
      include: {
        subject: {
          include: {
            teacher: { select: { id: true, name: true, email: true, avatarUrl: true } },
            files: {
              where: { status: 'ready' },
              select: {
                id: true,
                name: true,
                originalName: true,
                displayName: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
                storagePath: true,
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      throw new UnauthorizedException('You are not enrolled in this class');
    }

    return {
      ...enrollment.subject,
      files: enrollment.subject.files.map((file) => ({
        ...file,
        sizeBytes: Number(file.sizeBytes),
      })),
    };
  }

  async getFileStream(studentId: string, fileId: string) {
    const file = await this.prisma.knowledgeFile.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundException('File not found');

    // Verify enrollment if it belongs to a subject
    if (file.subjectId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_subjectId: { studentId, subjectId: file.subjectId } }
      });
      if (!enrollment) throw new UnauthorizedException('You are not enrolled in the subject this file belongs to');
    } else {
      // If it's a general file in teacher's KB, maybe students can't access it unless it's in a subject?
      // For now, let's assume students only access subject-linked files.
      throw new UnauthorizedException('Access denied to private knowledge base files');
    }

    return {
      path: file.storagePath,
      mimeType: file.mimeType,
      originalName: file.originalName,
    };
  }

  // ─── Notes Operations ───────────────────────────────────────────────────────

  async getNotes(studentId: string, subjectId: string) {
    return this.prisma.note.findMany({
      where: { studentId, subjectId },
      orderBy: { createdAt: 'desc' },
      include: { file: { select: { name: true, displayName: true } } }
    });
  }

  async createNote(studentId: string, subjectId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        studentId,
        subjectId,
        content: dto.content,
        fileId: dto.fileId || null,
        pageNumber: dto.pageNumber || null,
        selectionText: dto.selectionText || null,
        selectionCoords: dto.selectionCoords ? (dto.selectionCoords as any) : undefined,
      }
    });
  }

  async updateNote(studentId: string, noteId: string, dto: UpdateNoteDto) {
    // Verify ownership
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      throw new UnauthorizedException('Note not found or access denied');
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { content: dto.content }
    });
  }

  async deleteNote(studentId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      throw new UnauthorizedException('Note not found or access denied');
    }

    return this.prisma.note.delete({
      where: { id: noteId }
    });
  }

  // ─── Chat History ────────────────────────────────────────────────────────────

  async getChatSessions(studentId: string, subjectId: string) {
    return this.prisma.chatSession.findMany({
      where: { studentId, subjectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });
  }

  async createChatSession(studentId: string, subjectId: string, title?: string) {
    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_subjectId: { studentId, subjectId } },
    });
    if (!enrollment) throw new UnauthorizedException('Not enrolled in this class');

    return this.prisma.chatSession.create({
      data: { studentId, subjectId, title: title || null },
    });
  }

  async getChatMessages(studentId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== studentId) throw new UnauthorizedException('Access denied');

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async appendChatMessage(studentId: string, sessionId: string, dto: { role: string; content: string; sources?: any[] }) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== studentId) throw new UnauthorizedException('Access denied');

    const message = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: dto.role,
        content: dto.content,
        sources: dto.sources ? (dto.sources as any) : undefined,
      },
    });

    // Auto-set title from first user message
    if (!session.title && dto.role === 'user') {
      const title = dto.content.length > 60 ? dto.content.slice(0, 57) + '…' : dto.content;
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await this.prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    }

    return message;
  }

  async deleteChatSession(studentId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== studentId) throw new UnauthorizedException('Access denied');
    await this.prisma.chatSession.delete({ where: { id: sessionId } });
    return { message: 'Session deleted' };
  }

  private generateToken(student: any) {
    const payload = { sub: student.id, email: student.email, role: 'student' };
    return {
      accessToken: this.jwt.sign(payload),
      user: { 
        id: student.id, 
        email: student.email, 
        name: student.name, 
        role: 'student', 
        avatarUrl: student.avatarUrl 
      },
    };
  }
}
