import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { getCampsites, getCampsite, type Campsite } from '../api/client';
import { Layout } from '../components/Layout';
import { MapPin } from 'lucide-react';

// Map controller component that flies to selected campsite
function MapController({ selectedCampsite }: { selectedCampsite: Campsite | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCampsite) {
      map.flyTo([selectedCampsite.latitude, selectedCampsite.longitude], 13, {
        duration: 1.5,
      });
    }
  }, [selectedCampsite, map]);

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

export function Search() {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [hoveredCampsite, setHoveredCampsite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteType, setSiteType] = useState<string>('');
  const [showMap, setShowMap] = useState(false); // For mobile toggle

  useEffect(() => {
    loadCampsites();
  }, [searchQuery, siteType]);

  const loadCampsites = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { query?: string; type?: string } = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (siteType) params.type = siteType;
      
      const data = await getCampsites(params);
      setCampsites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
    } finally {
      setLoading(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campsite details');
    }
  };

  const handleMarkerClick = (campsite: Campsite) => {
    setSelectedCampsite(campsite);
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

  // Calculate center of all campsites for map
  const mapCenter: LatLngExpression = campsites.length > 0
    ? [
        campsites.reduce((sum, c) => sum + c.latitude, 0) / campsites.length,
        campsites.reduce((sum, c) => sum + c.longitude, 0) / campsites.length,
      ]
    : [-33.8688, 151.2093]; // Sydney center

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Hero Section - Only on desktop */}
        {/* <div className="hidden lg:block text-center py-4 px-4 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            Find your next campsite around Sydney
          </h1>
        </div> */}

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
              {loading ? (
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
              <MapController selectedCampsite={selectedCampsite} />
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
      </div>
    </Layout>
  );
}
