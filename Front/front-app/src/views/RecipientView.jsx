import React, { useState } from 'react';
import {
  Search,
  Ticket as TicketIcon,
  History,
  ArrowRightLeft,
  QrCode,
  Package,
  Plus
} from 'lucide-react';

import { Map as MapIcon } from 'lucide-react';

import Card from '../components/Card';
import Badge from '../components/Badge';
import MapView from '../components/MapView';

export default function RecipientView({ tickets, resources, receipts }) {
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