'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

export interface TpsItem {
  id: string;
  nama: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  bangunan: string | null;
  mobilitas: string | null;
  jumlah_bak: number | null;
  jenis: string | null;
  jam_buka: string | null;
  jam_tutup: string | null;
}

const tpsIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center cursor-pointer drop-shadow-md hover:scale-110 transition-transform">
      <div class="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center border-2 border-white shadow-md z-10">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </div>
      <div class="absolute w-2.5 h-2.5 bg-tertiary-container rotate-45 -bottom-1 z-0 shadow-sm border border-white"></div>
    </div>
  `,
  className: 'custom-leaflet-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const nearestIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center cursor-pointer drop-shadow-lg">
      <div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-white shadow-lg z-10 animate-bounce">
        <span class="material-symbols-outlined text-[20px]">delete</span>
      </div>
      <div class="absolute w-3 h-3 bg-primary rotate-45 -bottom-1 z-0 shadow-sm border border-white"></div>
    </div>
  `,
  className: 'custom-leaflet-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const userIcon = L.divIcon({
  html: `<div class="w-5 h-5 rounded-full bg-error border-[3px] border-white shadow-lg"></div>`,
  className: 'custom-leaflet-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface TpsMapProps {
  tpsList: TpsItem[];
  userLocation?: [number, number] | null;
  nearestTpsId?: string | null;
  center?: [number, number];
}

export default function TpsMap({
  tpsList,
  userLocation,
  nearestTpsId,
  center = [-0.5021, 117.1536],
}: TpsMapProps) {
  const mapCenter = userLocation || center;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl overflow-hidden shadow-inner"
      >
        <MapRecenter center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        {tpsList.map((tps) => (
          <Marker
            key={tps.id}
            position={[tps.latitude, tps.longitude]}
            icon={tps.id === nearestTpsId ? nearestIcon : tpsIcon}
          >
            <Popup>
              <div className="p-1 min-w-[180px] font-sans">
                <h4 className="font-semibold text-sm text-on-surface mb-1">{tps.nama}</h4>
                <p className="text-xs text-on-surface-variant mb-1">{tps.kecamatan}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tps.bangunan && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                      {tps.bangunan}
                    </span>
                  )}
                  {tps.mobilitas && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                      {tps.mobilitas}
                    </span>
                  )}
                </div>
                {(tps.jam_buka || tps.jam_tutup) && (
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Jam Operasional: {tps.jam_buka || '-'} - {tps.jam_tutup || '-'}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}