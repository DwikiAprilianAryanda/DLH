'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Import leaflet.heat plugin dynamically
if (typeof window !== 'undefined') {
  require('leaflet.heat');
}

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    // @ts-expect-error L.heatLayer dynamically registered by leaflet.heat
    if (!L.heatLayer) return;

    // @ts-expect-error L.heatLayer
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}
