import React, { useState } from 'react';
import { X, Flame, Check, AlertCircle } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }) => void;
  currentConfig: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  isConnected: boolean;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  onSaveConfig,
  currentConfig,
  isConnected
}) => {
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      projectId,
      apiKey,
      authDomain,
      storageBucket,
      messagingSenderId,
      appId
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">GOMO Muaythai Firebase Connection</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          Connect this public webpage to the same Firebase Firestore database used by your <strong>GOMO Muaythai</strong> Android application for real-time live match updates and confetti celebrations.
        </p>

        <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
          isConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {isConnected ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
          <span>{isConnected ? 'Status: Successfully connected to Firebase Firestore database.' : 'Status: Running in live spectator demo mode with real-time sync simulation.'}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Firebase Project ID</label>
            <input 
              type="text" 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)}
              placeholder="e.g. gomo-muaythai-app"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">API Key</label>
              <input 
                type="text" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Auth Domain</label>
              <input 
                type="text" 
                value={authDomain} 
                onChange={e => setAuthDomain(e.target.value)}
                placeholder="app.firebaseapp.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Storage Bucket</label>
              <input 
                type="text" 
                value={storageBucket} 
                onChange={e => setStorageBucket(e.target.value)}
                placeholder="app.appspot.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Messaging Sender ID</label>
              <input 
                type="text" 
                value={messagingSenderId} 
                onChange={e => setMessagingSenderId(e.target.value)}
                placeholder="123456789"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">App ID</label>
              <input 
                type="text" 
                value={appId} 
                onChange={e => setAppId(e.target.value)}
                placeholder="1:123:web:abc"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
