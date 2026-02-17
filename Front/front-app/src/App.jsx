// src/App.js
import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Package, 
  Ticket as TicketIcon, 
  Receipt, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Globe, 
  User, 
  ShieldCheck,
  History,
  Eye,
  EyeOff,
  Filter,
  Maximize2,
  Map as MapIcon,
  Navigation,
  Info,
  MapPin
} from 'lucide-react';

// --- Mock Data ---
const MOCK_RESOURCES = [
  { id: 'r1', name: 'Fresh Water Supply', provider: 'Municipal Services', total: 500, remaining: 120, status: 'Public', unit: 'Liters', lat: 40, lng: 30 },
  { id: 'r2', name: 'Emergency Food Kits', provider: 'Community Pantry', total: 200, remaining: 45, status: 'Public', unit: 'Kits', lat: 60, lng: 70 },
  { id: 'r3', name: 'Sanitation Supplies', provider: 'City Health', total: 100, remaining: 10, status: 'Private', unit: 'Packs', lat: 25, lng: 55 },
  { id: 'r4', name: 'Medical First Aid', provider: 'Red Cross', total: 50, remaining: 15, status: 'Public', unit: 'Kits', lat: 75, lng: 25 },
];

const MOCK_TICKETS = [
  { id: 't1', resourceId: 'r1', resourceName: 'Fresh Water Supply', quantity: 10, status: 'Valid', expiry: '2023-11-25', code: 'WTR-992-AX', lat: 40, lng: 30 },
  { id: 't2', resourceId: 'r2', resourceName: 'Emergency Food Kits', quantity: 1, status: 'Valid', expiry: '2023-11-24', code: 'FOD-112-BK', lat: 60, lng: 70 },
];

const MOCK_RECEIPTS = [
  { id: 'rc1', resourceName: 'Fresh Water Supply', quantity: 5, date: '2023-10-15', provider: 'Municipal Services' },
  { id: 'rc2', resourceName: 'Winter Blankets', quantity: 2, date: '2023-09-02', provider: 'Red Cross' },
];

// --- Shared UI Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "emerald" }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

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

// --- Map Component ---

const MapView = ({ resources, tickets }) => {
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

// --- View: Recipient ---

const RecipientView = ({ tickets, resources, receipts }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
        {[
          { id: 'browse', label: 'Explore Resources', icon: Search },
          { id: 'map', label: 'Map View', icon: MapIcon },
          { id: 'my-tickets', label: 'My Tickets', icon: TicketIcon },
          { id: 'history', label: 'Receipts', icon: History }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'map' && <MapView resources={resources} tickets={tickets} />}

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.filter(r => r.status === 'Public').map(resource => (
            <Card key={resource.id}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Package size={24} />
                  </div>
                  <Badge color={resource.remaining > 20 ? "emerald" : "amber"}>
                    {resource.remaining} {resource.unit} available
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{resource.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{resource.provider}</p>
                <button className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Plus size={18} /> Request Ticket
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'my-tickets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="border-l-4 border-l-emerald-600">
              <div className="p-5 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800">{ticket.resourceName}</h3>
                  <p className="text-sm text-slate-500">Qty: {ticket.quantity} • Valid until: {ticket.expiry}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs flex items-center gap-1 text-slate-500 hover:text-emerald-600">
                      <ArrowRightLeft size={14} /> Transfer Ticket
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <QrCode size={32} className="text-slate-800" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Resource</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Source</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Qty Received</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map(receipt => (
                  <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{receipt.resourceName}</td>
                    <td className="px-6 py-4 text-slate-500">{receipt.provider}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{receipt.quantity}</td>
                    <td className="px-6 py-4 text-slate-500">{receipt.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-600 hover:underline">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-xs w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">{selectedTicket.resourceName}</h2>
            <p className="text-slate-500 text-sm mb-6">Present for distributor verification</p>
            <div className="bg-slate-100 p-4 rounded-2xl mb-6 aspect-square flex items-center justify-center">
              <QrCode size={180} />
            </div>
            <div className="font-mono text-sm tracking-widest bg-slate-50 p-2 rounded mb-6 text-slate-700">
              {selectedTicket.code}
            </div>
            <button 
              onClick={() => setSelectedTicket(null)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium"
            >
              Done
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- View: Distributor ---

const DistributorView = ({ resources }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-slate-800">Supply Distribution Hub</h2>
          <p className="text-slate-500">Coordinate tickets and community supply levels.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-200/50">
          <Plus size={20} /> Register Resource
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {resources.map(res => (
          <Card key={res.id}>
            <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-800">{res.name}</h3>
                  {res.status === 'Public' ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-slate-400" />}
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>Resource Code: {res.id}</span>
                  <span>Visibility: {res.status}</span>
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>FULFILLED: {res.total - res.remaining}</span>
                  <span>STOCK: {res.remaining}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(res.remaining / res.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Manage Tickets">
                  <TicketIcon size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Audit Log">
                  <History size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Security Settings">
                  <ShieldCheck size={20} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Verification Station</h3>
            <p className="text-slate-400 max-w-md">Process recipient arrivals. Scan digital tickets to authorize resource release and generate secure receipts.</p>
          </div>
          <button className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-400 transition-all transform hover:scale-105">
            <Maximize2 size={24} /> Launch Scanner
          </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [role, setRole] = useState('recipient'); // 'recipient' or 'distributor'
  const [language, setLanguage] = useState('English');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <TicketIcon className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">Rationing Manager</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600">
              <Globe size={14} />
              <select 
                className="bg-transparent border-none focus:ring-0 cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setRole(role === 'recipient' ? 'distributor' : 'recipient')}
              className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Mode: {role === 'recipient' ? 'Recipient' : 'Distributor'}
            </button>
            
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Find resources, collection points, or source hubs..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="px-4 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={18} /> Advanced
          </button>
        </div>

        {role === 'recipient' ? (
          <RecipientView resources={MOCK_RESOURCES} tickets={MOCK_TICKETS} receipts={MOCK_RECEIPTS} />
        ) : (
          <DistributorView resources={MOCK_RESOURCES} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Status: Operational | Verified Local Sync
        </div>
      </footer>
    </div>
  );
}