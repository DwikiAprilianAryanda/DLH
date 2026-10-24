'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export const KECAMATAN_COORDINATES: Record<string, [number, number]> = {
  'Samarinda Kota': [-0.4984, 117.1472],
  'Samarinda Ulu': [-0.4855, 117.1350],
  'Samarinda Ilir': [-0.5050, 117.1620],
  'Samarinda Utara': [-0.4350, 117.1700],
  'Samarinda Seberang': [-0.5180, 117.1450],
  'Sungai Kunjang': [-0.5150, 117.1100],
  'Sungai Pinang': [-0.4750, 117.1650],
  'Sambutan': [-0.5200, 117.1950],
  'Palaran': [-0.5750, 117.1700],
  'Loa Janan Ilir': [-0.5500, 117.1000],
};

const pickerPinIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center cursor-pointer drop-shadow-xl hover:scale-110 transition-transform">
      <div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-white shadow-lg z-10 animate-pulse">
        <span class="material-symbols-outlined text-[20px]">pin_drop</span>
      </div>
      <div class="absolute w-3 h-3 bg-primary rotate-45 -bottom-1 z-0 shadow-sm border border-white"></div>
    </div>
  `,
  className: 'custom-leaflet-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom() < 13 ? 14 : map.getZoom(), { duration: 1 });
  }, [center, map]);
  return null;
}

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  kecamatan?: string;
  height?: string;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  kecamatan,
  height = '260px',
}: LocationPickerMapProps) {
  const [isLocating, setIsLocating] = useState(false);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (kecamatan && KECAMATAN_COORDINATES[kecamatan]) {
      return KECAMATAN_COORDINATES[kecamatan];
    }
    return [-0.5021, 117.1536]; // Default Samarinda Center
  }, [kecamatan]);

  const activePosition = useMemo<[number, number] | null>(() => {
    if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
      return [latitude, longitude];
    }
    return null;
  }, [latitude, longitude]);

  const mapCenter = activePosition || defaultCenter;

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker) {
          const pos = marker.getLatLng();
          onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        }
      },
    }),
    [onChange]
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi GPS');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6))
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Gagal ambil GPS:', err);
        alert('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-[15px]">touch_app</span>
          Klik di peta atau geser pin marker:
        </span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[11px] border border-outline-variant/30 transition-all disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[14px] ${
              isLocating ? 'animate-spin' : ''
            }`}
          >
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
          {isLocating ? 'Mencari...' : 'Gunakan GPS'}
        </button>
      </div>

      <div
        style={{ height }}
        className="w-full relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-inner z-0"
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapRecenter center={mapCenter} />
          <MapClickHandler onPick={onChange} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {activePosition && (
            <Marker
              position={activePosition}
              icon={pickerPinIcon}
              draggable={true}
              eventHandlers={markerEventHandlers}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-[10px] font-mono text-on-surface flex items-center justify-between shadow-xs">
            <span>
              {activePosition ? (
                <>
                  <span className="font-bold text-primary">Koordinat:</span>{' '}
                  {activePosition[0].toFixed(6)}, {activePosition[1].toFixed(6)}
                </>
              ) : (
                <span className="text-on-surface-variant italic font-sans">
                  Belum ada titik dipilih. Klik peta untuk menentukan titik TPS.
                </span>
              )}
            </span>
            {activePosition && (
              <span className="text-secondary font-bold font-sans">✓ Terpilih</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
