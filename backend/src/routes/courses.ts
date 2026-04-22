import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { generateCourse } from '../services/ai';

export const coursesRouter = Router();

coursesRouter.use(requireAuth);
coursesRouter.use(requireRole('SALES', 'COURSE_MANAGER', 'ADMIN'));

coursesRouter.post('/generate/:requestId', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({
      where: { id: req.params.requestId },
      include: { sopDocuments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const latestAnalysis = request.sopDocuments
      .filter((d) => d.analysis)
      .map((d) => d.analysis)
      .at(-1) as Record<string, unknown> | null;

    const courseData = await generateCourse({
      companyName: request.companyName,
      industry: request.companyIndustry,
      currentLevel: request.currentLevel,
      targetLevel: request.targetLevel,
      participantCount: request.participantCount,
      departments: request.departments,
      goals: request.goals,
      painPoints: request.painPoints,
      totalHours: request.totalHours,
      lessonsPerModule: request.lessonsPerModule,
      deliveryMethod: request.deliveryMethod,
      sopAnalysis: latestAnalysis ?? null,
    });

    const course = await prisma.$transaction(async (tx) => {
      const created = await tx.generatedCourse.create({
        data: {
          requestId: request.id,
          title: courseData.title,
          description: courseData.description,
          cefrLevel: request.targetLevel,
          totalHours: request.totalHours,
          modules: courseData.modules,
        },
      });
      await tx.clientRequest.update({
        where: { id: request.id },
        data: { status: 'IN_PROGRESS' },
      });
      return created;
    });

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

coursesRouter.get('/request/:requestId', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({ where: { id: req.params.requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const courses = await prisma.generatedCourse.findMany({
      where: { requestId: req.params.requestId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

coursesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.generatedCourse.findUnique({
      where: { id: req.params.id },
      include: { request: { select: { salesRepId: true } } },
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.userRole === 'SALES' && course.request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
});
