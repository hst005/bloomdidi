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

interface LocationState {
  location: DeliveryLocation;
  setLocation: (loc: DeliveryLocation) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: PRESET_LOCATIONS[0],
      setLocation: (location) => set({ location }),
    }),
    { name: 'bloomdidi-location' },
  ),
);
