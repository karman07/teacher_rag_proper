import { Controller, Post, Body, Get, UseGuards, Request, Param, Response, StreamableFile, NotFoundException, Patch, Delete } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student' })
  register(@Body() dto: any) {
    return this.studentsService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login as a student' })
  login(@Body() dto: any) {
    return this.studentsService.login(dto);
  }

  @Post('auth/google')
  @ApiOperation({ summary: 'Login as a student with Google' })
  googleAuth(@Body() dto: { firebaseIdToken: string }) {
    return this.studentsService.googleAuth(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  @ApiOperation({ summary: 'Join a classroom using a class code' })
  join(@Request() req: any, @Body('code') code: string) {
    return this.studentsService.joinClass(req.user.id, code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classes')
  @ApiOperation({ summary: 'Get all enrolled classes' })
  getClasses(@Request() req: any) {
    return this.studentsService.getMyClasses(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classes/:id')
  @ApiOperation({ summary: 'Get details of a specific class including files' })
  getClassDetails(@Request() req: any, @Param('id') id: string) {
    return this.studentsService.getClassDetails(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('files/:fileId')
  @ApiOperation({ summary: 'Get a file for viewing' })
  async getFile(@Request() req: any, @Param('fileId') fileId: string, @Response({ passthrough: true }) res: any) {
    const file = await this.studentsService.getFileStream(req.user.id, fileId);
    
    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('File not found on server');
    }

    const stream = fs.createReadStream(file.path);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
    });
    return new StreamableFile(stream);
  }

  @UseGuards(JwtAuthGuard)
  @Get('classes/:id/notes')
  @ApiOperation({ summary: 'Get all notes for a specific class' })
  getNotes(@Request() req: any, @Param('id') id: string) {
    return this.studentsService.getNotes(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('classes/:id/notes')
  @ApiOperation({ summary: 'Create a new note for a class' })
  createNote(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.studentsService.createNote(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update an existing note' })
  updateNote(@Request() req: any, @Param('noteId') noteId: string, @Body() dto: any) {
    return this.studentsService.updateNote(req.user.id, noteId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Delete a note' })
  deleteNote(@Request() req: any, @Param('noteId') noteId: string) {
    return this.studentsService.deleteNote(req.user.id, noteId);
  }
}
