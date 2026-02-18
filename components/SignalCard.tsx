
/**
 * @file components/SignalCard.tsx
 * @description Advanced analytics card for a single symbol.
 * Combines indicator logic, AI insights, and execution metrics in a "Score 10+" UI.
 */

import React, { useState, useEffect } from 'react';
import { Signal, Candle, BotState } from '../types';
import TradingChart from './TradingChart';
import { getSignalCommentary } from '../services/geminiService';
import { Info, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, TrendingUp, Gauge, Sparkles, Target, Ban } from 'lucide-react';
import { calculateIndicators } from '../services/indicators';

interface SignalCardProps {
  symbol: string;
  signal: Signal | undefined;
  candles: Candle[];
  state: BotState;
  isAiEnabled: boolean;
}

const SignalCard: React.FC<SignalCardProps> = ({ symbol, signal, candles, state, isAiEnabled }) => {
  const [commentary, setCommentary] = useState<string>("Initializing deep-tissue analysis...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAiEnabled) {
      setCommentary("Gemini AI commentary is currently inactive.");
      return;
    }

    if (signal && signal.action === 'BUY') {
      setIsLoading(true);
      getSignalCommentary(signal, candles).then(res => {
        setCommentary(res);
        setIsLoading(false);
      });
    } else if (state === 'COOLDOWN') {
      setCommentary("Engine in recovery state. Monitoring for next high-probability node.");
    } else {
      setCommentary(signal?.action === 'WAIT' ? "Scanning order books and historical clusters..." : "Managing active position parameters.");
    }
  }, [signal?.id, isAiEnabled, state]);

  const indicators = candles.length >= 200 ? calculateIndicators(candles) : null;
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const isPriceUp = latest && prev ? latest.close >= prev.close : true;

  const getActionStyles = (action: string | undefined) => {
    switch (action) {
      case 'BUY': return 'bg-blue-600 text-white shadow-xl shadow-blue-600/30';
      case 'EXIT': return 'bg-rose-600 text-white shadow-xl shadow-rose-600/30';
      case 'HOLD': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'PAUSE_DATA_STALE':
      case 'PAUSE_REGIME': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all hover:border-blue-500/30 group">
      
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-slate-800/40 flex justify-between items-center bg-slate-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-10 rounded-full ${state === 'LONG' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
          <div>
            <h3 className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors tracking-tight">{symbol}</h3>
            <p className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase font-black">
              {state === 'LONG' ? 'Live Position' : state === 'COOLDOWN' ? 'Recovery Cycle' : 'Market Observation'}
            </p>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getActionStyles(signal?.action)}`}>
          {signal?.action === 'WAIT' ? <TrendingUp size={12} /> : signal?.action === 'BUY' ? <Sparkles size={12} /> : <Ban size={12} />}
          {signal?.action || 'SCANNING'}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        
        {/* PRICE DETAIL */}
        <div className="px-8 py-8 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block flex items-center gap-2">
              Current Valuation <Gauge size={12} className="text-blue-500" />
            </span>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-black font-mono tracking-tighter ${isPriceUp ? 'text-white' : 'text-rose-400'}`}>
                ${latest?.close.toFixed(2)}
              </span>
              <span className={`text-sm font-black font-mono ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPriceUp ? '▲' : '▼'} {Math.abs(latest?.close - (prev?.close || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 text-right">
             <div className="flex flex-col">
               <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Hi-Range</span>
               <span className="text-sm font-mono text-slate-400 font-bold">${latest?.high.toFixed(2)}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Lo-Range</span>
               <span className="text-sm font-mono text-slate-400 font-bold">${latest?.low.toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* INDICATOR HUB */}
        <div className="px-8 py-5 grid grid-cols-2 gap-8 border-y border-slate-800/40 bg-[#0f172a]/40">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Signal Confidence</span>
              <span className="text-xs font-black font-mono text-blue-400">{signal?.confidenceAdj || 0}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]" 
                style={{ width: `${signal?.confidenceAdj || 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Risk Sensitivity</span>
            <div className="flex">
              {signal?.vix && signal.vix > 25 ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20 text-[10px] font-black uppercase tracking-wider">
                  <AlertTriangle size={12} /> High Volatility
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck size={12} /> Low Volatility
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LOGIC GATES */}
        <div className="px-8 py-4 grid grid-cols-4 gap-4 bg-slate-900/20">
          <ConditionBadge label="Trend" active={indicators ? latest.close > indicators.ema200 : false} info="Above 200 EMA" />
          <ConditionBadge label="Momnt" active={indicators ? indicators.rsi14 >= 50 : false} info="RSI 14 ≥ 50" />
          <ConditionBadge label="Trig" active={indicators ? latest.close > indicators.ema20 : false} info="Above 20 EMA" />
          <ConditionBadge label="Vol" active={indicators ? latest.volume >= indicators.volSma20 : false} info="Above Vol Avg" />
        </div>

        {/* DATA VIZ */}
        <div className="h-72 w-full px-4 relative">
           <div className="absolute top-4 left-8 text-[9px] font-black text-slate-600 uppercase tracking-widest z-10">Historical Price Vectors</div>
           <TradingChart symbol={symbol} candles={candles} />
        </div>

        {/* AI INSIGHTS */}
        <div className="p-8 bg-slate-950/40 border-t border-slate-800/40 mt-auto">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isAiEnabled ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
              {isAiEnabled ? <Sparkles size={18} className="text-blue-500 animate-float" /> : <TrendingUp size={18} className="text-slate-500" />}
            </div>
            <div className="space-y-3 flex-1">
              <div className="relative group/ai">
                <p className={`text-sm leading-relaxed font-medium italic transition-colors ${isAiEnabled ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isLoading ? "Consulting Gemini core processors..." : `"${commentary}"`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {signal?.reasonCodes.map(code => (
                  <span key={code} className="text-[8px] font-black bg-slate-900/80 text-blue-400 px-2.5 py-1 rounded-lg uppercase border border-slate-800/80 tracking-widest">
                    {code.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* EXECUTION BAR */}
        {signal?.action === 'BUY' && (
          <div className="px-8 py-6 bg-blue-600/5 border-t border-blue-500/20 animate-in slide-in-from-bottom-2">
             <div className="flex items-center gap-6">
                <ExecutionStat label="Target" value={`$${signal.entry?.toFixed(2)}`} icon={<Target size={12} className="text-blue-400" />} />
                <ExecutionStat label="Safety Stop" value={`$${signal.stop?.toFixed(2)}`} color="text-rose-400" />
                <ExecutionStat label="Ideal Size" value={`${signal.shares} Shares`} color="text-emerald-400" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConditionBadge = ({ label, active, info }: { label: string, active: boolean, info: string }) => (
  <div className="group/item relative flex flex-col items-center gap-1.5 transition-all">
    <div className={`p-1.5 rounded-lg border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-sm' : 'bg-slate-800/40 border-slate-800/40 text-slate-600'}`}>
      {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-emerald-500' : 'text-slate-600'}`}>{label}</span>
    <div className="absolute bottom-full mb-3 px-3 py-2 bg-black/90 text-[10px] font-bold text-white whitespace-nowrap rounded-xl border border-slate-800 hidden group-hover/item:block shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
      {info}
    </div>
  </div>
);

const ExecutionStat = ({ label, value, color = "text-white", icon }: any) => (
  <div className="flex-1 bg-[#020617]/40 p-3.5 rounded-2xl border border-slate-800/60 flex flex-col items-center gap-1">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className={`text-sm font-black font-mono ${color}`}>{value}</p>
  </div>
);

export default SignalCard;
