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

import RecipientView from './views/RecipientView';
import DistributorView from './views/DistributorView';
import Login from './views/Login';
import Signup from './views/Signup';

import Card from './components/Card';
import Badge from './components/Badge';
import MapView from './components/MapView';

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

export default function App() {
  //////////////////////////
  //This is just here to demonstrate the API connection. You can remove it later.
  //This is generally how we will fetch data from the backend
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    fetch('/api/time').then(res => res.json()).then(data => setCurrentTime(data.time));
  }, []);

  console.log(currentTime); // For debugging: check if time is being fetched correctly
///////////////////////////


  const [role, setRole] = useState('recipient'); // 'recipient' or 'distributor'
  const [language, setLanguage] = useState('English');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <p>Current Time: {new Date(currentTime * 1000).toLocaleString()}, <b>This is just here for demonstration purposes.</b></p>  
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