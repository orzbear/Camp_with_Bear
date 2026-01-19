import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Layout } from '../components/Layout';
import { MapPin } from 'lucide-react';
import { demoFootprints } from '../data/demoFootprints';
import type { Footprint } from '../api/client';

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

export function Explore() {
  const { token } = useAuth();
  const [footprints] = useState<Footprint[]>(demoFootprints);
  const [selectedFootprint, setSelectedFootprint] = useState<Footprint | null>(null);
  const [hoveredFootprint, setHoveredFootprint] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false); // For mobile toggle

  // Calculate center of all footprints for map
  const mapCenter: LatLngExpression = footprints.length > 0
    ? [
        footprints.reduce((sum, f) => sum + f.location.lat, 0) / footprints.length,
        footprints.reduce((sum, f) => sum + f.location.lon, 0) / footprints.length,
      ]
    : [-33.8688, 151.2093]; // Sydney center

  const handleFootprintClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
  };

  const handleFootprintMarkerClick = (footprint: Footprint) => {
    setSelectedFootprint(footprint);
  };

  // If user is logged in, suggest they go to Footprints page
  if (token) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Demo Footprints</h1>
          <p className="text-lg text-gray-600 mb-8">
            You're logged in! Visit the <Link to="/footprints" className="text-green-600 hover:text-green-700 font-medium">Footprints</Link> page to view and manage your own camping footprints.
          </p>
          <Link
            to="/footprints"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Go to My Footprints
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Guest Mode Banner */}
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

        {/* Split Layout: List + Map */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: List Panel (40% on desktop) */}
          <div className={`${showMap ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-2/5 border-r border-gray-200 bg-white`}>
            {/* Header */}
            <div className="p-4 border-b bg-green-50">
              <h2 className="text-lg font-bold text-gray-800">Camping Footprints (Demo)</h2>
              <p className="text-xs text-gray-600 mt-1">Explore sample camping experiences</p>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto">
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

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link
                    to="/login"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Sign in to create your own footprints
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
