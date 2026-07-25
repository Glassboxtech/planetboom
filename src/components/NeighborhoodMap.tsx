/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Neighborhood {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  memberCount: number;
}

interface NeighborhoodMapProps {
  neighborhoods: Neighborhood[];
}

interface GoogleWindow extends Window {
  google?: typeof google;
  initMap?: () => void;
}

export function NeighborhoodMap({ neighborhoods }: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    const win = window as GoogleWindow;
    
    // Check if script is already loaded
    if (win.google?.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&callback=initMap`;
    script.async = true;
    script.defer = true;

    (window as GoogleWindow).initMap = () => {
      initializeMap();
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup markers and circles
      markersRef.current.forEach(marker => marker.map = null);
      circlesRef.current.forEach(circle => circle.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      updateMarkers();
    }
  }, [neighborhoods, isLoading]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Center on Cape Town area
    const capeTown = { lat: -33.9249, lng: 18.4241 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 11,
      center: capeTown,
      mapId: 'neighborhood-density-map',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setIsLoading(false);
    updateMarkers();
  };

  const updateMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    // Clear existing markers and circles
    markersRef.current.forEach(marker => marker.map = null);
    circlesRef.current.forEach(circle => circle.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Get max member count for scaling
    const maxCount = Math.max(...neighborhoods.map(n => n.memberCount), 1);

    neighborhoods.forEach((neighborhood) => {
      if (!neighborhood.latitude || !neighborhood.longitude) return;

      const position = { 
        lat: Number(neighborhood.latitude), 
        lng: Number(neighborhood.longitude) 
      };

      // Calculate circle size based on member count (min 200m, max 2000m)
      const radius = 200 + (neighborhood.memberCount / maxCount) * 1800;

      // Calculate color intensity based on member count
      const intensity = Math.min(neighborhood.memberCount / maxCount, 1);
      const hue = 200 - intensity * 150; // Blue to red gradient

      // Create density circle
      const circle = new window.google.maps.Circle({
        strokeColor: `hsl(${hue}, 70%, 50%)`,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: `hsl(${hue}, 70%, 50%)`,
        fillOpacity: 0.35,
        map,
        center: position,
        radius,
      });
      circlesRef.current.push(circle);

      // Create custom marker element using safe DOM APIs (textContent, no innerHTML)
      const markerContent = document.createElement('div');
      markerContent.className = 'neighborhood-marker';

      const card = document.createElement('div');
      card.style.cssText = `background:white;border:2px solid hsl(${hue},70%,50%);border-radius:8px;padding:8px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.2);text-align:center;min-width:80px;`;

      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = 'font-weight:600;font-size:14px;color:#1f2937;';
      nameDiv.textContent = neighborhood.name;

      const countDiv = document.createElement('div');
      countDiv.style.cssText = `font-size:20px;font-weight:700;color:hsl(${hue},70%,45%);`;
      countDiv.textContent = String(neighborhood.memberCount);

      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = 'font-size:11px;color:#6b7280;';
      labelDiv.textContent = 'members';

      card.appendChild(nameDiv);
      card.appendChild(countDiv);
      card.appendChild(labelDiv);
      markerContent.appendChild(card);

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerContent,
        title: `${neighborhood.name}: ${neighborhood.memberCount} members`,
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    const validNeighborhoods = neighborhoods.filter(n => n.latitude && n.longitude);
    if (validNeighborhoods.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validNeighborhoods.forEach(n => {
        bounds.extend({ lat: Number(n.latitude), lng: Number(n.longitude) });
      });
      map.fitBounds(bounds, 50);
    }
  };

  if (error) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Unable to load map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
