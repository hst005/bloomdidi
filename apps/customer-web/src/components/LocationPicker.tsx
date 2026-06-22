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
            className="bd-sheet-backdrop"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="bd-sheet"
          >
            <div className="px-4 pt-4 pb-2" style={{ borderBottom: '1px solid var(--bd-border)' }}>
              <div
                className="w-10 h-1 rounded-full mx-auto mb-4"
                style={{ background: 'var(--bd-border)' }}
              />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--bd-ink)' }}>
                Deliver to
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--bd-ink-soft)' }}>
                Choose your area to see nearby florists
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                className="bd-sheet-option bd-sheet-option-highlight disabled:opacity-50"
              >
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-medium" style={{ color: 'var(--bd-rose)' }}>
                    {geoLoading ? 'Getting location…' : 'Use my current location'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--bd-ink-soft)' }}>
                    Requires browser permission
                  </p>
                </div>
              </button>

              {geoError && (
                <p className="text-xs px-1" style={{ color: 'var(--bd-amber)' }}>
                  {geoError}
                </p>
              )}

              <p
                className="text-xs uppercase tracking-wider pt-2 px-1"
                style={{ color: 'var(--bd-ink-soft)' }}
              >
                Popular areas
              </p>

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
                    className={`bd-sheet-option${selected ? ' is-selected' : ''}`}
                  >
                    <span className="text-lg">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: 'var(--bd-ink)' }}>
                        {preset.label}
                      </p>
                    </div>
                    {selected && (
                      <span className="text-sm shrink-0" style={{ color: 'var(--bd-rose)' }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid var(--bd-border)' }}>
              <button type="button" onClick={onClose} className="bd-btn bd-btn-outline w-full">
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
