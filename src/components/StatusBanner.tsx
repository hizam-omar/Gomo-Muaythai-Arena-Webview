import React from 'react';

interface StatusBannerProps {
  activeCount: number;
  isFirebaseConnected: boolean;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  activeCount,
  isFirebaseConnected
}) => {
  return (
    <div className="mb-6 bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${activeCount > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`}></div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Championship Series Feed</h2>
          <p className="text-xs text-slate-500">
            {isFirebaseConnected 
              ? 'Connected to GOMO Muaythai Firebase Firestore in real-time.' 
              : 'Public spectator view (Read-only mode). Connect Firebase for live remote sync.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-600 font-medium">Active Bouts:</span>
          <span className="text-sm font-extrabold text-red-600">{activeCount}</span>
        </div>
      </div>
    </div>
  );
};
