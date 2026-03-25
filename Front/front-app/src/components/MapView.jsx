// MapView.jsx
import React, { useState } from 'react';
import { QrCode, Plus, Navigation, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Card from './Card';
import Badge from './Badge';

// Fix Leaflet default icon for ESM
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

//Fixes the default marker for all <Marker>s using L.Icon.Default
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Creates a reusable default marker that you can pass to individual <Marker> components
const defaultIcon = new L.Icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({ reliefCenters = [], tickets = [] }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Combine relief centers and ticket pickups for dynamic markers
  const markers = [
    ...reliefCenters.map(c => ({ ...c, type: 'available' })),
    ...tickets.map(t => ({ ...t, type: 'pickup', name: t.resourceName })),
  ];

  return (
    <Card className="h-[600px] flex flex-col md:flex-row">
      {/* Map Section */}
      <div className="relative h-[600px] w-full">
        <MapContainer
          center={[39.6295, -79.9559]} // Morgantown center
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          {/* WVU mountain / topo tile layer */}
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          />

          {/* Dynamic markers */}
          {markers.map((m, idx) => (
            <Marker
              key={idx}
              position={[m.lat, m.lng]}
              icon={defaultIcon}
              eventHandlers={{ click: () => setSelectedPoint(m) }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong>{m.name}</strong>
                  <div>{m.type === 'pickup' ? 'Authorized Ticket Pickup' : 'Relief Center'}</div>
                  {m.address && <div>{m.address}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span>Pickup Sites (Tickets)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span>Relief Centers (Public)</span>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full md:w-80 border-l border-slate-200 p-6 flex flex-col">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Navigation size={20} className="text-emerald-600" />
          Site Information
        </h3>

        {selectedPoint ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <Badge color={selectedPoint.type === 'pickup' ? 'emerald' : 'slate'}>
                {selectedPoint.type === 'pickup' ? 'Authorized Ticket' : 'Public Access'}
              </Badge>
              <h4 className="text-xl font-bold mt-2 text-slate-900">{selectedPoint.name}</h4>
              <p className="text-sm text-slate-500">{selectedPoint.provider || 'Verified Location'}</p>
              {selectedPoint.address && (
                <p className="text-sm text-slate-500">Address: {selectedPoint.address}</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              {selectedPoint.remaining !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Inventory</span>
                  <span className="font-medium text-emerald-600">
                    {selectedPoint.remaining} {selectedPoint.unit}
                  </span>
                </div>
              )}
              {selectedPoint.expiry && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Valid Until</span>
                  <span className="font-medium text-rose-600">{selectedPoint.expiry}</span>
                </div>
              )}
            </div>

            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
              {selectedPoint.type === 'pickup' ? (
                <>
                  <QrCode size={18} /> Access Ticket
                </>
              ) : (
                <>
                  <Plus size={18} /> Request Access
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <MapPin size={48} className="mb-4 opacity-20" />
            <p className="text-sm px-4">
              Select a location on the map to view collection details.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}