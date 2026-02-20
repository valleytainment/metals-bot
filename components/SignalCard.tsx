
import React, { useState, useEffect } from 'react';
import { Signal, Candle, BotState, MacroCheck } from '../types';
import TradingChart from './TradingChart';
import { getSignalCommentary } from '../services/geminiService';
import { Info, CheckCircle2, XCircle, Sparkles, ShieldAlert, ShieldCheck, Copy, ExternalLink, Activity } from 'lucide-react';
import { calculateIndicators } from '../services/indicators';

interface SignalCardProps {
  symbol: string;
  signal: Signal | undefined;
  candles: Candle[];
  state: BotState;
  isAiEnabled: boolean;
  macroStatus: MacroCheck | null;
  isReal: boolean;
}

const SignalCard: React.FC<SignalCardProps> = ({ symbol, signal, candles, state, isAiEnabled, macroStatus, isReal }) => {
  const [commentary, setCommentary] = useState<string>("Analyzing market structure...");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAiEnabled) {
      setCommentary("AI Thesis offline (Config).");
      return;
    }

    if (signal && signal.action === 'BUY') {
      setIsLoading(true);
      getSignalCommentary(signal, candles).then(res => {
        setCommentary(res);
        setIsLoading(false);
      });
    } else if (state === 'COOLDOWN') {
      setCommentary("Cooldown active. Maintaining exit safety.");
    } else {
      setCommentary(signal?.action === 'WAIT' ? "Scanning for high-probability setups." : "Position live. Monitoring risk floors.");
    }
  }, [signal?.id, isAiEnabled, state]);

  const copyExecutionString = () => {
    if (!signal) return;
    const text = `${symbol} LONG | Entry: $${signal.price.toFixed(2)} | Stop: $${signal.stop?.toFixed(2)} | Target: $${signal.target?.toFixed(2)} | Shares: ${signal.shares}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const indicators = candles.length >= 250 ? calculateIndicators(candles) : null;
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const isPriceUp = latest && prev ? latest.close >= prev.close : true;

  return (
    <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all hover:border-blue-500/30 group relative">
      
      {/* INTEGRITY OVERLAY */}
      <div className="absolute top-8 right-10 flex items-center gap-2">
         <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-tighter ${isReal ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
           {isReal ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
           {isReal ? 'Verified Feed' : 'Synthetic Mode'}
         </div>
      </div>

      <div className="px-10 py-7 border-b border-slate-800/40 flex justify-between items-center bg-slate-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className={`w-1.5 h-12 rounded-full ${state === 'LONG' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
          <div>
            <h3 className="text-3xl font-black text-white group-hover:text-blue-500 transition-colors tracking-tighter uppercase">{symbol}</h3>
            <p className="text-[9px] text-slate-500 font-black tracking-widest uppercase mt-0.5">
              {state === 'LONG' ? 'Personal Asset Active' : 'Market Watchlist'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-10 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 block">Real-Time Quote</span>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-black font-mono tracking-tighter ${isPriceUp ? 'text-white' : 'text-rose-400'}`}>
                ${latest?.close.toFixed(2)}
              </span>
              <span className={`text-base font-black font-mono ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPriceUp ? '▲' : '▼'} {Math.abs(latest?.close - (prev?.close || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Grounding Score</span>
            <p className="text-2xl font-black font-mono text-blue-400">{signal?.confidenceAdj || 0}%</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <ConditionBadge label="Trend" active={indicators ? latest.close > indicators.ema200 : false} info="Price > 200 EMA" />
          <ConditionBadge label="Momnt" active={indicators ? indicators.rsi14 >= 50 : false} info="RSI ≥ 50" />
          <ConditionBadge label="Trig" active={indicators ? latest.close > indicators.ema20 : false} info="Price > 20 EMA" />
          <ConditionBadge label="Vol" active={indicators ? latest.volume >= indicators.volSma20 : false} info="Vol > Avg" />
        </div>

        <div className="h-56">
          <TradingChart symbol={symbol} candles={candles} />
        </div>

        <div className="pt-8 border-t border-slate-800/40">
          <div className="flex items-start gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isAiEnabled ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <p className={`text-sm leading-relaxed italic font-bold tracking-tight ${isAiEnabled ? 'text-slate-300' : 'text-slate-600'}`}>
                {isLoading ? "Validating thesis with Gemini Flash..." : `"${commentary}"`}
              </p>
            </div>
          </div>
        </div>

        {signal?.action === 'BUY' && (
          <div className="p-8 bg-blue-600/5 border border-blue-500/30 rounded-[2rem] space-y-6 animate-in zoom-in-95">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Manual Execution Helper</span>
                <button 
                  onClick={copyExecutionString}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-900/10"
                >
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy Execution'}
                </button>
             </div>
             <div className="grid grid-cols-3 gap-6">
               <ExecStat label="Limit Order" value={`$${signal.price.toFixed(2)}`} />
               <ExecStat label="Stop Floor" value={`$${signal.stop?.toFixed(2)}`} color="text-rose-400" />
               <ExecStat label="Risk Units" value={signal.shares || 0} color="text-emerald-400" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConditionBadge = ({ label, active, info }: { label: string, active: boolean, info: string }) => (
  <div className="group relative flex flex-col items-center gap-2">
    <div className={`p-3 rounded-2xl border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/5' : 'bg-slate-800/40 border-slate-800/40 text-slate-700'}`}>
      {active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
  </div>
);

const ExecStat = ({ label, value, color = "text-white" }: any) => (
  <div className="flex flex-col">
    <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{label}</span>
    <span className={`text-lg font-black font-mono tracking-tighter ${color}`}>{value}</span>
  </div>
);

export default SignalCard;
