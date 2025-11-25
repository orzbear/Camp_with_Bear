import { Router } from 'express';
import { z } from 'zod';
import { Trip } from '../models/Trip.js';
import { AuthRequest } from '../middleware/auth.js';
import { OPENWEATHER_API_KEY } from '../config/env.js';
import { classifyWeather, generateChecklist, type WeatherData } from '../services/checklist.js';

const router = Router();

const tripIdSchema = z.object({
  tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid trip ID'),
});

/**
 * Internal function to fetch weather data (reused from weather route logic)
 */
async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  
  const weatherResponse = await fetch(url);

  if (!weatherResponse.ok) {
    const errorBody = await weatherResponse.text();
    console.error('Weather API error:', weatherResponse.status, errorBody);
    throw new Error(`Weather service error: ${weatherResponse.status}`);
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
  return {
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
}

// GET /checklist/:tripId
router.get('/:tripId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tripId } = tripIdSchema.parse({ tripId: req.params.tripId });

    // Fetch trip from MongoDB
    const trip = await Trip.findOne({ _id: tripId, userId: req.user.userId });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Fetch weather data for the trip location
    let weatherData: WeatherData;
    try {
      weatherData = await fetchWeatherData(trip.location.lat, trip.location.lon);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      return res.status(502).json({ error: 'Failed to fetch weather data' });
    }

    // Classify weather conditions
    const weatherCategories = classifyWeather(weatherData);

    // Generate checklist
    const checklistItems = generateChecklist(
      {
        location: trip.location,
        startDate: trip.startDate,
        endDate: trip.endDate,
        groupSize: trip.groupSize,
        experience: trip.experience,
        activities: trip.activities,
      },
      weatherCategories
    );

    return res.status(200).json({
      items: checklistItems,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid trip ID', details: error.errors });
    }
    console.error('Checklist error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

