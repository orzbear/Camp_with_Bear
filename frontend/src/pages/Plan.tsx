import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Layout } from '../components/Layout';
import { createTrip, listTrips, getWeather, getChecklist, getCampsites, type Campsite } from '../api/client';

interface Trip {
  _id: string;
  location: { lat: number; lon: number; name: string };
  startDate: string;
  endDate: string;
  groupSize: number;
  experience: string;
  activities: string[];
}

export function Plan() {
  const { user, token } = useAuth();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any>(null);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupSize, setGroupSize] = useState('1');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner');
  const [activities, setActivities] = useState('');

  useEffect(() => {
    if (token) {
      loadCampsites();
      loadTrips();
    }
  }, [token]);

  const loadTrips = async () => {
    if (!token) return;
    try {
      const data = await listTrips(token);
      setTrips(data as Trip[]);
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  };

  const loadCampsites = async () => {
    try {
      const data = await getCampsites();
      setCampsites(data);
    } catch (err) {
      console.error('Failed to load campsites:', err);
    }
  };

  const handleCreateTrip = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCampsite) return;

    setError(null);
    try {
      const activitiesArray = activities.split(',').map(a => a.trim()).filter(a => a);
      const trip = await createTrip(token, {
        location: {
          lat: selectedCampsite.location.lat,
          lon: selectedCampsite.location.lon,
          name: selectedCampsite.name,
        },
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupSize: parseInt(groupSize),
        experience,
        activities: activitiesArray,
      });

      // Reload trips and select the new one
      await loadTrips();
      
      // Load weather and checklist for the new trip
      if (trip.id) {
        // Find the newly created trip
        const newTrips = await listTrips(token);
        const newTrip = (newTrips as Trip[]).find(t => t._id === trip.id);
        if (newTrip) {
          setSelectedTrip(newTrip);
          await loadTripData(trip.id);
        }
      }

      // Reset form
      setStartDate('');
      setEndDate('');
      setGroupSize('1');
      setExperience('beginner');
      setActivities('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
  };

  const loadTripData = async (tripId: string) => {
    if (!token) return;
    try {
      // Load weather
      const trip = trips.find(t => t._id === tripId) || selectedTrip;
      if (trip) {
        const weather = await getWeather(token, {
          lat: trip.location.lat,
          lon: trip.location.lon,
          from: trip.startDate,
          to: trip.endDate,
        });
        setWeatherData(weather);

        // Load checklist
        const checklist = await getChecklist(token, tripId);
        setChecklistData(checklist);
      }
    } catch (err) {
      console.error('Failed to load trip data:', err);
    }
  };

  if (!user || !token) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-4">Plan Your Trip</h1>
          <p className="text-lg text-gray-600 mb-8">
            Log in to plan your trip and generate personalised checklists.
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Plan Your Trip</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Campsite Picker and Trip Form */}
          <div className="space-y-6">
            {/* Campsite Picker */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Select Campsite</h2>
              <select
                value={selectedCampsite?._id || ''}
                onChange={(e) => {
                  const campsite = campsites.find(c => c._id === e.target.value);
                  setSelectedCampsite(campsite || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="">Choose a campsite...</option>
                {campsites.map((campsite) => (
                  <option key={campsite._id} value={campsite._id}>
                    {campsite.name} - {campsite.parkName}
                  </option>
                ))}
              </select>
            </div>

            {/* Trip Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Trip Details</h2>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
                  <input
                    type="number"
                    min="1"
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as any)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activities (comma-separated)</label>
                  <input
                    type="text"
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                    placeholder="hiking, camping, fishing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!selectedCampsite}
                  className="w-full bg-brand-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  Create Trip
                </button>
              </form>
            </div>
          </div>

          {/* Right: Trip Summary, Weather, Checklist */}
          <div className="space-y-6">
            {/* Trip Selector */}
            {trips.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Your Trips</h2>
                <select
                  value={selectedTrip?._id || ''}
                  onChange={async (e) => {
                    const trip = trips.find(t => t._id === e.target.value);
                    if (trip) {
                      setSelectedTrip(trip);
                      await loadTripData(trip._id);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="">Select a trip...</option>
                  {trips.map((trip) => (
                    <option key={trip._id} value={trip._id}>
                      {trip.location.name} - {new Date(trip.startDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTrip && (
              <>
                {/* Trip Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Trip Summary</h2>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Location:</span> {selectedTrip.location.name}</p>
                    <p><span className="font-medium">Dates:</span> {new Date(selectedTrip.startDate).toLocaleDateString()} - {new Date(selectedTrip.endDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Group Size:</span> {selectedTrip.groupSize}</p>
                    <p><span className="font-medium">Experience:</span> {selectedTrip.experience}</p>
                    <p><span className="font-medium">Activities:</span> {selectedTrip.activities.join(', ') || 'None'}</p>
                  </div>
                </div>

                {/* Weather */}
                {weatherData && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Weather Forecast</h2>
                    <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm max-h-64">
                      {JSON.stringify(weatherData, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Checklist */}
                {checklistData && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="font-display font-semibold text-lg text-gray-900 mb-4">Packing Checklist</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {checklistData.items?.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-sm text-gray-600">x{item.qty}</span>
                              {item.recommended && (
                                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Recommended</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!selectedTrip && trips.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-600">
                <p>Create a trip to see weather forecast and packing checklist</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

