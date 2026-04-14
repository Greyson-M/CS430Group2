import React, { useState, useEffect } from 'react';
import { QrCode, Camera, Upload, ArrowLeft, Wifi, WifiOff, Send, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const LEDGER_KEY = 'offlineLedger';

function loadLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLedger(ledger) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

export default function LaunchScanner({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [ledger, setLedger] = useState(loadLedger);
  const [manualInput, setManualInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Persist ledger to localStorage whenever it changes
  useEffect(() => {
    saveLedger(ledger);
  }, [ledger]);

  // Add a scanned QR payload to the offline ledger
  const addToLedger = (qrPayload) => {
    if (!qrPayload || !qrPayload.trim()) return;
    const entry = {
      qr_payload: qrPayload.trim(),
      scanned_at: new Date().toISOString()
    };
    setLedger(prev => [...prev, entry]);
    setManualInput('');
  };

  // Remove a single entry from the ledger
  const removeFromLedger = (index) => {
    setLedger(prev => prev.filter((_, i) => i !== index));
  };

  // Clear the entire ledger
  const clearLedger = () => {
    setLedger([]);
    setSyncReport(null);
    setSyncError(null);
  };

  // Sync the offline ledger with the backend
  const syncLedger = async () => {
    if (ledger.length === 0) return;
    setSyncing(true);
    setSyncReport(null);
    setSyncError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setSyncError('Not authenticated. Please log in first.');
      setSyncing(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/tickets/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: ledger })
      });

      const data = await res.json();

      if (res.ok) {
        setSyncReport(data);
        // Clear the ledger after successful sync
        setLedger([]);
      } else {
        setSyncError(data.error || 'Sync failed with an unknown error.');
      }
    } catch (err) {
      setSyncError('Network error: Could not reach the server. The ledger is preserved locally.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white shadow hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <QrCode size={24} />
          Verification Station
        </h1>
      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto mb-6">
        
        {/* Scanner Preview */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl h-48 flex items-center justify-center mb-6">
          {scanning ? (
            <p className="text-slate-500">Camera Active...</p>
          ) : (
            <p className="text-slate-400">Camera preview will appear here</p>
          )}
        </div>

        {/* Scanner Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setScanning(!scanning)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
          >
            <Camera size={18} />
            {scanning ? "Stop Scanner" : "Start Scanner"}
          </button>

          <button
            className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300"
          >
            <Upload size={18} />
            Upload QR Code
          </button>
        </div>

        {/* Manual QR Input (for testing / paste from clipboard) */}
        <div className="border-t border-slate-200 pt-4">
          <label className="text-sm font-medium text-slate-600 mb-2 block">Manual QR Payload Entry</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste a signed ticket JWT here..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
            />
            <button
              onClick={() => addToLedger(manualInput)}
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Offline Ledger Card */}
      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <WifiOff size={18} className="text-amber-500" />
            Offline Ledger
            <span className="text-sm font-normal text-slate-500">({ledger.length} transactions)</span>
          </h2>
          <div className="flex gap-2">
            {ledger.length > 0 && (
              <>
                <button
                  onClick={clearLedger}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={14} /> Clear
                </button>
                <button
                  onClick={syncLedger}
                  disabled={syncing}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send size={14} /> {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </>
            )}
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No transactions in the ledger. Scan QR codes to add them.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ledger.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-mono text-xs truncate">{entry.qr_payload}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Scanned: {new Date(entry.scanned_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => removeFromLedger(i)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {syncError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            {syncError}
          </div>
        )}
      </div>

      {/* Sync / Fraud Report Card */}
      {syncReport && (
        <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wifi size={18} className="text-emerald-500" />
            Sync Report
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-800">{syncReport.sync_summary.total_submitted}</p>
              <p className="text-xs text-slate-500">Submitted</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-600">{syncReport.sync_summary.successfully_redeemed}</p>
              <p className="text-xs text-emerald-600">Redeemed</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-600">{syncReport.sync_summary.flagged_count}</p>
              <p className="text-xs text-amber-600">Flagged</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-600">{syncReport.sync_summary.failed_count}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
          </div>

          {/* Flagged Items (Fraud Alerts) */}
          {syncReport.flagged.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={14} /> Fraud Alerts
              </h3>
              <div className="space-y-2">
                {syncReport.flagged.map((item, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs font-bold">{item.reason}</span>
                      <span className="text-slate-500 text-xs">Ticket: {item.ticket_id}</span>
                    </div>
                    <p className="text-amber-700 text-xs">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Items */}
          {syncReport.failed.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                <XCircle size={14} /> Failed Transactions
              </h3>
              <div className="space-y-2">
                {syncReport.failed.map((item, i) => (
                  <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    Entry #{item.index + 1}: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Successfully Processed */}
          {syncReport.processed.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1">
                <CheckCircle2 size={14} /> Successfully Redeemed
              </h3>
              <div className="space-y-2">
                {syncReport.processed.map((item, i) => (
                  <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Ticket {item.ticket_id} - Item: {item.item_id}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">Synced at: {new Date(syncReport.synced_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
