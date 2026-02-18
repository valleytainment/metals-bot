
/**
 * @file components/SignalCard.tsx
 * @description Advanced analytics card for a single symbol.
 * Combines indicator logic, AI insights, real-time pricing, and execution metrics.
 */

import React, { useState, useEffect } from 'react';
import { Signal, Candle, BotState } from '../types';
import TradingChart from './TradingChart';
import { getSignalCommentary } from '../services/geminiService';
import { Info, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, TrendingUp, Gauge, Sparkles } from 'lucide-react';
import { calculateIndicators } from '../services/indicators';

interface SignalCardProps {
  symbol: string;
  signal: Signal | undefined;
  candles: Candle[];
  state: BotState;
  isAiEnabled: boolean;
}

const SignalCard: React.FC<SignalCardProps> = ({ symbol, signal, candles, state, isAiEnabled }) => {
  const [commentary, setCommentary] = useState<string>("Initializing analysis...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAiEnabled) {
      setCommentary("AI commentary disabled in settings.");
      return;
    }

    if (signal && signal.action === 'BUY') {
      setIsLoading(true);
      getSignalCommentary(signal, candles).then(res => {
        setCommentary(res);
        setIsLoading(false);
      });
    } else {
      setCommentary(signal?.action === 'WAIT' ? "Scanning for high-probability setups..." : "Monitoring active position.");
    }
  }, [signal?.id, isAiEnabled]);

  const indicators = candles.length >= 200 ? calculateIndicators(candles) : null;
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const isPriceUp = latest && prev ? latest.close >= prev.close : true;

  const getActionStyles = (action: string | undefined) => {
    switch (action) {
      case 'BUY': return 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400';
      case 'EXIT': return 'bg-rose-600 text-white shadow-lg shadow-rose-900/40';
      case 'HOLD': return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30';
      case 'PAUSE_DATA_STALE':
      case 'PAUSE_REGIME': return 'bg-orange-600/20 text-orange-400 border border-orange-500/30';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all hover:border-slate-600 group">
      
      {/* HEADER: SYMBOL & STATUS */}
      <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-10 rounded-full ${state === 'LONG' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
          <div>
            <h3 className="text-xl font-black text-slate-100 group-hover:text-blue-400 transition-colors">{symbol}</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              {state === 'LONG' ? 'ACTIVE POSITION' : state === 'COOLDOWN' ? 'RECOVERY PHASE' : 'SCANNING'}
            </p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${getActionStyles(signal?.action)}`}>
          {signal?.action || 'SYNCING'}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[450px]">
        
        {/* PRICE SUMMARY SECTION */}
        <div className="px-5 py-6 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              Live Price <Gauge size={10} />
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono tracking-tighter ${isPriceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${latest?.close.toFixed(2)}
              </span>
              <span className={`text-xs font-bold ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPriceUp ? '▲' : '▼'} {Math.abs(latest?.close - (prev?.close || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
             <div className="flex flex-col">
               <span className="text-[8px] text-slate-600 font-bold uppercase">Session High</span>
               <span className="text-xs font-mono text-slate-400">${latest?.high.toFixed(2)}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] text-slate-600 font-bold uppercase">Session Low</span>
               <span className="text-xs font-mono text-slate-400">${latest?.low.toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* INDICATOR & CONFIDENCE STRIP */}
        <div className="p-5 grid grid-cols-2 gap-4 border-b border-slate-800/50 bg-slate-950/20">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence</span>
              <div className="group/tip relative cursor-help">
                <Info size={10} className="text-slate-600" />
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-950 border border-slate-800 rounded text-[10px] hidden group-hover/tip:block z-50 shadow-2xl">
                  Adjusted probability based on Signal Integrity + Market Regime filters.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${signal?.confidenceAdj || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-slate-300">{signal?.confidenceAdj || 0}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Risk Profile</span>
            <div className="flex gap-2">
              {signal?.vix && signal.vix > 25 ? (
                <span className="text-xs text-orange-400 flex items-center gap-1 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  <AlertTriangle size={12} /> Aggressive Vol
                </span>
              ) : (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck size={12} /> Stable Regime
                </span>
              )}
            </div>
          </div>
        </div>

        {/* LOGIC CONDITION STATUS */}
        <div className="px-5 py-3 grid grid-cols-4 gap-2 border-b border-slate-800/50">
          <ConditionItem label="Trend" active={indicators ? latest.close > indicators.ema200 : false} tip="Price > 200 EMA" />
          <ConditionItem label="Momentum" active={indicators ? indicators.rsi14 >= 50 : false} tip="RSI(14) >= 50" />
          <ConditionItem label="Trigger" active={indicators ? latest.close > indicators.ema20 : false} tip="Price > 20 EMA" />
          <ConditionItem label="Volume" active={indicators ? latest.volume >= indicators.volSma20 : false} tip="Volume > 20 SMA" />
        </div>

        {/* CHARTING AREA */}
        <div className="h-64 px-4 pt-4">
          <TradingChart symbol={symbol} candles={candles} />
        </div>

        {/* AI COMMENTARY */}
        <div className="p-5 bg-slate-950/50 mt-auto border-t border-slate-800">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${isAiEnabled ? 'bg-blue-500/10 border-blue-500/20' : 'bg-slate-800 border-slate-700'} flex items-center justify-center shrink-0 border`}>
              {isAiEnabled ? <Sparkles size={16} className="text-blue-500" /> : <TrendingUp size={16} className="text-slate-600" />}
            </div>
            <div className="space-y-2 flex-1">
              <p className={`text-sm leading-relaxed italic line-clamp-2 ${isAiEnabled ? 'text-slate-400' : 'text-slate-600'}`}>
                {isLoading ? "Generating technical thesis..." : `"${commentary}"`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {signal?.reasonCodes.map(code => (
                  <span key={code} className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase border border-slate-700">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TRADE EXECUTION (CONTEXTUAL) */}
        {signal?.action === 'BUY' && (
          <div className="p-4 bg-blue-600/10 border-t border-blue-500/20">
             <div className="grid grid-cols-3 gap-2 w-full">
                <ExecutionMetric label="Entry Target" value={`$${signal.entry?.toFixed(2)}`} />
                <ExecutionMetric label="Hard Stop" value={`$${signal.stop?.toFixed(2)}`} color="text-rose-400" />
                <ExecutionMetric label="Rec. Shares" value={signal.shares || 0} color="text-emerald-400" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConditionItem = ({ label, active, tip }: { label: string, active: boolean, tip: string }) => (
  <div className="group/item relative flex flex-col items-center gap-1 cursor-default">
    <div className={`p-1 rounded-full ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
      {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    </div>
    <span className={`text-[8px] font-bold uppercase tracking-tighter ${active ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>
    <div className="absolute bottom-full mb-1 p-2 bg-slate-950 text-[10px] whitespace-nowrap rounded border border-slate-800 hidden group-hover/item:block shadow-2xl z-50">
      {tip}
    </div>
  </div>
);

const ExecutionMetric = ({ label, value, color = "text-slate-100" }: any) => (
  <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50 flex flex-col items-center">
    <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5 tracking-widest">{label}</p>
    <p className={`text-xs font-black font-mono ${color}`}>{value}</p>
  </div>
);

export default SignalCard;
