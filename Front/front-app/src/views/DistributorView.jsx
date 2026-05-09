import React, { useState, useEffect } from 'react';
import { Plus, Ticket as TicketIcon, Trash2, Eye, EyeOff, Maximize2 } from 'lucide-react';
import Card from '../components/Card';

export default function DistributorView({ setActivePage }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch the items and ticket batches for the logged-in vendor
  useEffect(() => {
    const fetchVendorData = async () => {
      const vendorId = localStorage.getItem('userId');
      if (!vendorId) {
        setError('No user logged in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch items owned by this vendor
        const itemsRes = await fetch(`/api/items?vendor_id=${vendorId}`);
        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        const items = await itemsRes.json();

        // 2. Fetch ticket batches owned by this vendor
        const ticketsRes = await fetch(`/api/tickets?vendor_id=${vendorId}`);
        if (!ticketsRes.ok) throw new Error("Failed to fetch tickets");
        const tickets = await ticketsRes.json();

        // 3. Only render this vendor's own ticket batches, paired with their matching item.
        const ownedItems = items.filter(item => item.vendor_id === vendorId);
        const ownedTickets = tickets.filter(ticket => ticket.vendor_id === vendorId);

        const mergedResources = ownedTickets
          .map(batch => {
            const item = ownedItems.find(candidate => candidate._id === batch.item_id);

            if (!item) {
              console.warn('DistributorView: skipping batch without a matching owned item.', {
                vendorId,
                batchId: batch._id,
                itemId: batch.item_id
              });
              return null;
            }

            return {
              id: item._id,
              name: item.name,
              provider: item.fields?.provider || "N/A",
              status: item.fields?.status || "Public",
              total: batch.total_qty,
              remaining: batch.available_qty,
              unit: item.fields?.unit || "Units",
              ticketBatchId: batch._id,
              recipientExpirations: batch.recipient_expirations || {}
            };
          })
          .filter(Boolean);

        setResources(mergedResources);
      } catch (err) {
        console.error("Distributor fetch error:", err);
        setError("Could not load vendor resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  const handleDeleteResource = async (resourceId, resourceName) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    const confirmed = window.confirm(`Delete "${resourceName}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(resourceId);
      setError(null);

      const res = await fetch(`/api/items/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete resource.');
      }

      setResources(prev => prev.filter(resource => resource.id !== resourceId));
    } catch (err) {
      console.error('Delete resource error:', err);
      setError(err.message || 'Could not delete resource.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-slate-800">Supply Distribution Hub</h2>
          <p className="text-slate-500">Coordinate tickets and community supply levels.</p>
        </div>
        <button onClick={() => setActivePage({ page: 'registerResource' })} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-200/50">
          <Plus size={20} /> Register Resource
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center animate-pulse">Loading supplies...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>
      ) : resources.length === 0 ? (
        <div className="text-slate-500 py-8 text-center bg-slate-100 rounded-xl">
          You haven't registered any resources yet. Click "Register Resource" to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {resources.map(res => (
            <Card key={res.ticketBatchId || res.id}>
              <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{res.name}</h3>
                    {res.status === 'Public' ? <Eye size={16} className="text-emerald-500" title="Public" /> : <EyeOff size={16} className="text-slate-400" title="Private" />}
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>Resource ID: {res.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>FULFILLED: {res.total - res.remaining}</span>
                    <span>STOCK: {res.remaining}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${res.remaining > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: `${res.total > 0 ? (res.remaining / res.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setActivePage({ page: 'queue', resource: res })}
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-lg hover:bg-emerald-50" 
                    title="View Queue (Coming soon)"
                  >
                    <TicketIcon size={20} />
                  </button>

                  <button
                    onClick={() => handleDeleteResource(res.id, res.name)}
                    disabled={deletingId === res.id}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 rounded-lg hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Resource"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Station Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden mt-8">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Verification Station</h3>
            <p className="text-slate-400 max-w-md">Process recipient arrivals. Scan digital tickets to authorize resource release and generate secure receipts.</p>
          </div>
          <button onClick={() => setActivePage({ page: 'launchScanner' })} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-400 transition-all transform hover:scale-105 whitespace-nowrap">
            <Maximize2 size={24} /> Launch Scanner
          </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
}