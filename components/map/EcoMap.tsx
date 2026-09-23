'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ReportItem } from '@/lib/mock-data';

// Custom Map Marker Icons using Leaflet divIcon
const createCustomMarker = (status: ReportItem['status'], urgensi: ReportItem['urgensi']) => {
  let colorClass = 'bg-primary text-on-primary';
  let iconName = 'check_circle';

  if (status === 'Menunggu') {
    if (urgensi === 'Kritis') {
      colorClass = 'bg-error text-on-error';
      iconName = 'warning';
    } else {
      colorClass = 'bg-tertiary-container text-on-tertiary-container';
      iconName = 'delete';
    }
  } else if (status === 'Armada Dikirim') {
    colorClass = 'bg-secondary text-on-secondary';
    iconName = 'local_shipping';
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer drop-shadow-md hover:scale-110 transition-transform">
      <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center border-2 border-white shadow-md z-10">
        <span class="material-symbols-outlined text-[18px]">${iconName}</span>
      </div>
      <div class="absolute w-3 h-3 ${colorClass} rotate-45 -bottom-1 z-0 shadow-sm border border-white"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface EcoMapProps {
  reports: ReportItem[];
  center?: [number, number];
  onReportSelect?: (report: ReportItem) => void;
  showHeatmap?: boolean;
}

export default function EcoMap({
  reports,
  center = [-0.5021, 117.1536], // Default Samarinda Center
  onReportSelect,
}: EcoMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCenter: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(newCenter);
        },
        () => {
          // Fallback to Samarinda center
          setMapCenter([-0.5021, 117.1536]);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl overflow-hidden shadow-inner"
      >
        <MapRecenter center={mapCenter} />
        {/* Clean OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCustomMarker(report.status, report.urgensi)}
            eventHandlers={{
              click: () => onReportSelect?.(report),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px] font-sans">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      report.urgensi === 'Kritis'
                        ? 'bg-error-container text-on-error-container'
                        : report.urgensi === 'Sedang'
                        ? 'bg-tertiary-container text-on-tertiary-container'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {report.urgensi}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {report.kecamatan}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-on-surface mb-1 line-clamp-1">
                  {report.title}
                </h4>
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">
                  {report.description}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                  <span className="text-[11px] font-semibold text-primary">
                    Status: {report.status}
                  </span>
                  <a
                    href={`/laporan/${report.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Detail &rarr;
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating GPS Location Button */}
      <button
        onClick={handleCurrentLocation}
        className="absolute bottom-6 right-6 z-[400] w-12 h-12 bg-surface-container-lowest text-primary rounded-full shadow-lg flex items-center justify-center hover:bg-surface-container-low transition-all active:scale-95 border border-outline-variant/30"
        title="Lokasi Saya"
      >
        <span className="material-symbols-outlined text-[24px]">my_location</span>
      </button>
    </div>
  );
}
