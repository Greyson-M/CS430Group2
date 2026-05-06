import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, Upload, ArrowLeft, Wifi, WifiOff, Send, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import QrScanner from 'qr-scanner';

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

function getErrorMessage(error, fallbackMessage) {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function isNoQrCodeFound(error) {
  const message = getErrorMessage(error, '');
  return message.includes(QrScanner.NO_QR_CODE_FOUND);
}

function normalizeTicketClaims(decodedPayload) {
  return {
    ticketId: decodedPayload.tid ?? decodedPayload.ticket_id ?? null,
    itemId: decodedPayload.iid ?? decodedPayload.item_id ?? null,
    itemName: decodedPayload.nam ?? decodedPayload.item_name ?? null,
    wanterId: decodedPayload.wid ?? decodedPayload.wanter_id ?? null,
    vendorId: decodedPayload.vid ?? decodedPayload.vendor_id ?? null,
    exp: decodedPayload.exp ?? null
  };
}

export default function LaunchScanner({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [ledger, setLedger] = useState(loadLedger);
  const [manualInput, setManualInput] = useState('');
  const [pendingScan, setPendingScan] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const ledgerRef = useRef(ledger);
  const processScannedPayloadRef = useRef(null);

  useEffect(() => {
    ledgerRef.current = ledger;
    saveLedger(ledger);
  }, [ledger]);

  useEffect(() => {
    let cancelled = false;

    QrScanner.hasCamera()
      .then((hasCamera) => {
        if (cancelled) return;
        console.log('[LaunchScanner] Camera availability check completed.', { hasCamera });
        setCameraAvailable(hasCamera);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[LaunchScanner] Failed to check camera availability.', error);
        setCameraAvailable(false);
        setScanError('Could not determine whether a camera is available on this device.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  processScannedPayloadRef.current = (qrPayload, source) => {
    if (!qrPayload || !qrPayload.trim()) {
      console.error('[LaunchScanner] Empty QR payload received.', { source });
      setScanError('The QR scanner returned an empty payload.');
      return;
    }

    const trimmedPayload = qrPayload.trim();

    try {
      const decodedPayload = jwtDecode(trimmedPayload);
      const normalizedClaims = normalizeTicketClaims(decodedPayload);
      const isDuplicate = ledgerRef.current.some((item) => item.qr_payload === trimmedPayload);
      const isExpired = typeof normalizedClaims.exp === 'number'
        ? (normalizedClaims.exp * 1000) < Date.now()
        : true;
      const currentUserId = localStorage.getItem('userId');
      const isWrongVendor = normalizedClaims.vendorId && normalizedClaims.vendorId !== currentUserId;

      console.log('[LaunchScanner] QR payload decoded successfully.', {
        source,
        payloadLength: trimmedPayload.length,
        ticketId: normalizedClaims.ticketId,
        vendorId: normalizedClaims.vendorId,
        isDuplicate,
        isExpired,
        isWrongVendor
      });

      setPendingScan({
        rawPayload: trimmedPayload,
        decoded: normalizedClaims,
        isDuplicate,
        isExpired,
        isWrongVendor
      });
      setManualInput('');
      setScanError(null);
    } catch (error) {
      console.error('[LaunchScanner] QR payload decoded as text but is not a valid signed ticket JWT.', {
        source,
        error,
        payloadLength: trimmedPayload.length
      });
      setScanError('QR code decoded, but the payload is not a valid signed ticket.');
      alert('Invalid Ticket Format! This QR code does not contain a valid JWT.');
    }
  };

  useEffect(() => {
    if (!scanning || !videoRef.current) {
      return undefined;
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        console.log('[LaunchScanner] Camera scan succeeded.', {
          payloadLength: result.data.length,
          cornersDetected: result.cornerPoints.length
        });
        processScannedPayloadRef.current?.(result.data, 'camera');
        setScanning(false);
      },
      {
        preferredCamera: 'environment',
        maxScansPerSecond: 12,
        returnDetailedScanResult: true,
        calculateScanRegion: (video) => ({
          x: 0,
          y: 0,
          width: video.videoWidth,
          height: video.videoHeight
        }),
        onDecodeError: (error) => {
          if (isNoQrCodeFound(error)) {
            return;
          }

          console.error('[LaunchScanner] Camera decode error.', error);
          setScanError(getErrorMessage(error, 'Camera scanner failed to decode the QR code.'));
        }
      }
    );

    scannerRef.current = scanner;
    setScanError(null);
    console.log('[LaunchScanner] Starting camera scanner.');

    scanner.start().then(() => {
      console.log('[LaunchScanner] Camera scanner started successfully.');
    }).catch((error) => {
      console.error('[LaunchScanner] Failed to start camera scanner.', error);
      setScanError(getErrorMessage(error, 'Could not start camera scanner.'));
      setScanning(false);
    });

    return () => {
      console.log('[LaunchScanner] Stopping camera scanner.');
      scanner.stop();
      scanner.destroy();

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const toggleScanner = () => {
    if (scanning) {
      console.log('[LaunchScanner] Stop scanner requested by user.');
      setScanning(false);
      return;
    }

    if (cameraAvailable === false) {
      console.error('[LaunchScanner] Start scanner requested without an available camera.');
      setScanError('No camera is available on this device.');
      return;
    }

    console.log('[LaunchScanner] Start scanner requested by user.');
    setScanError(null);
    setScanning(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[LaunchScanner] Starting uploaded image scan.', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      cameraActive: scanning
    });

    setUploading(true);
    setScanError(null);

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });

      console.log('[LaunchScanner] Uploaded image scan succeeded.', {
        payloadLength: result.data.length,
        cornersDetected: result.cornerPoints.length
      });

      processScannedPayloadRef.current?.(result.data, 'file');
      setScanning(false);
    } catch (error) {
      console.error('[LaunchScanner] Uploaded image scan failed.', error);
      const errorMessage = getErrorMessage(error, 'No QR code found in this image.');
      setScanError(errorMessage);
      alert(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleManualScan = () => {
    console.log('[LaunchScanner] Manual payload scan requested.', {
      payloadLength: manualInput.trim().length
    });
    processScannedPayloadRef.current?.(manualInput, 'manual');
  };

  const confirmAndAddtoLedger = () => {
    if (!pendingScan) return;

    const entry = {
      qr_payload: pendingScan.rawPayload,
      scanned_at: new Date().toISOString(),
      action: 'ACCEPT'
    };

    console.log('[LaunchScanner] Ticket accepted and added to offline ledger.', {
      ticketId: pendingScan.decoded.ticketId
    });
    setLedger((prev) => [...prev, entry]);
    setPendingScan(null);
  };

  const denyAndAddtoLedger = () => {
    if (!pendingScan) return;

    const entry = {
      qr_payload: pendingScan.rawPayload,
      scanned_at: new Date().toISOString(),
      action: 'DENY'
    };

    console.log('[LaunchScanner] Ticket denied and added to offline ledger.', {
      ticketId: pendingScan.decoded.ticketId
    });
    setLedger((prev) => [...prev, entry]);
    setPendingScan(null);
  };

  const cancelScan = () => {
    console.log('[LaunchScanner] Pending scan dismissed by user.');
    setPendingScan(null);
  };

  const removeFromLedger = (index) => {
    console.log('[LaunchScanner] Removing ledger entry.', { index });
    setLedger((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearLedger = () => {
    console.log('[LaunchScanner] Clearing offline ledger.');
    setLedger([]);
    setSyncReport(null);
    setSyncError(null);
  };

  const syncLedger = async () => {
    if (ledger.length === 0) return;
    setSyncing(true);
    setSyncReport(null);
    setSyncError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('[LaunchScanner] Ledger sync attempted without an auth token.');
      setSyncError('Not authenticated. Please log in first.');
      setSyncing(false);
      return;
    }

    try {
      const res = await fetch('/api/tickets/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: ledger })
      });

      const data = await res.json();

      if (res.ok) {
        console.log('[LaunchScanner] Ledger sync succeeded.', data);
        setSyncReport(data);
        setLedger([]);
      } else {
        console.error('[LaunchScanner] Ledger sync failed.', data);
        setSyncError(data.error || 'Sync failed with an unknown error.');
      }
    } catch (error) {
      console.error('[LaunchScanner] Network error while syncing ledger.', error);
      setSyncError('Network error: Could not reach the server. The ledger is preserved locally.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
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

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto mb-6">
        <div className="w-full rounded-xl overflow-hidden mb-6 bg-slate-100 min-h-[300px] flex items-center justify-center relative">
          <video
            ref={videoRef}
            className={`h-full min-h-[300px] w-full object-cover ${scanning ? 'block' : 'hidden'}`}
            muted
            playsInline
          />

          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
              <p className="text-slate-400">
                {cameraAvailable === false
                  ? 'No camera detected. You can still upload a QR image or paste the ticket payload manually.'
                  : 'Click "Start Scanner" to use the camera.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={toggleScanner}
            disabled={cameraAvailable === false}
            className={`flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${scanning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <Camera size={18} />
            {scanning ? 'Stop Scanner' : 'Start Scanner'}
          </button>

          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-300 cursor-pointer">
            <Upload size={18} />
            {uploading ? 'Scanning Image...' : 'Upload QR Code'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {scanError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            {scanError}
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <label className="text-sm font-medium text-slate-600 mb-2 block">Manual QR Payload Entry</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(event) => setManualInput(event.target.value)}
              placeholder="Paste a signed ticket JWT here..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
            />
            <button
              onClick={handleManualScan}
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Scan
            </button>
          </div>
        </div>
      </div>

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
            {ledger.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
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
                  onClick={() => removeFromLedger(index)}
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

      {syncReport && (
        <div className="bg-white rounded-2xl shadow p-6 max-w-2xl mx-auto mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wifi size={18} className="text-emerald-500" />
            Sync Report
          </h2>

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
                  {!pendingScan.isDuplicate && !pendingScan.isExpired && !pendingScan.isWrongVendor && (
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
                    {pendingScan.decoded.itemName || 'Unknown Item'}
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
                      #{pendingScan.decoded.ticketId?.slice(-6) || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valid Until</p>
                  <p className={`text-sm font-medium ${pendingScan.isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                    {typeof pendingScan.decoded.exp === 'number'
                      ? new Date(pendingScan.decoded.exp * 1000).toLocaleString()
                      : 'Unknown'}
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