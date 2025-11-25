import { Router } from 'express';
import { z } from 'zod';
import { Trip } from '../models/Trip.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

const createTripSchema = z.object({
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    name: z.string(),
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupSize: z.number().int().min(1),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  activities: z.array(z.string()).default([]),
});

const tripIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid trip ID'),
});

// POST /trips
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createTripSchema.parse(req.body);
    const trip = new Trip({
      ...data,
      userId: req.user.userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
    await trip.save();

    return res.status(201).json({ id: trip._id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create trip error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /trips
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trips = await Trip.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json(trips);
  } catch (error) {
    console.error('List trips error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /trips/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = tripIdSchema.parse({ id: req.params.id });
    const trip = await Trip.findOne({ _id: id, userId: req.user.userId });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json(trip);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid trip ID', details: error.errors });
    }
    console.error('Get trip error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /trips/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = tripIdSchema.parse({ id: req.params.id });
    const trip = await Trip.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid trip ID', details: error.errors });
    }
    console.error('Delete trip error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

