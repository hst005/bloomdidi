import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeliveryLocation {
  label: string;
  lat: number;
  lng: number;
}

export const PRESET_LOCATIONS: DeliveryLocation[] = [
  { label: 'Green Park, South Delhi', lat: 28.5244, lng: 77.1855 },
  { label: 'Hauz Khas, Delhi', lat: 28.5478, lng: 77.206 },
  { label: 'Saket, Delhi', lat: 28.5244, lng: 77.2065 },
  { label: 'Greater Kailash, Delhi', lat: 28.5494, lng: 77.241 },
  { label: 'Defence Colony, Delhi', lat: 28.5734, lng: 77.229 },
  { label: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
];

/** Seeded florists live in South Delhi — keep first-time users inside this box. */
export const SERVICE_AREA = {
  minLat: 28.4,
  maxLat: 28.75,
  minLng: 76.95,
  maxLng: 77.35,
};

export function isInServiceArea(lat: number, lng: number) {
  return (
    lat >= SERVICE_AREA.minLat &&
    lat <= SERVICE_AREA.maxLat &&
    lng >= SERVICE_AREA.minLng &&
    lng <= SERVICE_AREA.maxLng
  );
}

function normalizeLocation(loc: DeliveryLocation): DeliveryLocation {
  if (loc.label === 'Current location' && !isInServiceArea(loc.lat, loc.lng)) {
    return PRESET_LOCATIONS[0];
  }
  return loc;
}

interface LocationState {
  location: DeliveryLocation;
  setLocation: (loc: DeliveryLocation) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: PRESET_LOCATIONS[0],
      setLocation: (location) => set({ location: normalizeLocation(location) }),
    }),
    {
      name: 'bloomdidi-location',
      version: 1,
      migrate: (persisted) => {
        const state = persisted as LocationState | undefined;
        if (!state?.location) return { location: PRESET_LOCATIONS[0] };
        return { location: normalizeLocation(state.location) };
      },
    },
  ),
);
