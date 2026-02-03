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

    console.log('Fetching from Nominatim:', nominatimUrl.toString());

    // Retry logic: up to 3 attempts with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create AbortController for timeout (10 seconds per attempt)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const nominatimResponse = await fetch(nominatimUrl.toString(), {
          headers: {
            'User-Agent': 'Campmate-App-Dev-Cho-Han (contact: joe941230@gmail.com)',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!nominatimResponse.ok) {
          const errorBody = await nominatimResponse.text();
          console.error(`Nominatim API error (attempt ${attempt}/${maxRetries}):`, {
            status: nominatimResponse.status,
            statusText: nominatimResponse.statusText,
            errorBody: errorBody,
            url: nominatimUrl.toString(),
          });

          // If 403 (Forbidden) or 429 (Too Many Requests), don't retry
          if (nominatimResponse.status === 403 || nominatimResponse.status === 429) {
            return res.status(502).json({ 
              error: 'Geocoding service unavailable',
              details: `Nominatim returned ${nominatimResponse.status}: ${errorBody}`,
            });
          }

          // For other errors, retry if not last attempt
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          return res.status(502).json({ 
            error: 'Geocoding service unavailable',
            details: `After ${maxRetries} attempts: ${errorBody}`,
          });
        }

        // Success - break out of retry loop
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

        console.log(`Geocode request: "${q}" -> ${results.length} results (attempt ${attempt})`);

        return res.status(200).json(results);
      } catch (fetchError: unknown) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(`Geocode request timeout (attempt ${attempt}/${maxRetries}):`, q);
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`Retrying after timeout in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return res.status(504).json({ error: 'Geocoding request timeout' });
        }

        // For other errors, retry if not last attempt
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.error(`Geocode error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All retry attempts failed');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameter', details: error.errors });
    }
    console.error('Geocode error:', error);
    return res.status(502).json({ error: 'Geocoding service error' });
  }
});

export default router;
