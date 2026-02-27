import React from 'react';
import {
  Plus,
  Ticket as TicketIcon,
  History,
  ShieldCheck,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';

import Card from '../components/Card';

export default function DistributorView({ resources }) {
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