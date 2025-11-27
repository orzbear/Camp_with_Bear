import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
}, { _id: false });

const facilitiesSchema = new mongoose.Schema({
  hasHotWater: { type: Boolean, default: false },
  hasPower: { type: Boolean, default: false },
  hasToilets: { type: Boolean, default: false },
  hasShowers: { type: Boolean, default: false },
  allowsCampfire: { type: Boolean, default: false },
  allowsFishing: { type: Boolean, default: false },
}, { _id: false });

const campsiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  parkName: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  location: {
    type: locationSchema,
    required: true,
  },
  siteType: {
    type: String,
    enum: ['tent', 'caravan', 'both'],
    required: true,
  },
  facilities: {
    type: facilitiesSchema,
    required: true,
  },
  bookingUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

export const Campsite = mongoose.model('Campsite', campsiteSchema);

