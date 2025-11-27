import { Router } from 'express';
import { z } from 'zod';
import { Campsite } from '../models/Campsite.js';

const router = Router();

const querySchema = z.object({
  query: z.string().optional(),
  type: z.enum(['tent', 'caravan', 'both']).optional(),
});

const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid campsite ID'),
});

// GET /public/campsites
router.get('/', async (req, res) => {
  try {
    const { query, type } = querySchema.parse(req.query);

    // Build filter
    const filter: Record<string, unknown> = {};
    const orConditions: unknown[] = [];

    // Text search filter
    if (query) {
      orConditions.push(
        { name: { $regex: query, $options: 'i' } },
        { parkName: { $regex: query, $options: 'i' } }
      );
    }

    // Site type filter
    if (type) {
      if (type === 'both') {
        filter.siteType = 'both';
      } else {
        // Show sites that are either the requested type OR 'both'
        orConditions.push(
          { siteType: type },
          { siteType: 'both' }
        );
      }
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    const campsites = await Campsite.find(filter).select(
      'name slug parkName region location siteType facilities tags'
    );

    return res.status(200).json(campsites);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    console.error('List campsites error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /public/campsites/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = idSchema.parse({ id: req.params.id });

    const campsite = await Campsite.findById(id);

    if (!campsite) {
      return res.status(404).json({ error: 'Campsite not found' });
    }

    return res.status(200).json(campsite);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid campsite ID', details: error.errors });
    }
    console.error('Get campsite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

