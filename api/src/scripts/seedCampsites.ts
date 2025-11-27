import { Campsite } from '../models/Campsite.js';

const sampleCampsites = [
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
    bookingUrl: 'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/lane-cove-river-tourist-park',
    description: 'A popular campsite located in Lane Cove National Park, just 10km from Sydney CBD. Perfect for families with excellent facilities including hot showers, power sites, and easy access to walking trails.',
    tags: ['family-friendly', 'accessible', 'riverside'],
  },
  {
    name: 'The Basin',
    slug: 'the-basin',
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
    bookingUrl: 'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/the-basin-campground',
    description: 'A beautiful beachside campsite accessible only by ferry or boat. Ideal for tent camping with stunning water views. Campfires allowed in designated areas.',
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
    bookingUrl: 'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/bonnie-vale-campground',
    description: 'A well-equipped campground in Royal National Park with both powered and unpowered sites. Great for families and groups, with easy access to beaches and walking tracks.',
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
    bookingUrl: 'https://www.nationalparks.nsw.gov.au/camping-and-accommodation/campgrounds/euroka-campground',
    description: 'A rustic bush camping experience in the Blue Mountains. Tent-only sites with basic facilities. Perfect for those seeking a more authentic camping experience away from the city.',
    tags: ['bush-camping', 'tent-only', 'rustic'],
  },
  {
    name: 'Cockatoo Island',
    slug: 'cockatoo-island',
    parkName: 'Cockatoo Island',
    region: 'Sydney',
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
    description: 'Unique heritage camping experience on a UNESCO World Heritage-listed island in Sydney Harbour. Tent camping only with modern amenities. Accessible by ferry from Circular Quay.',
    tags: ['heritage', 'island', 'tent-only', 'harbour-views'],
  },
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

