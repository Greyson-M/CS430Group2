import React, { useState, useEffect } from 'react';
import {
  Search,
  Ticket as TicketIcon,
  History,
  ArrowRightLeft,
  QrCode,
  Package,
  Plus,
  Trash2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { Map as MapIcon } from 'lucide-react';

import Card from '../components/Card';
import Badge from '../components/Badge';
import MapView from '../components/MapView';

export default function RecipientView({ receipts }) {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [savedTickets, setSavedTickets] = useState([]);

  // TEMPORARY TEST DATA
  const reliefCenters = [{ name: 'Mountainlair', lat: 39.6358, lng: -79.9547, address: '1550 University Ave, Morgantown, WV 26506' }];
  const testTickets = [];

  useEffect(() => {
    const storedTickets = localStorage.getItem('recipientTickets');
    if (storedTickets) {
      try {
        setSavedTickets(JSON.parse(storedTickets));
      } catch (err) {
        console.error('Failed to parse stored tickets:', err);
      }
    }
  }, []);

  // Sync tickets with backend
  const syncActiveTickets = async () => {
    const token = localStorage.getItem('authToken');
    const localTickets = JSON.parse(localStorage.getItem('recipientTickets')) || [];
    
    if (!token || localTickets.length === 0) return;

    try {
      // Prong 2: Ask backend for all tickets that are still "Pending Redemption"
      const res = await fetch('/api/tickets/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const activeIds = data.active_ticket_ids || [];
        
        // Filter out any locally saved ticket whose ID is NO LONGER in the backend's active list
        const filteredTickets = localTickets.filter(ticket => activeIds.includes(ticket.id));
        
        if (filteredTickets.length !== localTickets.length) {
          setSavedTickets(filteredTickets);
          localStorage.setItem('recipientTickets', JSON.stringify(filteredTickets));
          console.log("Auto-synced: Removed redeemed tickets from local wallet.");
        }
      }
    } catch (err) {
      console.error("Could not sync active tickets. Working offline.");
    }
  };

  // Re-run fetch when user hits "Explore Resources" or "My Tickets"
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchBatches();
    } else if (activeTab === 'my-tickets') {
      syncActiveTickets();
    }
  }, [activeTab]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const batchesRes = await fetch('/api/tickets');
      const batchesData = await batchesRes.json();

      const itemsRes = await fetch('/api/items');
      const itemsData = await itemsRes.json();

      const itemMap = {};
      if (Array.isArray(itemsData)) {
        itemsData.forEach(item => { itemMap[item._id] = item; });
      }

      if (Array.isArray(batchesData)) {
        const mapped = batchesData
          .filter(b => b.available_qty > 0)
          .map(batch => {
            const item = itemMap[batch.item_id] || {};
            return {
              id: batch._id,
              name: item.name || 'Unknown Item',
              provider: item.vendor_id || 'Unknown Vendor',
              remaining: batch.available_qty,
              unit: item.fields?.unit || 'Tickets',
              status: 'Public'
            };
          });
        setAvailableBatches(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTicket = async (batchId, resourceName) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in as a recipient (wanter) to request a ticket.');
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${batchId}/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        const backendItemName = data['item_name: '] || data.item_name || resourceName; 

        const newTicket = {
          id: data.ticket_id || Date.now().toString(),
          resourceId: batchId,
          resourceName: backendItemName || 'Unknown Resource', 
          quantity: 1, 
          status: 'Valid', 
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
          code: data.qr_payload
        };

        const updatedTickets = [...savedTickets, newTicket];
        setSavedTickets(updatedTickets);
        localStorage.setItem('recipientTickets', JSON.stringify(updatedTickets));

        alert('Ticket successfully requested!');
        fetchBatches();
      } else {
        alert('Failed to request ticket: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Network error during request: ', err);
      alert('Network error occurred. Ensure backend is running.');
    }
  };

  // Prong 1 (Offline Mode): Manual Deletion
  const handleRemoveTicket = (ticketId) => {
    if (window.confirm("Are you sure you want to remove this ticket from your wallet? Only do this if you have already redeemed it or you no longer need the item.")) {
      const updatedTickets = savedTickets.filter(t => t.id !== ticketId);
      setSavedTickets(updatedTickets);
      localStorage.setItem('recipientTickets', JSON.stringify(updatedTickets));
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    }
  };

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

      {activeTab === 'map' && (
        <MapView reliefCenters={reliefCenters} tickets={testTickets} />
      )}

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading available resources...</p>
          ) : availableBatches.length > 0 ? (
            availableBatches.map(resource => (
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
                  <p className="text-sm text-slate-500 mb-4 truncate">Source ID: {resource.provider}</p>
                  <button 
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleRequestTicket(resource.id, resource.name)}  
                  >
                    <Plus size={18} /> Request Ticket
                  </button>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-slate-500 text-sm">No resources are currently available.</p>
          )}
        </div>
      )}

      {activeTab === 'my-tickets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {savedTickets.length > 0 ? savedTickets.map(ticket => (
            <Card key={ticket.id} className="border-l-4 border-l-emerald-600 cursor-pointer hover:shadow-lg transition-shadow">
              <div 
                className="p-5 flex justify-between items-center" 
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800">{ticket.resourceName}</h3>
                  <p className="text-sm text-slate-500">Qty: {ticket.quantity} | Valid until: {ticket.expiry}</p>
                </div>
                <button className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <QrCode size={32} className="text-slate-800" />
                </button>
              </div>
              <div className="bg-slate-50 py-3 px-5 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveTicket(ticket.id) }}
                  className="text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} /> Remove Ticket
                </button>
              </div>
            </Card>
          )) : (
            <p className="text-slate-500 text-sm">You haven't requested any tickets yet or they have all been redeemed.</p>
          )}

          {/* Ticket QR Overlay */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  X</button>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedTicket.resourceName}</h3>
                  <p className="text-sm text-slate-500 mb-6">Quantity: {selectedTicket.quantity} Unit</p>
                  
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-100 inline-flex justify-center w-full mb-6">
                    <QRCodeSVG 
                      value={selectedTicket.code}
                      size={320}
                      level="M"
                      marginSize={4}
                      title={`${selectedTicket.resourceName} ticket QR code`}
                      className="h-auto w-full max-w-[320px]"
                    />
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl mb-4 text-left">
                    <p className="text-xs text-slate-500 mb-1">Ticket Reference:</p>
                    <p className="font-mono text-sm break-all font-bold text-slate-700">
                      #{selectedTicket.id?.slice(-8).toUpperCase() || "N/A"}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl mb-4 text-left">
                    <p className="text-xs text-slate-500 mb-1">Raw Ticket JWT (Token):</p>
                    <div className="font-mono text-xs break-all text-slate-700 max-h-24 overflow-y-auto w-full p-2 bg-white rounded border border-slate-200 select-all">
                      {selectedTicket.code}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveTicket(selectedTicket.id)}
                    className="w-full py-2.5 mt-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Mark as Redeemed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History and Receipts code left the same */}
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
    </div>
  );
}