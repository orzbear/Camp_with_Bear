import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  name: { type: String, required: true },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: locationSchema,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  groupSize: {
    type: Number,
    required: true,
    min: 1,
  },
  experience: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  },
  activities: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

export const Trip = mongoose.model('Trip', tripSchema);

