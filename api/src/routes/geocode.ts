import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const geocodeQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
});

// GET /geocode?q=<search text>
router.get('/', async (req, res) => {
  try {
    const { q } = geocodeQuerySchema.parse(req.query);

    // Call Nominatim API
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', q);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('limit', '5');
    nominatimUrl.searchParams.set('addressdetails', '1');

    const nominatimResponse = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'Campmate/0.1 (contact: dev@campmate.app)',
      },
    });

    if (!nominatimResponse.ok) {
      const errorBody = await nominatimResponse.text();
      console.error('Nominatim API error:', nominatimResponse.status, errorBody);
      return res.status(502).json({ error: 'Geocoding service unavailable' });
    }

    const nominatimData = await nominatimResponse.json() as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;

    // Transform to simplified format
    const results = nominatimData
      .filter((item) => item.lat && item.lon)
      .map((item) => ({
        name: item.display_name || 'Unknown location',
        lat: parseFloat(item.lat!),
        lon: parseFloat(item.lon!),
      }));

    console.log(`Geocode request: "${q}" -> ${results.length} results`);

    return res.status(200).json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameter', details: error.errors });
    }
    console.error('Geocode error:', error);
    return res.status(502).json({ error: 'Geocoding service error' });
  }
});

export default router;
