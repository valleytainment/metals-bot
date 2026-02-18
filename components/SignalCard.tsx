
import React, { useState, useEffect } from 'react';
import { Signal, Candle, BotState } from '../types';
import TradingChart from './TradingChart';
import { getSignalCommentary } from '../services/geminiService';
import { Info, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SignalCardProps {
  symbol: string;
  signal: Signal | undefined;
  candles: Candle[];
  state: BotState;
}

const SignalCard: React.FC<SignalCardProps> = ({ symbol, signal, candles, state }) => {
  const [commentary, setCommentary] = useState<string>("Initializing analysis...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (signal && signal.action === 'BUY') {
      setIsLoading(true);
      getSignalCommentary(signal, candles).then(res => {
        setCommentary(res);
        setIsLoading(false);
      });
    } else {
      setCommentary(signal?.action === 'WAIT' ? "Scanning for high-probability setups..." : "Monitoring active/inactive regime.");
    }
  }, [signal?.id]);

  const getActionStyles = (action: string | undefined) => {
    switch (action) {
      case 'BUY': return 'bg-blue-600 text-white shadow-lg shadow-blue-900/40';
      case 'EXIT': return 'bg-red-600 text-white';
      case 'HOLD': return 'bg-green-600/20 text-green-400 border border-green-500/30';
      case 'PAUSE_DATA_STALE':
      case 'PAUSE_REGIME': return 'bg-orange-600/20 text-orange-400 border border-orange-500/30';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all hover:border-slate-700">
      <div className="p-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-100">{symbol}</h3>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{state === 'LONG' ? 'In Position' : 'Searching'}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getActionStyles(signal?.action)}`}>
          {signal?.action || 'SYNCING'}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[400px]">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${signal?.confidenceAdj || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono">{signal?.confidenceAdj || 0}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Risk Profile</span>
            <div className="flex gap-2">
              {signal?.vix && signal.vix > 25 ? (
                <span className="text-xs text-orange-400 flex items-center gap-1 font-bold">
                  <AlertTriangle size={12} /> Defensive
                </span>
              ) : (
                <span className="text-xs text-green-400 flex items-center gap-1 font-bold">
                  <ShieldCheck size={12} /> Standard
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-64 px-4">
          <TradingChart symbol={symbol} candles={candles} />
        </div>

        <div className="p-5 bg-slate-950/50 mt-auto border-t border-slate-800">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {isLoading ? "Thinking..." : `"${commentary}"`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {signal?.reasonCodes.map(code => (
                  <span key={code} className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {signal?.action === 'BUY' && (
          <div className="p-4 bg-blue-600/10 border-t border-blue-500/20 flex items-center justify-between">
             <div className="grid grid-cols-3 gap-8 w-full">
                <div>
                   <p className="text-[10px] text-blue-400 font-bold uppercase">Entry</p>
                   <p className="text-sm font-black text-slate-100">${signal.entry?.toFixed(2)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-red-400 font-bold uppercase">Stop</p>
                   <p className="text-sm font-black text-slate-100">${signal.stop?.toFixed(2)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-green-400 font-bold uppercase">Shares</p>
                   <p className="text-sm font-black text-slate-100">{signal.shares}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalCard;
