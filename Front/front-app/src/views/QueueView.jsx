import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Card from '../components/Card';

// mock queue data
const MOCK_QUEUE = [
  { id: 'u1', name: 'John Doe' },
  { id: 'u2', name: 'Jane Smith' },
  { id: 'u3', name: 'Michael Brown' },
  { id: 'u4', name: 'Emily Davis' },
  { id: 'u5', name: 'Chris Wilson' },
  { id: 'u6', name: 'Sarah Johnson' },
  { id: 'u7', name: 'David Lee' },
];

export default function QueueView({ resource, onBack }) {
  return (
    <div className="space-y-6">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={18} /> Back to Resources
      </button>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {resource.name} Queue
        </h2>
        <p className="text-slate-500">
          {MOCK_QUEUE.length} people waiting
        </p>
      </div>

      {/* Queue List */}
      <Card>
        <div className="p-6 space-y-3">
          {MOCK_QUEUE.slice(0, 10).map((user, index) => (
            <div 
              key={user.id}
              className="flex justify-between items-center border-b pb-2 last:border-none"
            >
              <span className="font-medium text-slate-700">
                #{index + 1} {user.name}
              </span>
              {index === 0 && (
                <span className="text-xs text-emerald-600 font-bold">
                  NEXT
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}