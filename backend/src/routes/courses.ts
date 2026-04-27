import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { generateCourse } from '../services/ai';

export const coursesRouter = Router();

coursesRouter.use(requireAuth);
coursesRouter.use(requireRole('SALES', 'COURSE_MANAGER', 'ADMIN'));

const trainerSelect = { id: true, name: true, email: true };

// GET /api/courses/trainers — list users with TRAINER role (CM-07)
coursesRouter.get('/trainers', async (_req: AuthRequest, res, next) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: 'TRAINER' },
      select: trainerSelect,
      orderBy: { name: 'asc' },
    });
    res.json(trainers);
  } catch (err) {
    next(err);
  }
});

// GET /api/courses — list all courses; SALES sees only own; CM/ADMIN see all (CM-03)
// Query: ?status=GENERATED,REQUIRES_REVISION
coursesRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const statusFilter = statusParam ? statusParam.split(',') : undefined;

    const where: Record<string, unknown> =
      req.userRole === 'SALES'
        ? { request: { salesRepId: req.userId } }
        : {};

    if (statusFilter?.length) {
      (where as Record<string, unknown>).status = { in: statusFilter };
    }

    const courses = await prisma.generatedCourse.findMany({
      where,
      include: {
        request: { select: { id: true, companyName: true, salesRepId: true } },
        trainer: { select: trainerSelect },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/generate/:requestId
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

    const analysedDocs = request.sopDocuments.filter((d) => d.analysis !== null);
    if (analysedDocs.length === 0) {
      return res.status(400).json({ message: 'Analyse SOPs before generating a course' });
    }

    const mergedAnalysis = analysedDocs.reduce<{
      keyResponsibilities: string[];
      communicationNeeds: string[];
      industryTerminology: string[];
      skillsGaps: string[];
      trainingFocus: string[];
      recommendedCEFRLevel: string;
      rationale: string;
    }>(
      (acc, doc) => {
        const a = doc.analysis as Record<string, unknown>;
        const merge = (key: string) =>
          [...(acc[key as keyof typeof acc] as string[]), ...((a[key] as string[]) ?? [])];
        return {
          keyResponsibilities: merge('keyResponsibilities'),
          communicationNeeds: merge('communicationNeeds'),
          industryTerminology: merge('industryTerminology'),
          skillsGaps: merge('skillsGaps'),
          trainingFocus: merge('trainingFocus'),
          recommendedCEFRLevel: (a.recommendedCEFRLevel as string) ?? acc.recommendedCEFRLevel,
          rationale: [acc.rationale, a.rationale as string | undefined].filter(Boolean).join(' '),
        };
      },
      {
        keyResponsibilities: [],
        communicationNeeds: [],
        industryTerminology: [],
        skillsGaps: [],
        trainingFocus: [],
        recommendedCEFRLevel: request.targetLevel,
        rationale: '',
      }
    );

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
      sopAnalysis: mergedAnalysis,
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

// GET /api/courses/request/:requestId
coursesRouter.get('/request/:requestId', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({ where: { id: req.params.requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const courses = await prisma.generatedCourse.findMany({
      where: { requestId: req.params.requestId },
      include: { trainer: { select: trainerSelect } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

const updateStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REQUIRES_REVISION']),
  revisionNote: z.string().min(1).optional(),
});

// PATCH /api/courses/:id/status — CM-05, CM-06
coursesRouter.patch('/:id/status', requireRole('COURSE_MANAGER', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, revisionNote } = updateStatusSchema.parse(req.body);

    if (status === 'REQUIRES_REVISION' && !revisionNote) {
      return res.status(400).json({ message: 'revisionNote is required when requesting revision' });
    }

    const course = await prisma.generatedCourse.findUnique({
      where: { id: req.params.id },
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.generatedCourse.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(status === 'REQUIRES_REVISION' ? { revisionNote } : { revisionNote: null }),
        },
        include: { trainer: { select: trainerSelect } },
      });

      if (status === 'APPROVED') {
        await tx.clientRequest.update({
          where: { id: course.requestId },
          data: { status: 'COMPLETED' },
        });
      }

      return c;
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const assignTrainerSchema = z.object({
  trainerId: z.string().min(1),
});

// PATCH /api/courses/:id/assign-trainer — CM-07
coursesRouter.patch('/:id/assign-trainer', requireRole('COURSE_MANAGER', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { trainerId } = assignTrainerSchema.parse(req.body);

    const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer || trainer.role !== 'TRAINER') {
      return res.status(400).json({ message: 'User is not a trainer' });
    }

    const course = await prisma.generatedCourse.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const updated = await prisma.generatedCourse.update({
      where: { id: req.params.id },
      data: { trainerId },
      include: { trainer: { select: trainerSelect } },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id
coursesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.generatedCourse.findUnique({
      where: { id: req.params.id },
      include: {
        request: { select: { salesRepId: true, companyName: true } },
        trainer: { select: trainerSelect },
      },
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
