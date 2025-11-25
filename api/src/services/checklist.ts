/**
 * Checklist generation business logic
 * 
 * This module provides rule-based packing checklist generation
 * based on weather conditions, trip duration, group size, experience level, and activities.
 */

export type WeatherCategory = 'rain' | 'cold' | 'hot' | 'windy' | 'normal';

export interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  forecasts: Array<{
    timestamp: number;
    temp: number | null;
    description: string;
    icon: string;
  }>;
}

export interface ChecklistItem {
  name: string;
  qty: number;
  reason: string;
  recommended: boolean;
}

export interface TripData {
  location: { lat: number; lon: number; name: string };
  startDate: Date;
  endDate: Date;
  groupSize: number;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  activities: string[];
}

/**
 * Classify weather conditions from forecast data
 * Returns categories: rain, cold, hot, windy, or normal
 */
export function classifyWeather(weatherData: WeatherData): WeatherCategory[] {
  const categories: Set<WeatherCategory> = new Set();
  
  if (!weatherData.forecasts || weatherData.forecasts.length === 0) {
    return ['normal'];
  }

  // Analyze all forecasts
  let hasRain = false;
  let hasCold = false;
  let hasHot = false;
  let hasWindy = false;
  const temps: number[] = [];

  for (const forecast of weatherData.forecasts) {
    const desc = forecast.description.toLowerCase();
    const temp = forecast.temp;

    // Check for rain
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('storm') || desc.includes('shower')) {
      hasRain = true;
    }

    // Check for wind (icon codes often indicate wind)
    if (desc.includes('wind') || forecast.icon.includes('50')) {
      hasWindy = true;
    }

    // Collect temperatures
    if (temp !== null && temp !== undefined) {
      temps.push(temp);
    }
  }

  // Determine temperature categories
  if (temps.length > 0) {
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    // Cold: average below 10°C or min below 5°C
    if (avgTemp < 10 || minTemp < 5) {
      hasCold = true;
    }

    // Hot: average above 25°C or max above 30°C
    if (avgTemp > 25 || maxTemp > 30) {
      hasHot = true;
    }
  }

  // Build category set
  if (hasRain) categories.add('rain');
  if (hasCold) categories.add('cold');
  if (hasHot) categories.add('hot');
  if (hasWindy) categories.add('windy');
  
  // Default to normal if no specific conditions
  if (categories.size === 0) {
    categories.add('normal');
  }

  return Array.from(categories);
}

/**
 * Generate packing checklist based on trip data and weather categories
 */
export function generateChecklist(trip: TripData, weatherCategories: WeatherCategory[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const durationDays = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Base essentials (always included)
  items.push({
    name: 'Backpack',
    qty: 1,
    reason: 'Essential for carrying gear',
    recommended: true,
  });

  items.push({
    name: 'Water bottle',
    qty: trip.groupSize,
    reason: 'One per person for hydration',
    recommended: true,
  });

  items.push({
    name: 'First aid kit',
    qty: 1,
    reason: 'Essential safety item',
    recommended: true,
  });

  items.push({
    name: 'Map and compass',
    qty: 1,
    reason: 'Navigation essentials',
    recommended: trip.experience === 'beginner' || trip.experience === 'intermediate',
  });

  // Clothing based on weather
  if (weatherCategories.includes('cold')) {
    items.push({
      name: 'Warm jacket',
      qty: trip.groupSize,
      reason: 'Cold weather protection',
      recommended: true,
    });
    items.push({
      name: 'Thermal underwear',
      qty: trip.groupSize,
      reason: 'Cold weather base layer',
      recommended: true,
    });
    items.push({
      name: 'Warm hat',
      qty: trip.groupSize,
      reason: 'Heat retention in cold conditions',
      recommended: true,
    });
    items.push({
      name: 'Gloves',
      qty: trip.groupSize,
      reason: 'Cold weather protection',
      recommended: true,
    });
  }

  if (weatherCategories.includes('hot')) {
    items.push({
      name: 'Sun hat',
      qty: trip.groupSize,
      reason: 'Sun protection in hot weather',
      recommended: true,
    });
    items.push({
      name: 'Sunscreen',
      qty: Math.max(1, Math.ceil(trip.groupSize / 2)),
      reason: 'UV protection in hot weather',
      recommended: true,
    });
    items.push({
      name: 'Lightweight clothing',
      qty: durationDays * trip.groupSize,
      reason: 'Comfort in hot weather',
      recommended: true,
    });
  }

  if (weatherCategories.includes('rain')) {
    items.push({
      name: 'Rain jacket',
      qty: trip.groupSize,
      reason: 'Protection from rain',
      recommended: true,
    });
    items.push({
      name: 'Rain pants',
      qty: trip.groupSize,
      reason: 'Full rain protection',
      recommended: trip.experience !== 'beginner', // Optional for beginners
    });
    items.push({
      name: 'Waterproof bag cover',
      qty: 1,
      reason: 'Protect gear from rain',
      recommended: true,
    });
  }

  if (weatherCategories.includes('windy')) {
    items.push({
      name: 'Windbreaker',
      qty: trip.groupSize,
      reason: 'Wind protection',
      recommended: true,
    });
  }

  // Activity-specific items
  if (trip.activities.includes('hiking') || trip.activities.includes('camping')) {
    items.push({
      name: 'Hiking boots',
      qty: trip.groupSize,
      reason: 'Required for hiking activities',
      recommended: true,
    });
    items.push({
      name: 'Tent',
      qty: Math.ceil(trip.groupSize / 4), // Assume 4 people per tent
      reason: 'Required for camping',
      recommended: trip.activities.includes('camping'),
    });
    items.push({
      name: 'Sleeping bag',
      qty: trip.groupSize,
      reason: 'Required for camping',
      recommended: trip.activities.includes('camping'),
    });
    items.push({
      name: 'Sleeping pad',
      qty: trip.groupSize,
      reason: 'Comfort for camping',
      recommended: trip.activities.includes('camping'),
    });
  }

  if (trip.activities.includes('fishing')) {
    items.push({
      name: 'Fishing rod',
      qty: Math.min(trip.groupSize, 2), // Max 2 rods
      reason: 'Required for fishing',
      recommended: true,
    });
    items.push({
      name: 'Fishing tackle',
      qty: 1,
      reason: 'Required for fishing',
      recommended: true,
    });
  }

  if (trip.activities.includes('swimming')) {
    items.push({
      name: 'Swimsuit',
      qty: trip.groupSize,
      reason: 'Required for swimming',
      recommended: true,
    });
    items.push({
      name: 'Towel',
      qty: trip.groupSize,
      reason: 'After swimming',
      recommended: true,
    });
  }

  // Experience-based items
  if (trip.experience === 'beginner') {
    items.push({
      name: 'Emergency whistle',
      qty: trip.groupSize,
      reason: 'Safety for beginners',
      recommended: true,
    });
    items.push({
      name: 'Headlamp',
      qty: trip.groupSize,
      reason: 'Essential lighting for beginners',
      recommended: true,
    });
  }

  if (trip.experience === 'expert' || trip.experience === 'advanced') {
    items.push({
      name: 'Multi-tool',
      qty: Math.ceil(trip.groupSize / 2),
      reason: 'Advanced gear for experienced campers',
      recommended: true,
    });
  }

  // Duration-based items
  if (durationDays > 3) {
    items.push({
      name: 'Extra batteries',
      qty: Math.ceil(trip.groupSize / 2),
      reason: 'Extended trip duration',
      recommended: true,
    });
    items.push({
      name: 'Portable charger',
      qty: Math.ceil(trip.groupSize / 3),
      reason: 'Extended trip power needs',
      recommended: true,
    });
  }

  // Group size considerations
  if (trip.groupSize > 4) {
    items.push({
      name: 'Group cooking equipment',
      qty: 1,
      reason: 'Large group meal preparation',
      recommended: true,
    });
  }

  // Food and water
  items.push({
    name: 'Food supplies',
    qty: durationDays * trip.groupSize,
    reason: `Meals for ${durationDays} day(s) for ${trip.groupSize} person(s)`,
    recommended: true,
  });

  return items;
}

