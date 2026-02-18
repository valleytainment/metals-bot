
/**
 * @file components/Header.tsx
 * @description Global application header providing engine control and system-wide market health metrics.
 */

import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, Clock, ShieldCheck } from 'lucide-react';
import { AppConfig } from '../types';
import { isMarketOpen } from '../services/marketHours';

interface HeaderProps {
  vix: number;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  config: AppConfig;
}

const Header: React.FC<HeaderProps> = ({ vix, isRunning, setIsRunning, config }) => {
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());

  // Polling for market state updates every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setMarketOpen(isMarketOpen()), 30000);
    return () => clearInterval(timer);
  }, []);

  /** Logic to determine Regime safety color coding */
  const getRegimeColor = () => {
    if (vix > config.vixThresholdPause) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (vix > config.vixThresholdReduce) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl z-10">
      
      {/* SECTION: LEFT ALIGNED GLOBAL METRICS */}
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Engine Loop</span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-xs font-black uppercase tracking-widest">{isRunning ? 'Active' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">NYSE Session</span>
          <div className={`flex items-center gap-1.5 ${marketOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Clock size={12} />
            <span className="text-xs font-black uppercase tracking-widest">{marketOpen ? 'Trading' : 'Closed'}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Market Fear (VIX)</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${getRegimeColor()}`}>
            <Activity size={12} />
            <span className="text-xs font-black font-mono">{vix.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SECTION: ENGINE CONTROLS */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg">
          <ShieldCheck size={14} className="text-blue-500" />
          <span className="text-[10px] font-bold text-slate-400">Risk Gate: {config.riskPct}%</span>
        </div>
        
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`group flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            isRunning 
            ? 'bg-rose-600/10 text-rose-400 border border-rose-500/30 hover:bg-rose-600/20' 
            : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20'
          }`}
        >
          {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          {isRunning ? 'Kill Switch' : 'Initiate Engine'}
        </button>
      </div>
    </header>
  );
};

export default Header;
