import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { teacherId_name: { teacherId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Subject already exists');

    return this.prisma.subject.create({
      data: {
        name: dto.name,
        teacherId,
        classCode: this.generateClassCode(),
        metadata: dto.metadata,
      },
      include: { _count: { select: { files: true } } },
    });
  }

  private generateClassCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async findAll(teacherId: string) {
    return this.prisma.subject.findMany({
      where: { teacherId },
      include: { 
        _count: { 
          select: { files: true, enrollments: true } 
        } 
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(teacherId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ 
      where: { id, teacherId } 
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(teacherId: string, id: string, name: string) {
    await this.findOne(teacherId, id);
    return this.prisma.subject.update({
      where: { id },
      data: { name },
    });
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    return this.prisma.subject.delete({ where: { id } });
  }
}
