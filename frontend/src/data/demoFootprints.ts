import type { Footprint } from '../api/client';

/**
 * Demo footprints for guest users (read-only).
 * These are realistic NSW/Sydney-area camping locations.
 * 
 * IMPORTANT: This data is for demonstration only.
 * Guest users never write to the database.
 */
export const demoFootprints: Footprint[] = [
  {
    _id: 'demo-1',
    userId: 'demo-user',
    title: 'Royal National Park Camping',
    location: {
      lat: -34.1083,
      lon: 151.0575,
    },
    startDate: '2024-03-15T00:00:00Z',
    endDate: '2024-03-17T00:00:00Z',
    notes: 'Beautiful coastal camping spot. Woke up to the sound of waves. Great for families with easy access to beaches.',
    rating: 5,
    tags: ['coastal', 'family-friendly', 'beach'],
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
  },
  {
    _id: 'demo-2',
    userId: 'demo-user',
    title: 'Blue Mountains Adventure',
    location: {
      lat: -33.7128,
      lon: 150.3115,
    },
    startDate: '2024-04-10T00:00:00Z',
    endDate: '2024-04-13T00:00:00Z',
    notes: 'Stunning mountain views and excellent hiking trails. Cold nights but worth it for the sunrise views.',
    rating: 4,
    tags: ['mountains', 'hiking', 'scenic'],
    createdAt: '2024-04-15T10:00:00Z',
    updatedAt: '2024-04-15T10:00:00Z',
  },
  {
    _id: 'demo-3',
    userId: 'demo-user',
    title: 'Ku-ring-gai Chase National Park',
    location: {
      lat: -33.6333,
      lon: 151.2167,
    },
    startDate: '2024-05-01T00:00:00Z',
    endDate: '2024-05-03T00:00:00Z',
    notes: 'Peaceful bush camping with great bird watching. Close to Sydney but feels remote.',
    rating: 4,
    tags: ['bush', 'wildlife', 'peaceful'],
    createdAt: '2024-05-05T10:00:00Z',
    updatedAt: '2024-05-05T10:00:00Z',
  },
  {
    _id: 'demo-4',
    userId: 'demo-user',
    title: 'Wollondilly River Camping',
    location: {
      lat: -34.2833,
      lon: 150.4167,
    },
    startDate: '2024-06-20T00:00:00Z',
    endDate: '2024-06-22T00:00:00Z',
    notes: 'Riverside camping with fishing opportunities. Perfect for a weekend getaway.',
    rating: 3,
    tags: ['river', 'fishing', 'weekend'],
    createdAt: '2024-06-25T10:00:00Z',
    updatedAt: '2024-06-25T10:00:00Z',
  },
  {
    _id: 'demo-5',
    userId: 'demo-user',
    title: 'Bouddi National Park',
    location: {
      lat: -33.5167,
      lon: 151.4000,
    },
    startDate: '2024-07-05T00:00:00Z',
    endDate: '2024-07-07T00:00:00Z',
    notes: 'Coastal walk and camping combo. Amazing sunsets over the ocean. Bring warm gear for the nights.',
    rating: 5,
    tags: ['coastal', 'walking', 'sunset'],
    createdAt: '2024-07-10T10:00:00Z',
    updatedAt: '2024-07-10T10:00:00Z',
  },
  {
    _id: 'demo-6',
    userId: 'demo-user',
    title: 'Yengo National Park',
    location: {
      lat: -33.1833,
      lon: 150.7833,
    },
    startDate: '2024-08-12T00:00:00Z',
    endDate: '2024-08-15T00:00:00Z',
    notes: 'Remote camping experience. Saw kangaroos and wallabies. Great for stargazing away from city lights.',
    rating: 4,
    tags: ['remote', 'wildlife', 'stargazing'],
    createdAt: '2024-08-18T10:00:00Z',
    updatedAt: '2024-08-18T10:00:00Z',
  },
];
