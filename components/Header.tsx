
import React from 'react';
import { Activity, Play, Pause, Zap } from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  vix: number;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  config: AppConfig;
}

const Header: React.FC<HeaderProps> = ({ vix, isRunning, setIsRunning, config }) => {
  const getRegimeColor = () => {
    if (vix > config.vixThresholdPause) return 'text-red-500';
    if (vix > config.vixThresholdReduce) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-slate-500 uppercase">Engine Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-bold uppercase tracking-wider">{isRunning ? 'Active' : 'Paused'}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-mono text-slate-500 uppercase">Regime (VIX)</span>
          <div className={`flex items-center gap-2 ${getRegimeColor()}`}>
            <Activity size={16} />
            <span className="text-sm font-bold">{vix.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            isRunning 
            ? 'bg-red-600/10 text-red-400 border border-red-500/30 hover:bg-red-600/20' 
            : 'bg-green-600/10 text-green-400 border border-green-500/30 hover:bg-green-600/20'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>
    </header>
  );
};

export default Header;
