import {
  Controller, Get, Post, Body, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe, Param
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Req() req: any, @Query('subjectId') subjectId?: string) {
    return this.analyticsService.getSummary(req.user.id, subjectId);
  }

  @Get('top-questions')
  async getTopQuestions(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.analyticsService.getTopQuestions(req.user.id, limit, subjectId);
  }

  @Get('topics')
  async getTopics(@Req() req: any, @Query('subjectId') subjectId?: string) {
    return this.analyticsService.getTopicDistribution(req.user.id, subjectId);
  }

  @Get('subject/:id')
  async getSubjectStats(@Req() req: any, @Param('id') id: string) {
    return this.analyticsService.getSubjectAnalytics(req.user.id, id);
  }

  @Get('subject/:id/students')
  async getSubjectStudents(@Req() req: any, @Param('id') id: string) {
    return this.analyticsService.getSubjectStudents(req.user.id, id);
  }

  @Post('activity')
  async logActivity(
    @Req() req: any,
    @Body() body: {
      type: string;
      subjectId?: string;
      metadata?: any;
    },
  ) {
    // Note: This endpoint is used by students too. 
    // If the token is a student token, req.user.id is the student.
    return this.analyticsService.logActivity(
      req.user.id,
      body.type,
      body.subjectId,
      body.metadata,
    );
  }

  @Get('recent-queries')
  async getRecentQueries(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.analyticsService.getRecentQueries(req.user.id, limit, subjectId);
  }

  @Post('log')
  async logQuery(
    @Req() req: any,
    @Body() body: {
      question: string;
      answer: string;
      fileId?: string;
      askedBy?: 'teacher' | 'student';
      responseMs?: number;
      chunkCount?: number;
      studentId?: string;
      subjectId?: string;
      topic?: string;
    },
  ) {
    return this.analyticsService.logQuery(
      req.user.id,
      body.question,
      body.answer,
      body.fileId,
      body.askedBy ?? 'teacher',
      body.responseMs,
      body.chunkCount,
      body.studentId,
      body.subjectId,
      body.topic,
    );
  }
}
