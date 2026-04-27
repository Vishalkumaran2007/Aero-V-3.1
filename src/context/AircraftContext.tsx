import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aircraftApi } from '../services/api';
import { useAuth } from './AuthContext';

interface Aircraft {
  id: number;
  aircraft_id: string;
  type: string;
  manufacturer: string;
  serial_number: string;
  status: string;
  location: string;
  total_flight_hours?: number;
  next_a_check?: number;
  next_borescope?: number;
  health_index?: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  created_by_role?: string;
  created_by_user?: string;
}

interface AircraftContextType {
  aircrafts: Aircraft[];
  selectedAircraft: Aircraft | null;
  setSelectedAircraft: (aircraft: Aircraft | null) => void;
  loading: boolean;
  refreshAircrafts: () => Promise<void>;
}

const AircraftContext = createContext<AircraftContextType | undefined>(undefined);

export function AircraftProvider({ children }: { children: ReactNode }) {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const refreshAircrafts = async () => {
    const token = localStorage.getItem('skyscript_token');
    if (!token || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await aircraftApi.getAll();
      setAircrafts(res.data);
      if (res.data.length > 0 && !selectedAircraft) {
        // Default to first one if none selected and exists
        const savedId = localStorage.getItem('selected_aircraft_id');
        const found = res.data.find((a: Aircraft) => a.aircraft_id === savedId);
        setSelectedAircraft(found || res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch aircrafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAircrafts();
  }, [user]);

  useEffect(() => {
    if (selectedAircraft) {
      localStorage.setItem('selected_aircraft_id', selectedAircraft.aircraft_id);
    }
  }, [selectedAircraft]);

  return (
    <AircraftContext.Provider value={{ aircrafts, selectedAircraft, setSelectedAircraft, loading, refreshAircrafts }}>
      {children}
    </AircraftContext.Provider>
  );
}

export function useAircraft() {
  const context = useContext(AircraftContext);
  if (context === undefined) {
    throw new Error('useAircraft must be used within an AircraftProvider');
  }
  return context;
}
