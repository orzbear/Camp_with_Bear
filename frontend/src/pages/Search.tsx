import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { getCampsites, getCampsite, type Campsite, listFootprints, type Footprint, createFootprint, updateFootprint, deleteFootprint, type CreateFootprintRequest, type UpdateFootprintRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Layout } from '../components/Layout';
import { FootprintForm } from '../components/FootprintForm';
import { MapPin } from 'lucide-react';
import { demoFootprints } from '../data/demoFootprints';

// Map controller component that flies to selected item
function MapController({ 
  selectedCampsite, 
  selectedFootprint 
}: { 
  selectedCampsite: Campsite | null;
  selectedFootprint: Footprint | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCampsite) {
      map.flyTo([selectedCampsite.latitude, selectedCampsite.longitude], 13, {
        duration: 1.5,
      });
    } else if (selectedFootprint) {
      map.flyTo([selectedFootprint.location.lat, selectedFootprint.location.lon], 13, {
        duration: 1.5,
      });
    }
  }, [selectedCampsite, selectedFootprint, map]);

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

const tentIcon = createCustomIcon('#3b82f6'); // Blue
const caravanIcon = createCustomIcon('#a855f7'); // Purple
const bothIcon = createCustomIcon('#6b7280'); // Gray
const footprintIcon = createCustomIcon('#10b981'); // Green for footprints

export function Search() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [hoveredCampsite, setHoveredCampsite] = useState<string | null>(null);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [hoveredFootprint, setHoveredFootprint] = useState<string | null>(null);
  const [campsitesLoading, setCampsitesLoading] = useState(false);
  const [footprintsLoading, setFootprintsLoading] = useState(false);
  const [footprintsError, setFootprintsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteType, setSiteType] = useState<string>('');
  const [showMap, setShowMap] = useState(false); // For mobile toggle
  
  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingFootprint, setEditingFootprint] = useState<Footprint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCampsites();
  }, [searchQuery, siteType]);

  useEffect(() => {
    if (token) {
      // Authenticated: fetch real footprints from API
      loadFootprints();
    } else {
      // Guest mode: use demo footprints (read-only)
      setFootprints(demoFootprints);
      setFootprintsLoading(false);
      setFootprintsError(null);
      // Clear selection when switching modes
      setSelectedFootprint(null);
    }
  }, [token]);

  const loadCampsites = async () => {
    try {
      setCampsitesLoading(true);
      setError(null);
      const params: { query?: string; type?: string } = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (siteType) params.type = siteType;
      
      const data = await getCampsites(params);
      setCampsites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
    } finally {
      setCampsitesLoading(false);
    }
  };

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

  const handleCampsiteClick = async (id: string) => {
    try {
      const campsite = await getCampsite(id);
      // Inject coordinates if not present
      const campsiteWithCoords = {
        ...campsite,
        latitude: campsite.location?.lat || campsite.latitude || -33.8688,
        longitude: campsite.location?.lon || campsite.longitude || 151.2093,
      };
      setSelectedCampsite(campsiteWithCoords);
      setSelectedFootprint(null); // Clear footprint selection
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campsite details');
    }
  };

  const handleFootprintClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
    setSelectedCampsite(null); // Clear campsite selection
  };

  const handleMarkerClick = (campsite: Campsite) => {
    setSelectedCampsite(campsite);
    setSelectedFootprint(null);
  };

  const handleFootprintMarkerClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
    setSelectedCampsite(null);
  };

  const handleAddFootprint = () => {
    if (!token) {
      // Guest mode: prompt to sign in
      navigate('/login');
      return;
    }
    setEditingFootprint(null);
    setShowForm(true);
  };

  const handleEditFootprint = (footprint: Footprint, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!token) return; // Should not happen, but safety check
    setEditingFootprint(footprint);
    setShowForm(true);
  };

  const handleDeleteFootprint = async (footprint: Footprint, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!token) return; // Should not happen, but safety check
    
    if (!confirm(`Are you sure you want to delete "${footprint.title}"?`)) {
      return;
    }

    try {
      await deleteFootprint(token, footprint._id);
      setSuccessMessage('Footprint deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadFootprints(); // Refresh list
      if (selectedFootprint?._id === footprint._id) {
        setSelectedFootprint(null); // Clear selection if deleted
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
        // Update existing footprint
        await updateFootprint(token, editingFootprint._id, data);
        setSuccessMessage('Footprint updated successfully');
      } else {
        // Create new footprint
        await createFootprint(token, data as CreateFootprintRequest);
        setSuccessMessage('Footprint created successfully');
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowForm(false);
      setEditingFootprint(null);
      await loadFootprints(); // Refresh list
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

  const getFacilityBadges = (facilities: Campsite['facilities']) => {
    const badges = [];
    if (facilities.hasPower) badges.push('Power');
    if (facilities.hasHotWater) badges.push('Hot Water');
    if (facilities.hasToilets) badges.push('Toilets');
    if (facilities.hasShowers) badges.push('Showers');
    if (facilities.allowsCampfire) badges.push('Campfire');
    if (facilities.allowsFishing) badges.push('Fishing');
    return badges;
  };

  const getMarkerIcon = (siteType: string) => {
    if (siteType === 'tent') return tentIcon;
    if (siteType === 'caravan') return caravanIcon;
    return bothIcon;
  };

  // Calculate center of all items for map
  const allItems = [
    ...campsites.map(c => ({ lat: c.latitude, lon: c.longitude })),
    ...footprints.map(f => ({ lat: f.location.lat, lon: f.location.lon })),
  ];
  const mapCenter: LatLngExpression = allItems.length > 0
    ? [
        allItems.reduce((sum, item) => sum + item.lat, 0) / allItems.length,
        allItems.reduce((sum, item) => sum + item.lon, 0) / allItems.length,
      ]
    : [-33.8688, 151.2093]; // Sydney center

  const isGuestMode = !token;

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Guest Mode Banner */}
        {isGuestMode && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Demo mode</span> — sign in to save your own camping footprints.
            </p>
            <Link
              to="/login"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Filters - Sticky at top on mobile, sidebar on desktop */}
        <div className="lg:hidden bg-white border-b p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or park"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={siteType}
              onChange={(e) => setSiteType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Site Types</option>
              <option value="tent">Tent</option>
              <option value="caravan">Caravan</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            {error}
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
            {/* Desktop Filters */}
            <div className="hidden lg:block p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Filters</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or park"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">All Site Types</option>
                  <option value="tent">Tent</option>
                  <option value="caravan">Caravan</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto">
              {/* Footprints Section */}
              <div className="border-b border-gray-200 p-4 bg-green-50">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {isGuestMode ? 'Camping Footprints (Demo)' : 'My Camping Footprints'}
                  </h2>
                  <button
                    onClick={handleAddFootprint}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    + Add Footprint
                  </button>
                </div>
                {isGuestMode ? (
                  // Guest mode: always show demo footprints (never empty)
                  <div className="divide-y divide-gray-200">
                    {footprints.map((footprint) => (
                      <div
                        key={footprint._id}
                        onClick={() => handleFootprintClick(footprint)}
                        onMouseEnter={() => setHoveredFootprint(footprint._id)}
                        onMouseLeave={() => setHoveredFootprint(null)}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedFootprint?._id === footprint._id
                            ? 'bg-green-100 border-l-4 border-l-green-500'
                            : hoveredFootprint === footprint._id
                            ? 'bg-green-50'
                            : 'hover:bg-green-50'
                        }`}
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
                    ))}
                  </div>
                ) : (
                  // Authenticated mode: fetch from API
                  <>
                    {footprintsLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 text-sm">Loading footprints...</p>
                      </div>
                    ) : footprints.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <p className="text-gray-600 text-sm">No camping footprints yet. Add your first trip.</p>
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
                        </div>
                      ))}
                    </div>
                    )}
                  </>
                )}
              </div>

              {/* Campsites Section */}
              {campsitesLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading campsites...</p>
                </div>
              ) : campsites.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-600">No campsites found. Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {campsites.map((campsite) => (
                    <div
                      key={campsite._id}
                      onClick={() => handleCampsiteClick(campsite._id)}
                      onMouseEnter={() => setHoveredCampsite(campsite._id)}
                      onMouseLeave={() => setHoveredCampsite(null)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedCampsite?._id === campsite._id
                          ? 'bg-green-50 border-l-4 border-l-green-500'
                          : hoveredCampsite === campsite._id
                          ? 'bg-gray-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{campsite.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{campsite.parkName}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {getFacilityBadges(campsite.facilities).slice(0, 2).map((badge) => (
                          <span
                            key={badge}
                            className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                          >
                            {badge}
                          </span>
                        ))}
                        {getFacilityBadges(campsite.facilities).length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{getFacilityBadges(campsite.facilities).length - 2}
                          </span>
                        )}
                      </div>

                      <div className="text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded ${
                          campsite.siteType === 'tent' ? 'bg-blue-100 text-blue-800' :
                          campsite.siteType === 'caravan' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campsite.siteType === 'both' ? 'Tent & Caravan' : campsite.siteType.charAt(0).toUpperCase() + campsite.siteType.slice(1)}
                        </span>
                      </div>
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
              <MapController selectedCampsite={selectedCampsite} selectedFootprint={selectedFootprint} />
              
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

              {/* Campsite Markers */}
              {campsites.map((campsite) => (
                <Marker
                  key={campsite._id}
                  position={[campsite.latitude, campsite.longitude]}
                  icon={getMarkerIcon(campsite.siteType)}
                  eventHandlers={{
                    click: () => handleMarkerClick(campsite),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-semibold mb-1">{campsite.name}</h3>
                      <p className="text-gray-600 text-xs">{campsite.parkName}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Campsite Detail Drawer/Modal */}
        {selectedCampsite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCampsite(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCampsite.name}</h2>
                    <p className="text-lg text-gray-600">{selectedCampsite.parkName}</p>
                    <p className="text-sm text-gray-500">{selectedCampsite.region}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCampsite(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {selectedCampsite.description && (
                  <p className="text-gray-700 mb-4">{selectedCampsite.description}</p>
                )}

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {getFacilityBadges(selectedCampsite.facilities).map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedCampsite.tags && selectedCampsite.tags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampsite.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCampsite.bookingUrl && (
                  <a
                    href={selectedCampsite.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Book Now
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

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
