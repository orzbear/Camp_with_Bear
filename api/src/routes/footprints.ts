import { Router } from 'express';
import { z } from 'zod';
import { Footprint } from '../models/Footprint.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

const createFootprintSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'endDate must be greater than or equal to startDate',
  path: ['endDate'],
});

const updateFootprintSchema = z.object({
  title: z.string().trim().min(1).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }
  return true;
}, {
  message: 'endDate must be greater than or equal to startDate',
  path: ['endDate'],
});

const footprintIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid footprint ID'),
});

// POST /footprints
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createFootprintSchema.parse(req.body);
    const footprint = new Footprint({
      title: data.title,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      notes: data.notes || '',
      rating: data.rating,
      tags: data.tags || [],
      userId: req.user.userId,
    });
    await footprint.save();

    return res.status(201).json(footprint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create footprint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /footprints
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const footprints = await Footprint.find({ userId: req.user.userId })
      .sort({ startDate: -1 });
    return res.status(200).json(footprints);
  } catch (error) {
    console.error('List footprints error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /footprints/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = footprintIdSchema.parse({ id: req.params.id });
    const footprint = await Footprint.findOne({ _id: id, userId: req.user.userId });

    if (!footprint) {
      return res.status(404).json({ error: 'Footprint not found' });
    }

    return res.status(200).json(footprint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid footprint ID', details: error.errors });
    }
    console.error('Get footprint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /footprints/:id
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = footprintIdSchema.parse({ id: req.params.id });
    const footprint = await Footprint.findOne({ _id: id, userId: req.user.userId });

    if (!footprint) {
      return res.status(404).json({ error: 'Footprint not found' });
    }

    const data = updateFootprintSchema.parse(req.body);
    
    // Build update object with only provided fields
    const updateData: {
      title?: string;
      location?: { lat: number; lon: number };
      startDate?: Date;
      endDate?: Date;
      notes?: string;
      rating?: number;
      tags?: string[];
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // If updating dates, need to validate against existing dates
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : footprint.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : footprint.endDate;
      if (endDate < startDate) {
        return res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
      }
    }

    Object.assign(footprint, updateData);
    await footprint.save();

    return res.status(200).json(footprint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update footprint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /footprints/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = footprintIdSchema.parse({ id: req.params.id });
    const footprint = await Footprint.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!footprint) {
      return res.status(404).json({ error: 'Footprint not found' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid footprint ID', details: error.errors });
    }
    console.error('Delete footprint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
