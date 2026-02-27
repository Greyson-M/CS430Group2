import React, { useState } from 'react';
import { QrCode, Plus, Navigation, MapPin } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';

const MapMarker = ({ x, y, type, onClick, active }) => {
  const color = type === 'pickup' ? '#059669' : '#10B981';
  return (
    <g 
      className="cursor-pointer transition-transform hover:scale-125" 
      onClick={onClick}
      style={{ transformOrigin: `${x}% ${y}%` }}
    >
      <circle 
        cx={`${x}%`} 
        cy={`${y}%`} 
        r={active ? "12" : "8"} 
        fill={color} 
        className={active ? "animate-pulse" : ""}
        stroke="white" 
        strokeWidth="2" 
      />
      {type === 'pickup' && (
        <path 
          d={`M ${x-2} ${y-2} L ${x+2} ${y+2} M ${x+2} ${y-2} L ${x-2} ${y+2}`} 
          stroke="white" 
          strokeWidth="1" 
        />
      )}
    </g>
  );
};
export default function MapView ({ resources, tickets }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const markers = [
    ...resources.filter(r => r.status === 'Public' && r.remaining > 0).map(r => ({ ...r, type: 'available' })),
    ...tickets.map(t => ({ ...t, type: 'pickup', name: t.resourceName }))
  ];

  return (
    <Card className="h-[600px] flex flex-col md:flex-row">
      <div className="flex-1 bg-slate-200 relative overflow-hidden">
        <svg className="w-full h-full bg-slate-300" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,20 Q30,10 50,40 T100,30 L100,100 L0,100 Z" fill="#cbd5e1" />
          <path d="M20,100 Q40,60 70,80 T100,50" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          
          {markers.map((m, idx) => (
            <MapMarker 
              key={idx} 
              x={m.lng} 
              y={m.lat} 
              type={m.type} 
              active={selectedPoint?.name === m.name}
              onClick={() => setSelectedPoint(m)} 
            />
          ))}
        </svg>

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span>Designated Pickup Sites</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span>Available Resources</span>
          </div>
        </div>
      </div>

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
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Distance</span>
                <span className="font-medium">0.8 miles</span>
              </div>
              {selectedPoint.remaining !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Inventory</span>
                  <span className="font-medium text-emerald-600">{selectedPoint.remaining} {selectedPoint.unit}</span>
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
                <> <QrCode size={18} /> Access Ticket </>
              ) : (
                <> <Plus size={18} /> Request Access </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <MapPin size={48} className="mb-4 opacity-20" />
            <p className="text-sm px-4">Select a distribution point on the map to view collection details.</p>
          </div>
        )}
      </div>
    </Card>
  );
};