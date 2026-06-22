import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESET_LOCATIONS, useLocationStore, type DeliveryLocation } from '../store/location';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
}

export function LocationPicker({ open, onClose }: LocationPickerProps) {
  const { location, setLocation } = useLocationStore();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const select = (loc: DeliveryLocation) => {
    setLocation(loc);
    onClose();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        select({
          label: 'Current location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Pick an area below instead.'
            : 'Could not get your location. Try again or pick an area below.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close location picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="px-4 pt-4 pb-2 border-b border-slate-800">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">Deliver to</h2>
              <p className="text-slate-400 text-sm mt-1">Choose your area to see nearby florists</p>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-left hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-medium text-blue-300">
                    {geoLoading ? 'Getting location…' : 'Use my current location'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Requires browser permission</p>
                </div>
              </button>

              {geoError && <p className="text-amber-400 text-xs px-1">{geoError}</p>}

              <p className="text-xs text-slate-500 uppercase tracking-wider pt-2 px-1">Popular areas</p>

              {PRESET_LOCATIONS.map((preset) => {
                const selected =
                  location.lat === preset.lat &&
                  location.lng === preset.lng &&
                  location.label === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => select(preset)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      selected
                        ? 'bg-slate-800 border border-blue-500/50'
                        : 'bg-slate-800/50 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{preset.label}</p>
                    </div>
                    {selected && <span className="text-blue-400 text-sm shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
