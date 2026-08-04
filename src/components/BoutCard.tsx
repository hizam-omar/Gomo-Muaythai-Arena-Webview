import React from 'react';
import { Bout } from '../types';
import { Trophy, Flame, Clock, CheckCircle2 } from 'lucide-react';

interface BoutCardProps {
  bout: Bout;
}

export const BoutCard: React.FC<BoutCardProps> = ({ bout }) => {
  const isLive = bout.status === 'LIVE';
  const isCompleted = bout.status === 'COMPLETED';

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
      isLive ? 'border-red-500/60 ring-2 ring-red-500/10 shadow-md' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="bg-slate-100 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200">
            {bout.boutNumber}
          </span>
          <span className="text-xs font-medium text-slate-600">{bout.roundName}</span>
        </div>
        <div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
             isLive ? 'bg-red-600 text-white animate-pulse' :
             isCompleted ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-900'
          }`}>
            {isLive && <Flame className="w-3 h-3 text-white" />}
            {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
            {!isLive && !isCompleted && <Clock className="w-3 h-3 text-slate-900" />}
            {bout.status}
          </span>
        </div>
      </div>

      {/* Fighters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Red Corner */}
        <div className={`rounded-xl p-4 flex flex-col justify-between border transition-all ${
          bout.isWinnerRed 
            ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/40' 
            : 'bg-red-50/50 border-red-200'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">Red Corner</span>
              {bout.isWinnerRed && (
                <span className="text-amber-700 font-extrabold text-xs flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-600 animate-bounce" /> WINNER
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {bout.redAvatar && (
                <img src={bout.redAvatar} alt={bout.redName} className="w-12 h-12 rounded-full border-2 border-red-200 object-cover shadow-sm" />
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{bout.redName}</h3>
                <p className="text-xs text-slate-500 font-medium">{bout.redGym}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-red-200/60">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Score</span>
            <span className="text-3xl font-extrabold text-red-600">{bout.redPoints ?? 0}</span>
          </div>
        </div>

        {/* Blue Corner */}
        <div className={`rounded-xl p-4 flex flex-col justify-between border transition-all ${
          bout.isWinnerBlue 
            ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400/40' 
            : 'bg-blue-50/50 border-blue-200'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Blue Corner</span>
              {bout.isWinnerBlue && (
                <span className="text-amber-700 font-extrabold text-xs flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-600 animate-bounce" /> WINNER
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {bout.blueAvatar && (
                <img src={bout.blueAvatar} alt={bout.blueName} className="w-12 h-12 rounded-full border-2 border-blue-200 object-cover shadow-sm" />
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{bout.blueName}</h3>
                <p className="text-xs text-slate-500 font-medium">{bout.blueGym}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-200/60">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Score</span>
            <span className="text-3xl font-extrabold text-blue-600">{bout.bluePoints ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
