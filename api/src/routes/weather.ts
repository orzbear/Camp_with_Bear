import { Router } from 'express';
import { z } from 'zod';
import { OPENWEATHER_API_KEY } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

const weatherQuerySchema = z.object({
  lat: z.string().transform((val) => parseFloat(val)),
  lon: z.string().transform((val) => parseFloat(val)),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// GET /weather
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lat, lon, from, to } = weatherQuerySchema.parse(req.query);
    // from/to reserved for future filtering support
    void from;
    void to;

    // Validate lat/lon range
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // Call OpenWeather 5-day / 3-hour forecast API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    const weatherResponse = await fetch(url);

    if (!weatherResponse.ok) {
      const errorBody = await weatherResponse.text();
      console.error('Weather API error:', weatherResponse.status, errorBody);

      if (weatherResponse.status === 401 || weatherResponse.status === 403) {
        return res.status(502).json({ error: 'Weather service authentication failed' });
      }
      if (weatherResponse.status === 400) {
        return res.status(400).json({ error: 'Invalid weather request parameters' });
      }
      return res.status(502).json({ error: 'Weather service unavailable' });
    }

    const weatherData = await weatherResponse.json() as {
      city?: { name?: string; country?: string };
      list?: Array<{
        dt: number;
        main?: { temp?: number };
        weather?: Array<{ description?: string; icon?: string }>;
      }>;
    };

    // Normalize response into simplified structure
    const normalized = {
      location: {
        name: weatherData.city?.name ?? 'Unknown',
        country: weatherData.city?.country ?? 'Unknown',
      },
      forecasts: (weatherData.list ?? []).map((entry) => ({
        timestamp: entry.dt,
        temp: entry.main?.temp ?? null,
        description: entry.weather?.[0]?.description ?? '',
        icon: entry.weather?.[0]?.icon ?? '',
      })),
    };

    return res.status(200).json(normalized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    console.error('Weather error:', error);
    return res.status(502).json({ error: 'Weather service error' });
  }
});

export default router;

