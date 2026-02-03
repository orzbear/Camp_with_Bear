import { useState, FormEvent, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import type { Footprint, CreateFootprintRequest, UpdateFootprintRequest, GeocodeResult } from '../api/client';
import { geocode } from '../api/client';

interface FootprintFormProps {
  footprint?: Footprint | null;
  onSave: (data: CreateFootprintRequest | UpdateFootprintRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map controller to center on location
function MapController({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function FootprintForm({ footprint, onSave, onCancel, isSubmitting = false }: FootprintFormProps) {
  const [title, setTitle] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (footprint) {
      // Edit mode: pre-fill form
      setTitle(footprint.title);
      setLat(footprint.location.lat);
      setLon(footprint.location.lon);
      setSelectedLocationName(`${footprint.location.lat.toFixed(4)}, ${footprint.location.lon.toFixed(4)}`);
      setStartDate(new Date(footprint.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(footprint.endDate).toISOString().slice(0, 16));
      setNotes(footprint.notes || '');
      setRating(footprint.rating || '');
      setTags(footprint.tags?.join(', ') || '');
    } else {
      // Create mode: reset form
      setTitle('');
      setLat(null);
      setLon(null);
      setSelectedLocationName('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      setRating('');
      setTags('');
    }
    setErrors({});
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
  }, [footprint]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geocode(searchQuery);
        setSearchResults(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Geocoding error:', error);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 1000); // Increased to 1000ms to respect Nominatim's 1 request/second rate limit

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectLocation = (result: GeocodeResult) => {
    setLat(result.lat);
    setLon(result.lon);
    setSelectedLocationName(result.name);
    setSearchQuery(result.name);
    setShowSuggestions(false);
    setSearchResults([]);
  };

  const handleMapClick = (clickedLat: number, clickedLon: number) => {
    setLat(clickedLat);
    setLon(clickedLon);
    setSelectedLocationName(`${clickedLat.toFixed(4)}, ${clickedLon.toFixed(4)}`);
    setSearchQuery(`${clickedLat.toFixed(4)}, ${clickedLon.toFixed(4)}`);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (lat === null || lon === null) {
      newErrors.location = 'Location is required. Please search for a campsite or place.';
    } else {
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.location = 'Invalid latitude';
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        newErrors.location = 'Invalid longitude';
      }
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (rating !== '' && (rating < 1 || rating > 5)) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    if (lat === null || lon === null) {
      return;
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

    const data: CreateFootprintRequest | UpdateFootprintRequest = {
      title: title.trim(),
      location: {
        lat,
        lon,
      },
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      notes: notes.trim() || undefined,
      rating: rating !== '' ? Number(rating) : undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    };

    await onSave(data);
  };

  const mapCenter: LatLngExpression = lat !== null && lon !== null 
    ? [lat, lon] 
    : [-33.8688, 151.2093]; // Sydney default

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {footprint ? 'Edit Footprint' : 'Add New Footprint'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Blue Mountains Adventure"
                disabled={isSubmitting}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setLat(null);
                      setLon(null);
                      setSelectedLocationName('');
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Search campsite or place (e.g. Royal National Park)"
                  disabled={isSubmitting}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  </div>
                )}
              </div>
              
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectLocation(result)}
                      className="w-full text-left px-4 py-2 hover:bg-green-50 focus:bg-green-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{result.name}</div>
                      <div className="text-xs text-gray-500">
                        {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLocationName && (
                <p className="text-xs text-green-600 mt-1">
                  Selected: {selectedLocationName}
                </p>
              )}
              
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Map Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Map Preview
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '250px' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={lat !== null && lon !== null ? 13 : 8}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {lat !== null && lon !== null && (
                    <>
                      <MapController center={[lat, lon]} />
                      <Marker position={[lat, lon]} />
                    </>
                  )}
                  <MapClickHandler onMapClick={handleMapClick} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tip: Click the map to fine-tune location
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes about your camping experience..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.rating ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">No rating</option>
                <option value="1">1 ⭐</option>
                <option value="2">2 ⭐⭐</option>
                <option value="3">3 ⭐⭐⭐</option>
                <option value="4">4 ⭐⭐⭐⭐</option>
                <option value="5">5 ⭐⭐⭐⭐⭐</option>
              </select>
              {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="hiking, scenic, family-friendly (comma-separated)"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : footprint ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
