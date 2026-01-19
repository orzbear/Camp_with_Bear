import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { listFootprints, type Footprint, createFootprint, updateFootprint, deleteFootprint, type CreateFootprintRequest, type UpdateFootprintRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Layout } from '../components/Layout';
import { FootprintForm } from '../components/FootprintForm';
import { MapPin } from 'lucide-react';
import { demoFootprints } from '../data/demoFootprints';

// Map controller component that flies to selected footprint
function MapController({ selectedFootprint }: { selectedFootprint: Footprint | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedFootprint) {
      map.flyTo([selectedFootprint.location.lat, selectedFootprint.location.lon], 13, {
        duration: 1.5,
      });
    }
  }, [selectedFootprint, map]);

  return null;
}

// Custom marker icon using SVG
function createCustomIcon(color: string) {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const footprintIcon = createCustomIcon('#10b981'); // Green for footprints

export function Footprints() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [hoveredFootprint, setHoveredFootprint] = useState<string | null>(null);
  const [footprintsLoading, setFootprintsLoading] = useState(false);
  const [footprintsError, setFootprintsError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingFootprint, setEditingFootprint] = useState<Footprint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      // Authenticated: load real footprints from API
      loadFootprints();
    } else {
      // Not authenticated: use demo footprints (read-only)
      setFootprints(demoFootprints);
      setFootprintsLoading(false);
      setFootprintsError(null);
      // Clear selection when switching modes
      setSelectedFootprint(null);
    }
  }, [token]);

  const loadFootprints = async () => {
    if (!token) return;
    try {
      setFootprintsLoading(true);
      setFootprintsError(null);
      const data = await listFootprints(token);
      setFootprints(data);
    } catch (err) {
      setFootprintsError(err instanceof Error ? err.message : 'Failed to load footprints');
    } finally {
      setFootprintsLoading(false);
    }
  };

  const handleFootprintClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
  };

  const handleFootprintMarkerClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
  };

  const handleAddFootprint = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setEditingFootprint(null);
    setShowForm(true);
  };

  const handleEditFootprint = (footprint: Footprint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    setEditingFootprint(footprint);
    setShowForm(true);
  };

  const handleDeleteFootprint = async (footprint: Footprint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    
    if (!confirm(`Are you sure you want to delete "${footprint.title}"?`)) {
      return;
    }

    try {
      await deleteFootprint(token, footprint._id);
      setSuccessMessage('Footprint deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadFootprints();
      if (selectedFootprint?._id === footprint._id) {
        setSelectedFootprint(null);
      }
    } catch (err) {
      setFootprintsError(err instanceof Error ? err.message : 'Failed to delete footprint');
    }
  };

  const handleFormSave = async (data: CreateFootprintRequest | UpdateFootprintRequest) => {
    if (!token) return;

    setIsSubmitting(true);
    setFootprintsError(null);

    try {
      if (editingFootprint) {
        await updateFootprint(token, editingFootprint._id, data);
        setSuccessMessage('Footprint updated successfully');
      } else {
        await createFootprint(token, data as CreateFootprintRequest);
        setSuccessMessage('Footprint created successfully');
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowForm(false);
      setEditingFootprint(null);
      await loadFootprints();
    } catch (err) {
      setFootprintsError(err instanceof Error ? err.message : 'Failed to save footprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFootprint(null);
  };

  // Calculate center of all footprints for map
  const mapCenter: LatLngExpression = footprints.length > 0
    ? [
        footprints.reduce((sum, f) => sum + f.location.lat, 0) / footprints.length,
        footprints.reduce((sum, f) => sum + f.location.lon, 0) / footprints.length,
      ]
    : [-33.8688, 151.2093]; // Sydney center

  const isLoggedIn = !!token && !!user;
  const isDemoMode = !isLoggedIn;

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-medium">You're exploring demo footprints.</span> Sign in to save your own camping memories.
            </p>
            <Link
              to="/login"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        )}

        {footprintsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            {footprintsError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mx-4 mt-4 rounded">
            {successMessage}
          </div>
        )}

        {/* Split Layout: List + Map */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: List Panel (40% on desktop) */}
          <div className={`${showMap ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-2/5 border-r border-gray-200 bg-white`}>
            {/* Header with Add Button */}
            <div className="p-4 border-b bg-green-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {isDemoMode ? 'Camping Footprints (Demo)' : 'My Camping Footprints'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {isDemoMode ? 'Explore sample camping experiences' : 'Manage your camping experiences'}
                  </p>
                </div>
                {isLoggedIn && (
                  <button
                    onClick={handleAddFootprint}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    + Add Footprint
                  </button>
                )}
                {isDemoMode && (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Sign in to Save
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto">
              {footprintsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">Loading footprints...</p>
                </div>
              ) : footprints.length === 0 && isLoggedIn ? (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-600 text-sm mb-4">No camping footprints yet. Add your first trip.</p>
                  <button
                    onClick={handleAddFootprint}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Add Your First Footprint
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {footprints.map((footprint) => (
                    <div
                      key={footprint._id}
                      onMouseEnter={() => setHoveredFootprint(footprint._id)}
                      onMouseLeave={() => setHoveredFootprint(null)}
                      className={`p-3 transition-colors ${
                        selectedFootprint?._id === footprint._id
                          ? 'bg-green-100 border-l-4 border-l-green-500'
                          : hoveredFootprint === footprint._id
                          ? 'bg-green-50'
                          : 'hover:bg-green-50'
                      }`}
                    >
                      <div
                        onClick={() => handleFootprintClick(footprint)}
                        className="cursor-pointer"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">{footprint.title}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          {new Date(footprint.startDate).toLocaleDateString()} - {new Date(footprint.endDate).toLocaleDateString()}
                        </p>
                        {footprint.rating && (
                          <div className="text-xs text-gray-600 mb-1">
                            {'⭐'.repeat(footprint.rating)}
                          </div>
                        )}
                        {footprint.tags && footprint.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {footprint.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isLoggedIn && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-green-200">
                          <button
                            onClick={(e) => handleEditFootprint(footprint, e)}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteFootprint(footprint, e)}
                            className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {isDemoMode && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <Link
                            to="/login"
                            className="block w-full text-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Sign in to manage footprints
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Map Panel (60% on desktop) */}
          <div className={`${showMap ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-3/5 relative`}>
            {/* Mobile Map Toggle Button */}
            <button
              onClick={() => setShowMap(!showMap)}
              className="lg:hidden absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-md shadow-lg border border-gray-300 flex items-center gap-2 text-sm font-medium hover:bg-gray-50"
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'Show List' : 'Show Map'}
            </button>

            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapController selectedFootprint={selectedFootprint} />
              
              {/* Footprint Markers */}
              {footprints.map((footprint) => (
                <Marker
                  key={`footprint-${footprint._id}`}
                  position={[footprint.location.lat, footprint.location.lon]}
                  icon={footprintIcon}
                  eventHandlers={{
                    click: () => handleFootprintMarkerClick(footprint),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-semibold mb-1">{footprint.title}</h3>
                      <p className="text-gray-600 text-xs">
                        {new Date(footprint.startDate).toLocaleDateString()} - {new Date(footprint.endDate).toLocaleDateString()}
                      </p>
                      {footprint.rating && (
                        <p className="text-xs text-gray-600 mt-1">
                          {'⭐'.repeat(footprint.rating)}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Footprint Detail Drawer/Modal */}
        {selectedFootprint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFootprint(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedFootprint.title}</h2>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedFootprint.startDate).toLocaleDateString()} - {new Date(selectedFootprint.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedFootprint.location.lat.toFixed(4)}, {selectedFootprint.location.lon.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFootprint(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {selectedFootprint.rating && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Rating</h3>
                    <p className="text-lg">{'⭐'.repeat(selectedFootprint.rating)}</p>
                  </div>
                )}

                {selectedFootprint.notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700">{selectedFootprint.notes}</p>
                  </div>
                )}

                {selectedFootprint.tags && selectedFootprint.tags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFootprint.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isDemoMode && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Link
                      to="/login"
                      className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Sign in to create your own footprints
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footprint Form Modal */}
        {showForm && (
          <FootprintForm
            footprint={editingFootprint}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </Layout>
  );
}
