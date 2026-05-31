'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchCities } from '@/app/actions';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import tzlookup from 'tz-lookup';

interface City {
  name: string;
  admin1: string;
  countryCode: string;
  lat: number;
  lon: number;
  tz: string;
}

interface LocationProps {
  onSelect: (lat: number, lon: number, ianaTz: string, label: string) => void;
  defaultLabel?: string;
}

export default function LocationAutocomplete({ onSelect, defaultLabel = '' }: LocationProps) {
  const [query, setQuery] = useState(defaultLabel);
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync incoming defaultLabel
  useEffect(() => {
    setQuery(defaultLabel);
  }, [defaultLabel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    
    // Only search if user is actively typing, not just selecting
    if (isOpen) {
      const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await searchCities(query);
          setResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [query, isOpen]);

  const handleSelect = (city: City) => {
    const label = `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.countryCode}`;
    setQuery(label);
    setIsOpen(false);
    onSelect(city.lat, city.lon, city.tz, label);
  };

  const handleGPS = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const tz = tzlookup(lat, lon);
            const label = `GPS Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
            setQuery(label);
            onSelect(lat, lon, tz, label);
          } catch (e) {
            alert('Could not determine timezone for your location.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          alert('GPS location access denied or unavailable.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: '1 1 250px' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>Birth Location</label>
      <div style={{ position: 'relative', display: 'flex' }}>
        <div style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>
          <Search size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder="e.g. Mumbai, New York"
          style={{ width: '100%', padding: '0.5rem 2.2rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
        {query && (
          <button 
            type="button" 
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} 
            style={{ position: 'absolute', right: '40px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={18} />
          </button>
        )}
        <button 
          type="button" 
          onClick={handleGPS} 
          title="Use current GPS location"
          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
        >
          <Navigation size={18} />
        </button>
      </div>
      
      {isOpen && (query.length >= 2) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {loading && <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Searching...</div>}
          {!loading && results.length === 0 && <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No cities found.</div>}
          {!loading && results.map((city, i) => (
            <div 
              key={`${city.name}-${i}`} 
              onClick={() => handleSelect(city)}
              style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              <MapPin size={16} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{city.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{city.admin1 ? city.admin1 + ', ' : ''}{city.countryCode} • {city.tz}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
