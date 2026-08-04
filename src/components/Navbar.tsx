import logo from '../assets/images/gomo_logo_1785735883874.jpg';
import React from 'react';
import { RefreshCw, Sparkles, Settings } from 'lucide-react';

interface NavbarProps {
  isFirebaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isFirebaseConnected
}) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
            <img src={logo} alt="GOMO Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              GOMO Muaythai Arena
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                isFirebaseConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-red-50 text-red-700 border-red-300'
              }`}>
                {isFirebaseConnected ? '🔥 Firebase Live' : '🔴 Spectator Feed'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">Official Public Live Scoreboard & Bouts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        </div>
      </div>
    </header>
  );
};
