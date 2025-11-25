import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createTrip, listTrips, deleteTrip, getWeather, getChecklist } from '../api/client';

interface Trip {
  _id: string;
  location: { lat: number; lon: number; name: string };
  startDate: string;
  endDate: string;
  groupSize: number;
  experience: string;
  activities: string[];
}

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<{ tripId: string; items: Array<{ name: string; qty: number; reason: string; recommended: boolean }> } | null>(null);
  const [checklistLoading, setChecklistLoading] = useState<string | null>(null);

  // Form state
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupSize, setGroupSize] = useState('1');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner');
  const [activities, setActivities] = useState('');

  useEffect(() => {
    if (token) {
      loadTrips();
    }
  }, [token]);

  const loadTrips = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await listTrips(token);
      setTrips(data as Trip[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    try {
      const activitiesArray = activities.split(',').map(a => a.trim()).filter(a => a);
      await createTrip(token, {
        location: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          name: locationName,
        },
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupSize: parseInt(groupSize),
        experience,
        activities: activitiesArray,
      });
      
      // Reset form
      setLocationName('');
      setLat('');
      setLon('');
      setStartDate('');
      setEndDate('');
      setGroupSize('1');
      setExperience('beginner');
      setActivities('');
      
      // Reload trips
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await deleteTrip(token, id);
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
    }
  };

  const handleGetWeather = async (trip: Trip) => {
    if (!token) return;
    try {
      setError(null);
      const data = await getWeather(token, {
        lat: trip.location.lat,
        lon: trip.location.lon,
        from: trip.startDate,
        to: trip.endDate,
      });
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    }
  };

  const handleGetChecklist = async (tripId: string) => {
    if (!token) return;
    try {
      setError(null);
      setChecklistLoading(tripId);
      const data = await getChecklist(token, tripId);
      setChecklistData({ tripId, items: data.items || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checklist');
    } finally {
      setChecklistLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Logged in as: {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Create Trip Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Trip</h2>
          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yosemite National Park"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="37.8651"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-119.5383"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value as any)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="hiking, camping, fishing"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </form>
        </div>

        {/* Trips List */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Trips</h2>
          {loading && trips.length === 0 ? (
            <p className="text-gray-600">Loading trips...</p>
          ) : trips.length === 0 ? (
            <p className="text-gray-600">No trips yet. Create your first trip above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{trip.location.name}</div>
                        <div className="text-sm text-gray-500">{trip.location.lat}, {trip.location.lon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.groupSize}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{trip.experience}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleGetWeather(trip)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Weather
                        </button>
                        <button
                          onClick={() => handleGetChecklist(trip._id)}
                          disabled={checklistLoading === trip._id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {checklistLoading === trip._id ? 'Loading...' : 'Checklist'}
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Weather Preview */}
        {weatherData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Weather Data</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(weatherData, null, 2)}
            </pre>
            <button
              onClick={() => setWeatherData(null)}
              className="mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        )}

        {/* Checklist Preview */}
        {checklistData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Packing Checklist</h2>
              <button
                onClick={() => setChecklistData(null)}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {checklistData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-600">x{item.qty}</span>
                      {item.recommended && (
                        <span className="text-green-600 text-sm font-medium">✅ Recommended</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

