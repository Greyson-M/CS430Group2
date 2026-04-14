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

import 'leaflet/dist/leaflet.css';

import RecipientView from './views/RecipientView';
import DistributorView from './views/DistributorView';
import Login from './views/Login';
import Signup from './views/Signup';
import SettingsPage from './views/SettingsPage';
import RegisterResource from './views/RegisterResource';
import LaunchScanner from './views/LaunchScanner';
import QueueView from './views/QueueView';

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

//Mock user location for distance calculations
const userLat = 50;
const userLng = 50;

export default function App() {
  const [role, setRole] = useState('recipient'); // 'recipient' or 'distributor'
  const [language, setLanguage] = useState('English');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // For demo purposes, we start as authenticated
  const [showSignup, setShowSignup] = useState(false);
  const [activePage, setActivePage] = useState({ page: 'home' }); // 'home', 'settings', 'account', 'registerResource'//////////////////
  const [showMenu, setShowMenu] = useState(false);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState('');

  const filteredResources = [...MOCK_RESOURCES].sort((a, b) => {
    if (filterType === 'Distance') {
      const distA = Math.sqrt(
        Math.pow(a.lat - userLat, 2) + Math.pow(a.lng - userLng, 2)
      );

      const distB = Math.sqrt(
        Math.pow(b.lat - userLat, 2) + Math.pow(b.lng - userLng, 2)
      );

      return distA - distB;
    }

    if (filterType === 'Name') {
      return a.name.localeCompare(b.name);
    }

    return 0;
});

  const [apiStatus, setApiStatus] = useState('checking'); // 'online', 'offline', 'checking'
  const [tokenStatus, setTokenStatus] = useState('none');  // 'valid', 'invalid', 'none', 'checking'
  const [lastChecked, setLastChecked] = useState(null);   // Timestamp of last status check

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userType = localStorage.getItem("userType");
    if (token && userType) {
      setIsAuthenticated(true);
      setRole(userType === "vendors" ? "distributor" : "recipient");
    }
  }, []);

  // Handle login - receives user_type from Login component
  const handleLogin = (userType) => {
    setIsAuthenticated(true);
    setRole(userType === "vendors" ? "distributor" : "recipient");
    setTokenStatus('valid');
    setLastChecked(new Date());
  };

  // Handle logout - clear storage
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
    setRole(null);
    setTokenStatus('none');
    setLastChecked(new Date());
  };

  useEffect(() => {
    const checkStatus = async () => {
      // Check API connectivity
      try {
        const res = await fetch('http://localhost:5000/api/time');
        if (res.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch {
        setApiStatus('offline');
      }

      // Check token validity
      const token = localStorage.getItem('authToken');
      if (!token) {
        setTokenStatus('none');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/validate-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          setTokenStatus('valid');
        } else {
          setTokenStatus('invalid');
          // Token is expired/invalid — log the user out
          localStorage.removeItem('authToken');
          localStorage.removeItem('userType');
          setIsAuthenticated(false);
          setRole(null);
        }
      } catch {
        setTokenStatus('invalid');
      }
      setLastChecked(new Date());
  };

  checkStatus();
  const interval = setInterval(checkStatus, 30000); // Re-check every 30 seconds
  return () => clearInterval(interval);
  }, []);

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
  {isAuthenticated && (
    <>
      <div className="h-8 w-px bg-slate-200 mx-1"></div>

      {/* Mode Toggle */}
      <button 
        onClick={() => setRole(role === 'recipient' ? 'distributor' : 'recipient')}
        className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors"
      >
        Mode: {role === 'recipient' ? 'Recipient' : 'Distributor'}
      </button>

      {/* User Dropdown */}
      <div className="relative">
        {/* Profile Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm text-slate-600 hover:bg-slate-200 transition cursor-pointer"
        >
          <User size={16} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
            
            <button
              onClick={() => {
                setActivePage({ page: "home" });
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
            >
              Home
            </button>

            <button
              onClick={() => {
                setActivePage({ page: "settings" });
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
            >
              Settings
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setActivePage({ page: "home" });
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )}
</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
      {isAuthenticated && activePage.page !== 'settings' && (
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                size={18} 
              />
              <input 
                type="text" 
                placeholder="Find resources, collection points, or source hubs..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Filter size={18} /> Advanced
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  
                  <button
                    onClick={() => {
                      setFilterType('Name');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                  >
                    Filter by Name
                  </button>

                  <button
                    onClick={() => {
                      setFilterType('Distance');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                  >
                    Filter by Distance
                  </button>

                  <div className="border-t border-slate-200" />

                  <button
                    onClick={() => {
                      setFilterType('');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm text-red-500"
                  >
                    Clear Filter
                  </button>

                </div>
              )}
            </div>
          </div>
    )}

    {filterType && (
      <div className="mb-4 text-xs text-slate-500">
        Active Filter: <span className="font-semibold">{filterType}</span>
      </div>
    )}

{!isAuthenticated ? (
  showSignup ? (
    <Signup 
      onSignup={() => handleLogin("wanters")} // or pass user_type from Signup too
      onSwitchToLogin={() => setShowSignup(false)}
    />
  ) : (
    <Login 
      onLogin={handleLogin}
      onSwitchToSignup={() => setShowSignup(true)}
    />
  )
) : activePage.page === 'settings' ? (
  <SettingsPage 
    setActivePage={setActivePage}
    language={language}
    setLanguage={setLanguage}
  />
) : activePage.page === 'registerResource' ? (
  <RegisterResource setActivePage={setActivePage} />
) : activePage.page === 'launchScanner' ? (
  <LaunchScanner onBack={() => setActivePage({ page: 'home' })} />
) : activePage.page === 'queue' ? (
  <QueueView 
    resource={activePage.resource}
    onBack={() => setActivePage({ page: 'home' })}
  />
) : (
  role === 'recipient' ? (
    <RecipientView 
      resources={filteredResources} 
      tickets={MOCK_TICKETS} 
      receipts={MOCK_RECEIPTS} 
    />
  ) : (
    <DistributorView 
      resources={filteredResources} 
      setActivePage={setActivePage}
    />
  )
)}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
      <div className="inline-flex items-center gap-4">
        {/* API Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
          apiStatus === 'online'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : apiStatus === 'offline'
            ? 'bg-red-50 text-red-600 border-red-100'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            apiStatus === 'online' ? 'bg-emerald-500 animate-pulse'
            : apiStatus === 'offline' ? 'bg-red-500'
            : 'bg-slate-400 animate-pulse'
          }`}></div>
          API: {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Disconnected' : 'Checking...'}
        </div>

        {/* Token Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
          tokenStatus === 'valid'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : tokenStatus === 'invalid'
            ? 'bg-red-50 text-red-600 border-red-100'
            : tokenStatus === 'none'
            ? 'bg-slate-50 text-slate-500 border-slate-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            tokenStatus === 'valid' ? 'bg-emerald-500'
            : tokenStatus === 'invalid' ? 'bg-red-500'
            : 'bg-slate-400'
          }`}></div>
          Session: {tokenStatus === 'valid' ? 'Authenticated' : tokenStatus === 'invalid' ? 'Expired' : tokenStatus === 'none' ? 'Not Logged In' : 'Checking...'}
        </div>
        {lastChecked && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </footer>
    </div>
  );
}