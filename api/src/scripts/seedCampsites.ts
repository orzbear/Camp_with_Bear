import { Campsite } from '../models/Campsite.js';

const sampleCampsites = [
  // --- your existing 5 campsites first ---
  {
    name: 'Lane Cove River Tourist Park',
    slug: 'lane-cove-river-tourist-park',
    parkName: 'Lane Cove National Park',
    region: 'Sydney',
    location: { lat: -33.8106, lon: 151.1633 },
    siteType: 'both' as const,
    facilities: {
      hasHotWater: true,
      hasPower: true,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: false,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/lane-cove-river-tourist-park',
    description:
      'A popular campsite in Lane Cove National Park, just 10km from Sydney CBD. Family-friendly with powered and unpowered sites, hot showers, and easy access to riverside walking tracks.',
    tags: ['family-friendly', 'accessible', 'riverside'],
  },
  {
    name: 'The Basin Campground',
    slug: 'the-basin-campground',
    parkName: 'Ku-ring-gai Chase National Park',
    region: 'Sydney',
    location: { lat: -33.6231, lon: 151.2833 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: true,
      hasPower: false,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: true,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground',
    description:
      'Beachside tent-only campground accessible by ferry or walking track. Great for swimming, kayaking, and wildlife spotting, with basic facilities and designated campfire areas.',
    tags: ['beach', 'tent-only', 'scenic'],
  },
  {
    name: 'Bonnie Vale Campground',
    slug: 'bonnie-vale-campground',
    parkName: 'Royal National Park',
    region: 'Sydney',
    location: { lat: -34.1083, lon: 151.1083 },
    siteType: 'both' as const,
    facilities: {
      hasHotWater: true,
      hasPower: true,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: false,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/bonnie-vale-campground',
    description:
      'Well-equipped waterside campground in Royal National Park with powered and unpowered sites. Popular with families, with easy access to beaches, fishing spots, and walking tracks.',
    tags: ['family-friendly', 'beach', 'powered-sites'],
  },
  {
    name: 'Euroka Campground',
    slug: 'euroka-campground',
    parkName: 'Blue Mountains National Park',
    region: 'Sydney',
    location: { lat: -33.7167, lon: 150.5833 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: false,
      hasPower: false,
      hasToilets: true,
      hasShowers: false,
      allowsCampfire: true,
      allowsFishing: false,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground',
    description:
      'Bush-style campground surrounded by open grassy areas and gum trees. Tent-only, with basic facilities and easy access to walking tracks and lookouts.',
    tags: ['bush-camping', 'tent-only', 'wildlife'],
  },
  {
    name: 'Cockatoo Island Campground',
    slug: 'cockatoo-island-campground',
    parkName: 'Cockatoo Island',
    region: 'Sydney Harbour',
    location: { lat: -33.8467, lon: 151.1717 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: true,
      hasPower: false,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: false,
      allowsFishing: false,
    },
    bookingUrl: 'https://www.cockatooisland.gov.au/stay/camping',
    description:
      'Unique camping experience on an island in Sydney Harbour. Pre-pitched tents and bring-your-own sites available, with harbour views and modern amenities.',
    tags: ['harbour-views', 'heritage', 'tent-only'],
  },
  {
    name: 'North Era Campground',
    slug: 'north-era-campground',
    parkName: 'Royal National Park',
    region: 'South of Sydney',
    location: { lat: -34.1935, lon: 151.0461 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: false,
      hasPower: false,
      hasToilets: true,
      hasShowers: false,
      allowsCampfire: false,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/north-era-campground',
    description:
      'Remote walk-in tent campground on a grassy headland above the beach. Accessed via the Coast Track, ideal for experienced hikers seeking an overnight stop.',
    tags: ['hike-in', 'coastal', 'tent-only'],
  },
  {
    name: 'Uloola Falls Campground',
    slug: 'uloola-falls-campground',
    parkName: 'Royal National Park',
    region: 'South of Sydney',
    location: { lat: -34.107, lon: 151.047 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: false,
      hasPower: false,
      hasToilets: false,
      hasShowers: false,
      allowsCampfire: false,
      allowsFishing: false,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/uloola-falls-campground',
    description:
      'Small, remote walk-in campground near Uloola Falls. Very basic bush camping experience suitable for self-sufficient hikers.',
    tags: ['remote', 'bush-camping', 'hike-in'],
  },
  {
    name: 'Bouddi National Park – Putty Beach Campground',
    slug: 'putty-beach-campground',
    parkName: 'Bouddi National Park',
    region: 'Central Coast',
    location: { lat: -33.515, lon: 151.366 },
    siteType: 'both' as const,
    facilities: {
      hasHotWater: true,
      hasPower: false,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: false,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/putty-beach-campground',
    description:
      'Beachside campground on the Central Coast, popular with surfers and walkers. Easy access to coastal walking tracks and sheltered swimming spots.',
    tags: ['beach', 'coastal-walks', 'family-friendly'],
  },
  {
    name: 'Cattai Campground',
    slug: 'cattai-campground',
    parkName: 'Cattai National Park',
    region: 'Northwest Sydney',
    location: { lat: -33.545, lon: 150.945 },
    siteType: 'both' as const,
    facilities: {
      hasHotWater: true,
      hasPower: false,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: true,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/cattai-campground',
    description:
      'Riverside campground on the Hawkesbury River. Large grassy sites suitable for tents and campervans, with opportunities for kayaking, fishing, and picnicking.',
    tags: ['riverside', 'family-friendly', 'campfire'],
  },
  {
    name: 'Mill Creek Campground',
    slug: 'mill-creek-campground',
    parkName: 'Dharug National Park',
    region: 'Northwest Sydney',
    location: { lat: -33.384, lon: 150.983 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: false,
      hasPower: false,
      hasToilets: true,
      hasShowers: false,
      allowsCampfire: true,
      allowsFishing: false,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/mill-creek-campground',
    description:
      'Shaded bush campground surrounded by forest, suitable for car-based tent camping. Good base for short walks and birdwatching.',
    tags: ['bush-camping', 'shaded', 'car-camping'],
  },
  {
    name: 'Bents Basin Campground',
    slug: 'bents-basin-campground',
    parkName: 'Bents Basin State Conservation Area',
    region: 'Western Sydney',
    location: { lat: -33.883, lon: 150.602 },
    siteType: 'both' as const,
    facilities: {
      hasHotWater: true,
      hasPower: true,
      hasToilets: true,
      hasShowers: true,
      allowsCampfire: true,
      allowsFishing: true,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/bents-basin-campground',
    description:
      'Popular campground near a natural swimming hole on the Nepean River. Good facilities and large sites make it suitable for families and groups.',
    tags: ['swimming', 'family-friendly', 'powered-sites'],
  },
  {
    name: 'Ingar Campground',
    slug: 'ingar-campground',
    parkName: 'Blue Mountains National Park',
    region: 'Blue Mountains',
    location: { lat: -33.797, lon: 150.434 },
    siteType: 'tent' as const,
    facilities: {
      hasHotWater: false,
      hasPower: false,
      hasToilets: true,
      hasShowers: false,
      allowsCampfire: true,
      allowsFishing: false,
    },
    bookingUrl:
      'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/ingar-campground',
    description:
      'Remote-style bush campground accessible by 4WD or walking track (access can change). Basic facilities near a dam popular for swimming and relaxing.',
    tags: ['remote', '4wd', 'bush-camping'],
  }
];


export async function seedCampsites() {
  try {
    const count = await Campsite.countDocuments();
    
    if (count > 0) {
      console.log('✅ Campsites already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding campsites...');
    await Campsite.insertMany(sampleCampsites);
    console.log(`✅ Seeded ${sampleCampsites.length} campsites`);
  } catch (error) {
    console.error('❌ Error seeding campsites:', error);
    // Don't throw - allow server to start even if seeding fails
  }
}

