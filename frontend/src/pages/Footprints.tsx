import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  listFootprints, type Footprint,
  createFootprint, updateFootprint, deleteFootprint,
  type CreateFootprintRequest, type UpdateFootprintRequest,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Layout } from '../components/Layout';
import { FootprintForm } from '../components/FootprintForm';
import { MapPin, Pencil, Trash2, Plus } from 'lucide-react';
import { demoFootprints } from '../data/demoFootprints';

const CARD_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const CARD_ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

// ─── Map helpers ──────────────────────────────────────────────────────────────

function MapController({ selected }: { selected: Footprint | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyTo([selected.location.lat, selected.location.lon], 13, { duration: 1.5 });
  }, [selected, map]);
  return null;
}

function createPin(hex: string) {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C9 0 3 6 3 13c0 10 13 27 13 27s13-17 13-27C29 6 23 0 16 0z"
              fill="${hex}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="13" r="5" fill="white" fill-opacity="0.9"/>
      </svg>`
    )}`,
    iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
  });
}

const footprintPin = createPin('#15803D');

// ─── Star rating display ──────────────────────────────────────────────────────

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm leading-none ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  );
}

// ─── Footprint card ───────────────────────────────────────────────────────────

function FootprintCard({
  footprint, selected, isLoggedIn, isDemoMode,
  onClick, onEdit, onDelete,
}: {
  footprint: Footprint;
  selected: boolean;
  isLoggedIn: boolean;
  isDemoMode: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const start = new Date(footprint.startDate);
  const end   = new Date(footprint.endDate);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const dateLabel = `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;

  return (
    <motion.div
      variants={CARD_ITEM}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        group bg-white rounded-2xl border cursor-pointer
        ${selected
          ? 'border-gray-900 ring-2 ring-gray-900 shadow-md'
          : 'border-gray-200 shadow-sm'
        }
      `}
    >
      <div className="p-4">
        {/* Title row + action buttons */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-gray-900 text-base leading-snug flex-1">
            {footprint.title}
          </h3>

          {isLoggedIn && (
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Date + nights */}
        <p className="text-sm text-gray-400 mt-1">
          {dateLabel}
          {nights > 0 && <span className="ml-1.5">· {nights} night{nights !== 1 ? 's' : ''}</span>}
        </p>

        {/* Stars */}
        {footprint.rating && (
          <div className="mt-2">
            <Stars rating={footprint.rating} />
          </div>
        )}

        {/* Tags */}
        {footprint.tags && footprint.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {footprint.tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Demo sign-in prompt */}
        {isDemoMode && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link
              to="/login"
              onClick={e => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors underline underline-offset-2"
            >
              Sign in to manage your own footprints
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SYDNEY: LatLngExpression = [-33.8688, 151.2093];
const NAV_H = 64;

export function Footprints() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [footprints, setFootprints]     = useState<Footprint[]>([]);
  const [selected, setSelected]         = useState<Footprint | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);
  const [showMap, setShowMap]           = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editingFp, setEditingFp]       = useState<Footprint | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const isLoggedIn = !!token && !!user;
  const isDemoMode = !isLoggedIn;

  useEffect(() => {
    if (token) {
      loadFootprints();
    } else {
      setFootprints(demoFootprints);
      setSelected(null);
    }
  }, [token]);

  const loadFootprints = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setFootprints(await listFootprints(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load footprints');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAdd = () => {
    if (!token) { navigate('/login'); return; }
    setEditingFp(null);
    setShowForm(true);
  };

  const handleEdit = (fp: Footprint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFp(fp);
    setShowForm(true);
  };

  const handleDelete = async (fp: Footprint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !confirm(`Delete "${fp.title}"?`)) return;
    try {
      await deleteFootprint(token, fp._id);
      showSuccess('Footprint deleted');
      if (selected?._id === fp._id) setSelected(null);
      await loadFootprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSave = async (data: CreateFootprintRequest | UpdateFootprintRequest) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingFp) {
        await updateFootprint(token, editingFp._id, data);
        showSuccess('Footprint updated');
      } else {
        await createFootprint(token, data as CreateFootprintRequest);
        showSuccess('Footprint added');
      }
      setShowForm(false);
      setEditingFp(null);
      await loadFootprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const mapCenter: LatLngExpression = selected
    ? [selected.location.lat, selected.location.lon]
    : footprints.length > 0
      ? [
          footprints.reduce((s, f) => s + f.location.lat, 0) / footprints.length,
          footprints.reduce((s, f) => s + f.location.lon, 0) / footprints.length,
        ]
      : SYDNEY;

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: `calc(100vh - ${NAV_H}px)` }}>

        {/* Toast messages */}
        {(error || success) && (
          <div className={`flex-shrink-0 px-4 py-2.5 text-sm border-b ${
            error   ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {error || success}
          </div>
        )}

        {/* Split panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT: list panel */}
          <div className={`${showMap ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-2/5 border-r border-gray-100 bg-white`}>

            {/* Panel header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div>
                <h2 className="font-display font-semibold text-gray-900 text-lg">
                  {isDemoMode ? 'Explore Footprints' : 'My Footprints'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isDemoMode
                    ? 'Sample camping memories'
                    : `${footprints.length} camp${footprints.length !== 1 ? 's' : ''} logged`
                  }
                </p>
              </div>
              {isLoggedIn && (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
              {isDemoMode && (
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Demo banner */}
            {isDemoMode && (
              <div className="flex-shrink-0 flex items-center justify-between bg-gray-50 border-b border-gray-100 px-4 py-2.5">
                <p className="text-xs text-gray-500">
                  Sign in to save and map your own camping memories.
                </p>
              </div>
            )}

            {/* Card list */}
            <div className="flex-1 overflow-y-auto pb-16 md:pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : footprints.length === 0 && isLoggedIn ? (
                <div className="py-16 px-6 text-center">
                  <p className="text-gray-400 text-sm mb-4">No footprints yet. Add your first camping memory.</p>
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                  >
                    Add First Footprint
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={CARD_CONTAINER}
                  initial="hidden"
                  animate="show"
                  className="p-3 space-y-3"
                >
                  {footprints.map(fp => (
                    <FootprintCard
                      key={fp._id}
                      footprint={fp}
                      selected={selected?._id === fp._id}
                      isLoggedIn={isLoggedIn}
                      isDemoMode={isDemoMode}
                      onClick={() => setSelected(fp)}
                      onEdit={e => handleEdit(fp, e)}
                      onDelete={e => handleDelete(fp, e)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT: map */}
          <div className={`${showMap ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-3/5 relative`}>
            {/* Mobile toggle */}
            <button
              onClick={() => setShowMap(v => !v)}
              className="lg:hidden absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:bg-gray-50"
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'Show List' : 'Show Map'}
            </button>

            <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapController selected={selected} />
              {footprints.map(fp => (
                <Marker
                  key={fp._id}
                  position={[fp.location.lat, fp.location.lon]}
                  icon={footprintPin}
                  eventHandlers={{ click: () => setSelected(fp) }}
                >
                  <Popup>
                    <div>
                      <p className="font-semibold text-sm">{fp.title}</p>
                      {fp.rating && (
                        <div className="flex gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-xs ${i <= fp.rating! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Selected footprint detail modal */}
        <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-gray-900">{selected.title}</h2>
                    <p className="text-sm text-gray-400 mt-0.5 font-mono">
                      {selected.location.lat.toFixed(4)}, {selected.location.lon.toFixed(4)}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0">
                    ✕
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  {new Date(selected.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' – '}
                  {new Date(selected.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
                </p>

                {selected.rating && <Stars rating={selected.rating} />}

                {selected.notes && (
                  <p className="text-sm text-gray-700 mt-4 leading-relaxed">{selected.notes}</p>
                )}

                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {selected.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isDemoMode && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                    >
                      Sign in to create your own footprints
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* FootprintForm modal */}
        {showForm && (
          <FootprintForm
            footprint={editingFp}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingFp(null); }}
            isSubmitting={submitting}
          />
        )}
      </div>
    </Layout>
  );
}
