import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { getCampsites, type Campsite } from '../api/client';
import { Layout } from '../components/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, X, ArrowLeft, ExternalLink, Map } from 'lucide-react';

// ─── Animation tokens ─────────────────────────────────────────────────────────

const CARD_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const CARD_ITEM: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

// ─── Map helpers ─────────────────────────────────────────────────────────────

function createPin(hex: string) {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C9 0 3 6 3 13c0 10 13 27 13 27s13-17 13-27C29 6 23 0 16 0z" fill="${hex}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="13" r="5" fill="white" fill-opacity="0.9"/>
      </svg>`
    )}`,
    iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
  });
}

const pins = {
  tent:    createPin('#15803D'),
  caravan: createPin('#B45309'),
  both:    createPin('#0F766E'),
};

function MapFlyTo({ campsite }: { campsite: Campsite | null }) {
  const map = useMap();
  useEffect(() => {
    if (campsite) map.flyTo([campsite.location.lat, campsite.location.lon], 13, { duration: 1.2 });
  }, [campsite, map]);
  return null;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden animate-pulse bg-white">
      <div className="h-28 bg-gray-200" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── Facilities ───────────────────────────────────────────────────────────────

const FACILITIES: { key: keyof Campsite['facilities']; label: string; emoji: string }[] = [
  { key: 'hasPower',       label: 'Power',     emoji: '⚡' },
  { key: 'hasHotWater',    label: 'Hot Water', emoji: '💧' },
  { key: 'hasShowers',     label: 'Showers',   emoji: '🚿' },
  { key: 'hasToilets',     label: 'Toilets',   emoji: '🚽' },
  { key: 'allowsCampfire', label: 'Campfire',  emoji: '🔥' },
  { key: 'allowsFishing',  label: 'Fishing',   emoji: '🎣' },
];

// ─── Card gradient + badge by site type ──────────────────────────────────────

const CARD_STYLE = {
  tent:    { gradient: 'from-brand-700 to-brand-500', icon: '⛺',   badgeVariant: 'brand'  as const },
  caravan: { gradient: 'from-amber-700 to-amber-500', icon: '🚐',   badgeVariant: 'amber'  as const },
  both:    { gradient: 'from-teal-700  to-teal-500',  icon: '⛺🚐', badgeVariant: 'teal'   as const },
};

function SiteTypeBadge({ type }: { type: Campsite['siteType'] }) {
  const { icon, badgeVariant } = CARD_STYLE[type];
  const label = type === 'tent' ? 'Tent' : type === 'caravan' ? 'Caravan' : 'Tent & Caravan';
  return <Badge variant={badgeVariant}>{icon} {label}</Badge>;
}

// ─── Campsite card ────────────────────────────────────────────────────────────

function CampsiteCard({ campsite, selected, onClick }: {
  campsite: Campsite; selected: boolean; onClick: () => void;
}) {
  const { gradient, icon } = CARD_STYLE[campsite.siteType];
  const active = FACILITIES.filter(f => campsite.facilities[f.key]);

  return (
    <motion.div
      variants={CARD_ITEM}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-2xl border overflow-hidden cursor-pointer bg-white
        ${selected
          ? 'border-gray-900 ring-2 ring-gray-900 shadow-lg'
          : 'border-gray-200 shadow-sm'
        }`}
    >
      <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl drop-shadow-sm">{icon}</span>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-900 leading-snug text-base line-clamp-2">
          {campsite.name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{campsite.parkName}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="default">{campsite.region}</Badge>
          <SiteTypeBadge type={campsite.siteType} />
        </div>
        {active.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {active.map(f => (
              <span key={f.key} title={f.label} className="text-base">{f.emoji}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Detail content ───────────────────────────────────────────────────────────

function CampsiteDetail({ campsite, onClose, onPlan }: {
  campsite: Campsite; onClose: () => void; onPlan: () => void;
}) {
  const { gradient, icon } = CARD_STYLE[campsite.siteType];
  const active = FACILITIES.filter(f => campsite.facilities[f.key]);

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-shrink-0 h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <span className="text-6xl drop-shadow">{icon}</span>
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm
                     flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="default">{campsite.region}</Badge>
              <SiteTypeBadge type={campsite.siteType} />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 leading-snug">{campsite.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{campsite.parkName}</p>
            <p className="font-mono text-xs text-gray-400 mt-1">
              {campsite.location.lat.toFixed(4)}, {campsite.location.lon.toFixed(4)}
            </p>
          </div>
          {active.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {active.map(f => (
                  <span key={f.key} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full text-gray-700">
                    {f.emoji} {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {campsite.description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{campsite.description}</p>
            </div>
          )}
          {campsite.tags && campsite.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {campsite.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          )}
          <div className="flex flex-col gap-2 pb-4">
            <Button size="lg" onClick={onPlan} className="w-full">Plan a Trip Here →</Button>
            {campsite.bookingUrl && (
              <a href={campsite.bookingUrl} target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm
                           font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <ExternalLink className="w-4 h-4" />
                View Booking Info
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type View = 'list' | 'detail';
type TypeFilter = 'all' | 'tent' | 'caravan' | 'both';
const SYDNEY: LatLngExpression = [-33.8688, 151.2093];
const NAV_H = 64;

export function Explore() {
  const navigate = useNavigate();
  const [campsites, setCampsites]           = useState<Campsite[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [typeFilter, setTypeFilter]         = useState<TypeFilter>('all');
  const [selected, setSelected]             = useState<Campsite | null>(null);
  const [view, setView]                     = useState<View>('list');
  const [showMapOverlay, setShowMapOverlay] = useState(false);

  useEffect(() => {
    getCampsites()
      .then(setCampsites)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load campsites'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = campsites.filter(c => {
    const matchesType   = typeFilter === 'all' || c.siteType === typeFilter;
    const q             = search.trim().toLowerCase();
    const matchesSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.parkName.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const selectCampsite = useCallback((c: Campsite) => {
    setSelected(c);
    setView('detail');
  }, []);

  const clearSelection = () => {
    setSelected(null);
    setView('list');
  };

  const handlePlan = (c: Campsite) =>
    navigate(`/plan?campsiteId=${c._id}&campsite=${encodeURIComponent(c.name)}`);

  const mapCenter: LatLngExpression = selected
    ? [selected.location.lat, selected.location.lon]
    : filtered.length > 0
      ? [filtered.reduce((s,c)=>s+c.location.lat,0)/filtered.length,
         filtered.reduce((s,c)=>s+c.location.lon,0)/filtered.length]
      : SYDNEY;

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: `calc(100vh - ${NAV_H}px)` }}>

        {/* Filter bar */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campsites, parks or regions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900
                         focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {(['all', 'tent', 'caravan', 'both'] as TypeFilter[]).map(t => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTypeFilter(t)}
                  className={`flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    typeFilter === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'tent' ? '⛺ Tent' : t === 'caravan' ? '🚐 Caravan' : '⛺🚐 Both'}
                </motion.button>
              ))}
            </div>
            <span className="flex-shrink-0 text-xs text-gray-400">
              {loading ? '…' : `${filtered.length} sites`}
            </span>
          </div>
        </div>

        {/* Split panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT: card grid or detail */}
          <div className="w-full md:w-[55%] overflow-y-auto pb-20 md:pb-4">

            {/* LIST VIEW */}
            {view === 'list' && (
              <>
                {error && (
                  <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                )}
                {!error && filtered.length === 0 && !loading && (
                  <div className="py-20 text-center">
                    <p className="text-gray-400 text-sm">No campsites match your search.</p>
                  </div>
                )}

                {/* Skeleton cards while loading */}
                {loading && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                )}

                {/* Staggered card grid */}
                {!loading && !error && filtered.length > 0 && (
                  <motion.div
                    variants={CARD_CONTAINER}
                    initial="hidden"
                    animate="show"
                    className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {filtered.map(c => (
                      <CampsiteCard
                        key={c._id}
                        campsite={c}
                        selected={selected?._id === c._id}
                        onClick={() => selectCampsite(c)}
                      />
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {/* DETAIL VIEW (desktop) */}
            <AnimatePresence mode="wait">
              {view === 'detail' && selected && (
                <motion.div
                  key={selected._id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  className="h-full"
                >
                  <CampsiteDetail
                    campsite={selected}
                    onClose={clearSelection}
                    onPlan={() => handlePlan(selected)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: map (desktop) */}
          <div className="hidden md:block md:w-[45%] border-l border-gray-100">
            <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapFlyTo campsite={selected} />
              {filtered.map(c => (
                <Marker key={c._id} position={[c.location.lat, c.location.lon]} icon={pins[c.siteType]}
                  eventHandlers={{ click: () => selectCampsite(c) }}>
                  <Popup>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.parkName}</p>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* FAB — animated entrance */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.4 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowMapOverlay(true)}
        className="md:hidden fixed bottom-20 right-4 z-[1000]
                   flex items-center gap-2 px-4 py-3 bg-brand-600 text-white
                   rounded-full shadow-lg text-sm font-semibold"
      >
        <Map className="w-4 h-4" />
        Map
      </motion.button>

      {/* Full-screen map overlay — fade in/out */}
      <AnimatePresence>
        {showMapOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-[1500] flex flex-col bg-white"
          >
            <div className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-gray-100 bg-white">
              <button onClick={() => setShowMapOverlay(false)} className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <span className="font-semibold text-gray-900">Map View</span>
              <span className="text-xs text-gray-400 ml-auto">{filtered.length} sites</span>
            </div>
            <div className="flex-1 min-h-0">
              <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapFlyTo campsite={selected} />
                {filtered.map(c => (
                  <Marker key={c._id} position={[c.location.lat, c.location.lon]} icon={pins[c.siteType]}
                    eventHandlers={{ click: () => { selectCampsite(c); setShowMapOverlay(false); } }}>
                    <Popup>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.parkName}</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet — spring physics + drag to dismiss */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={clearSelection}
              className="md:hidden fixed inset-0 z-[1100] bg-black/30"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 300) clearSelection();
              }}
              className="md:hidden fixed inset-x-0 bottom-0 z-[1200] bg-white rounded-t-3xl shadow-2xl max-h-[78vh] overflow-hidden flex flex-col"
            >
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <CampsiteDetail
                campsite={selected}
                onClose={clearSelection}
                onPlan={() => handlePlan(selected)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}
