import React, { useState } from 'react';
import { QrCode, Camera, Upload, ArrowLeft } from 'lucide-react';

export default function LaunchScanner({ onBack }) {
  const [scanning, setScanning] = useState(false);

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
          Scanner
        </h1>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow p-6 max-w-xl mx-auto">
        
        {/* Scanner Preview */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl h-64 flex items-center justify-center mb-6">
          {scanning ? (
            <p className="text-slate-500">📷 Camera Active...</p>
          ) : (
            <p className="text-slate-400">Camera preview will appear here</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          
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

      </div>
    </div>
  );
}