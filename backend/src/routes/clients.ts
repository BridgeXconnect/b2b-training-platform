import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { analyzeSOPDocument } from '../services/ai';
import { extractTextFromFile } from '../services/document';

export const clientsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const cefrLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

const createRequestSchema = z.object({
  companyName: z.string().min(1),
  companyIndustry: z.string().min(1),
  companySize: z.coerce.number().int().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  contactPosition: z.string().min(1),
  participantCount: z.coerce.number().int().min(1),
  currentLevel: cefrLevel,
  targetLevel: cefrLevel,
  departments: z.array(z.string().min(1)).min(1),
  goals: z.array(z.string().min(1)).min(1),
  painPoints: z.array(z.string().min(1)).min(1),
  successCriteria: z.array(z.string().min(1)).min(1),
  totalHours: z.coerce.number().int().min(1),
  lessonsPerModule: z.coerce.number().int().min(1),
  deliveryMethod: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY']),
  lessonDuration: z.coerce.number().int().min(15),
  preferredTimes: z.array(z.string().min(1)).min(1),
});

clientsRouter.use(requireAuth);
clientsRouter.use(requireRole('SALES', 'COURSE_MANAGER', 'ADMIN'));

clientsRouter.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const where = req.userRole === 'SALES' ? { salesRepId: req.userId } : {};

    const [total, active, courses, participants] = await Promise.all([
      prisma.clientRequest.count({ where }),
      prisma.clientRequest.count({ where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.generatedCourse.count({ where: { request: where } }),
      prisma.clientRequest.aggregate({ where, _sum: { participantCount: true } }),
    ]);

    res.json({
      totalRequests: total,
      activeRequests: active,
      completedCourses: courses,
      totalParticipants: participants._sum.participantCount ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

clientsRouter.post('/requests', async (req: AuthRequest, res, next) => {
  try {
    const data = createRequestSchema.parse(req.body);
    const request = await prisma.clientRequest.create({
      data: { ...data, salesRepId: req.userId! },
      include: { sopDocuments: true, courses: true },
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

clientsRouter.get('/requests', async (req: AuthRequest, res, next) => {
  try {
    const where = req.userRole === 'SALES' ? { salesRepId: req.userId } : {};
    const requests = await prisma.clientRequest.findMany({
      where,
      include: { sopDocuments: true, courses: { select: { id: true, title: true, status: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

clientsRouter.get('/requests/:id', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({
      where: { id: req.params.id },
      include: { sopDocuments: true, courses: true },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
});

clientsRouter.post('/requests/:id/sop', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExts = ['.pdf', '.docx', '.txt'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
      return res.status(400).json({ message: 'Unsupported file type. Upload PDF, DOCX, or TXT.' });
    }

    const extractedText = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);

    const doc = await prisma.sOPDocument.create({
      data: {
        requestId: req.params.id,
        filename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        extractedText,
      },
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

clientsRouter.post('/requests/:id/analyze', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({
      where: { id: req.params.id },
      include: { sopDocuments: true },
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const docs = request.sopDocuments.filter((d) => d.extractedText);
    if (docs.length === 0) return res.status(400).json({ message: 'No SOP documents with extracted text found' });

    const SOP_CHAR_LIMIT = 15_000;
    const separator = '\n\n---\n\n';
    let combinedText = '';
    const includedDocs: typeof docs = [];
    for (const doc of docs) {
      const addition = (combinedText ? separator : '') + (doc.extractedText ?? '');
      if (combinedText.length + addition.length > SOP_CHAR_LIMIT) {
        console.warn(
          `[analyze] Request ${req.params.id}: doc ${doc.id} (${doc.filename}) excluded — would exceed ${SOP_CHAR_LIMIT} char limit`
        );
        break;
      }
      combinedText += addition;
      includedDocs.push(doc);
    }

    const analysis = await analyzeSOPDocument(combinedText, {
      companyName: request.companyName,
      industry: request.companyIndustry,
      currentLevel: request.currentLevel,
      targetLevel: request.targetLevel,
    });

    await Promise.all(
      includedDocs.map((doc) => prisma.sOPDocument.update({ where: { id: doc.id }, data: { analysis } }))
    );

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

clientsRouter.delete('/requests/:id/sop/:docId', async (req: AuthRequest, res, next) => {
  try {
    const request = await prisma.clientRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.userRole === 'SALES' && request.salesRepId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await prisma.sOPDocument.findUnique({ where: { id: req.params.docId } });
    if (!doc || doc.requestId !== req.params.id) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await prisma.sOPDocument.delete({ where: { id: req.params.docId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
