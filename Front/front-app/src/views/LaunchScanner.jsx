import React, { useState, useEffect } from 'react';
import { QrCode, Camera, Upload, ArrowLeft, Wifi, WifiOff, Send, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

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
  
  // State for the verification popup
  const [pendingScan, setPendingScan] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Persist ledger to localStorage whenever it changes
  useEffect(() => {
    saveLedger(ledger);
  }, [ledger]);

  // Hook for initializing the HTML5 QR Code Scanner
  useEffect(() => {
    let scanner = null;

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Temporarily pause or just handle the scan
          handleScanInput(decodedText);
          // Stop scanning to view the popup securely
          setScanning(false);
        },
        (error) => {
          // Ignored. Scanners constantly throw errors when nothing is found.
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner clear error", err));
      }
    };
  }, [scanning]);

  // Handle manual file upload 
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("reader"); // using the same div element id, even if empty
      // File based scanning
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanInput(decodedText);
    } catch (err) {
      alert("No QR code found in this image or processing failed.");
      console.log("File scan error", err);
    }
  };

  // Intercept the scan, decode the JWT, and trigger the popup
  const handleScanInput = (qrPayload) => {
    if (!qrPayload || !qrPayload.trim()) return;
    try {
      // Decode the JWT payload locally
      const decodedPayload = jwtDecode(qrPayload.trim());
      
      // Check if it's already in the local ledger to warn of duplicate
      const isDuplicate = ledger.some(item => item.qr_payload === qrPayload.trim());
      
      // Check if ticket is expired
      const isExpired = (decodedPayload.exp * 1000) < Date.now();

      // Check if the ticket belongs to the current vendor scanning it
      const currentUserId = localStorage.getItem('userId');
      const isWrongVendor = decodedPayload.vendor_id && decodedPayload.vendor_id !== currentUserId;

      setPendingScan({
        rawPayload: qrPayload.trim(),
        decoded: decodedPayload,
        isDuplicate,
        isExpired,
        isWrongVendor // <-- Pass this new flag to the UI
      });
      setManualInput('');
    } catch (err) {
      alert("Invalid Ticket Format! This QR code does not contain a valid JWT.");
    }
  };

  // Add the verified ticket to the offline ledger
  const confirmAndAddtoLedger = () => {
    if (!pendingScan) return;
    
    const entry = {
      qr_payload: pendingScan.rawPayload,
      scanned_at: new Date().toISOString(),
      action: 'ACCEPT' 
    };
    
    setLedger(prev => [...prev, entry]);
    setPendingScan(null); // close popup
  };
  // Add the denied ticket to the offline ledger
  const denyAndAddtoLedger = () => {
    if (!pendingScan) return;
    const entry = {
      qr_payload: pendingScan.rawPayload,
      scanned_at: new Date().toISOString(),
      action: 'DENY'
    };
    setLedger(prev => [...prev, entry]);
    setPendingScan(null); 
  };

  // Cancel the scan
  const cancelScan = () => {
    setPendingScan(null);
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
    <div className="min-h-screen bg-slate-50 p-6 relative">
      
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
        <div id="reader" className="w-full rounded-xl overflow-hidden mb-6 bg-slate-100 min-h-[300px] flex items-center justify-center relative">
          {!scanning && (
            <p className="text-slate-400 absolute">Click "Start Scanner" to use camera</p>
          )}
        </div>

        {/* Scanner Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setScanning(!scanning)}
            className={`flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl transition-colors ${scanning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <Camera size={18} />
            {scanning ? "Stop Scanner" : "Start Scanner"}
          </button>

          <label
            className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300 cursor-pointer"
          >
            <Upload size={18} />
            Upload QR Code
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Manual QR Input */}
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
              onClick={() => handleScanInput(manualInput)}
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Scan
            </button>
          </div>
        </div>
      </div>

      {/* Offline Ledger Card and rest of the UI continues unchanged... */}
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
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${entry.action === 'DENY' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {entry.action === 'DENY' ? 'DENIED' : 'ACCEPTED'}
                  </span>
                  <div>
                    <p className="text-slate-700 font-mono text-xs truncate">{entry.qr_payload}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Scanned: {new Date(entry.scanned_at).toLocaleString()}</p>
                  </div>
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
        <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wifi size={18} className="text-emerald-500" />
            Sync Report
          </h2>

          {/* Details mapped identically... */}
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
        </div>
      )}

      {/* POPUP OVERLAY */}
      {pendingScan && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Scanned Ticket</h3>
                <div className="flex gap-2">
                  {pendingScan.isExpired && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1 border border-red-200">
                      <XCircle size={14} /> EXPIRED
                    </span>
                  )}
                  {pendingScan.isDuplicate && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1">
                      <AlertTriangle size={14} /> Duplicate Alert
                    </span>
                  )}
                  {!pendingScan.isDuplicate && !pendingScan.isExpired && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1">
                      <CheckCircle2 size={14} /> Valid Scan
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl space-y-4 mb-6 border border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Item Name</p>
                  <p className="text-xl font-bold text-slate-800">
                    {pendingScan.decoded.item_name || "Unknown Item (Old Code)"}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Quantity</p>
                    <div className="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded inline-block mt-1">
                      1 Unit
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ref Code</p>
                    <p className="text-sm font-mono font-bold text-slate-700 bg-slate-200 p-1.5 rounded inline-block mt-1 uppercase">
                      #{pendingScan.decoded.ticket_id?.slice(-6) || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valid Until</p>
                  <p className={`text-sm font-medium ${pendingScan.isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                    {new Date(pendingScan.decoded.exp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={confirmAndAddtoLedger}
                  disabled={pendingScan.isExpired || pendingScan.isWrongVendor}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-white transition-colors ${
                    pendingScan.isExpired || pendingScan.isWrongVendor
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {pendingScan.isExpired || pendingScan.isWrongVendor ? 'Cannot Accept' : 'Accept Ticket'}
                </button>
              </div>

              <div className="flex gap-3 mt-1">
                <button 
                  onClick={cancelScan}
                  className="flex-none px-4 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={denyAndAddtoLedger}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white transition-colors bg-red-600 hover:bg-red-700"
                >
                  Deny Ticket
                </button>
              </div>

              <div className="flex gap-2">
                  {pendingScan.isExpired && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1 border border-red-200">
                      <XCircle size={14} /> EXPIRED
                    </span>
                  )}
                  {pendingScan.isWrongVendor && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1 border border-red-200">
                      <XCircle size={14} /> WRONG VENDOR
                    </span>
                  )}
                  {pendingScan.isDuplicate && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1">
                      <AlertTriangle size={14} /> Duplicate Alert
                    </span>
                  )}
                  {!pendingScan.isDuplicate && !pendingScan.isExpired && !pendingScan.isWrongVendor && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1">
                      <CheckCircle2 size={14} /> Valid Scan
                    </span>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
