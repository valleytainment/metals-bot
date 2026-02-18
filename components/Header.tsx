
/**
 * @file components/Header.tsx
 * @description Global application header providing engine control and system health telemetry.
 */

import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, Clock, ShieldCheck, Heart, Zap } from 'lucide-react';
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
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketOpen(isMarketOpen());
      // Simulation of a health heartbeat
      setLatency(Math.floor(Math.random() * 20) + 30);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const getRegimeColor = () => {
    if (vix > config.vixThresholdPause) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (vix > config.vixThresholdReduce) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-10 bg-[#020617]/80 backdrop-blur-2xl z-30">
      
      {/* SECTION: SYSTEM TELEMETRY */}
      <div className="flex items-center gap-12">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${isRunning ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
              <Heart size={10} className={isRunning ? 'animate-pulse' : ''} />
              {isRunning ? 'Heartbeat' : 'Stopped'}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
               <Zap size={10} className="text-blue-500" />
               {latency}ms
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">NYSE Session</span>
          <div className={`flex items-center gap-2 font-black text-xs uppercase ${marketOpen ? 'text-white' : 'text-slate-500'}`}>
            <Clock size={14} className={marketOpen ? 'text-emerald-500' : 'text-slate-600'} />
            {marketOpen ? 'Live Trading' : 'Closed'}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Market Volatility (VIX)</span>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${getRegimeColor()}`}>
            <Activity size={14} />
            <span className="text-sm font-black font-mono tracking-tighter">{vix.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SECTION: MASTER CONTROLS */}
      <div className="flex items-center gap-6">
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <ShieldCheck size={16} className="text-blue-500" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Risk Guard</span>
            <span className="text-[10px] font-black text-white">{config.riskPct}% Per Node</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`group flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all active:scale-95 ${
            isRunning 
            ? 'bg-rose-600/10 text-rose-500 border border-rose-500/30 hover:bg-rose-600/20 shadow-lg shadow-rose-900/10' 
            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-900/20'
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
