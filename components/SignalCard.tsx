
import React, { useState, useEffect } from 'react';
import { Signal, Candle, BotState, MacroCheck } from '../types';
import TradingChart from './TradingChart';
import { getSignalCommentary } from '../services/geminiService';
import { Info, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, TrendingUp, Gauge, Sparkles, Target, Ban, ShieldAlert } from 'lucide-react';
import { calculateIndicators } from '../services/indicators';

interface SignalCardProps {
  symbol: string;
  signal: Signal | undefined;
  candles: Candle[];
  state: BotState;
  isAiEnabled: boolean;
  macroStatus: MacroCheck | null;
}

const SignalCard: React.FC<SignalCardProps> = ({ symbol, signal, candles, state, isAiEnabled, macroStatus }) => {
  const [commentary, setCommentary] = useState<string>("Initializing deep-tissue analysis...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAiEnabled) {
      setCommentary("Thesis validation inactive (Settings).");
      return;
    }

    if (signal && signal.action === 'BUY') {
      setIsLoading(true);
      getSignalCommentary(signal, candles).then(res => {
        setCommentary(res);
        setIsLoading(false);
      });
    } else if (state === 'COOLDOWN') {
      setCommentary("Recovery state active. Scanning for structural reversals.");
    } else {
      setCommentary(signal?.action === 'WAIT' ? "Scanning order flow clusters..." : "Managing active position risk.");
    }
  }, [signal?.id, isAiEnabled, state]);

  const indicators = candles.length >= 250 ? calculateIndicators(candles) : null;
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const isPriceUp = latest && prev ? latest.close >= prev.close : true;

  return (
    <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl transition-all hover:border-blue-500/30 group">
      
      <div className="px-8 py-6 border-b border-slate-800/40 flex justify-between items-center bg-slate-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-10 rounded-full ${state === 'LONG' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
          <div>
            <h3 className="text-2xl font-black text-white group-hover:text-blue-500 transition-colors tracking-tight">{symbol}</h3>
            <p className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase font-black">
              {state === 'LONG' ? 'Position Live' : 'Market Monitor'}
            </p>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          signal?.action === 'BUY' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
        }`}>
          {signal?.action || 'SCANNING'}
        </div>
      </div>

      {macroStatus && !macroStatus.isSafe && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-8 py-3 flex items-center gap-3">
          <ShieldAlert size={14} className="text-rose-500 animate-pulse" />
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider line-clamp-1">
            MACRO OVERRIDE: {macroStatus.reason}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block">Value Matrix</span>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-black font-mono tracking-tighter ${isPriceUp ? 'text-white' : 'text-rose-400'}`}>
                ${latest?.close.toFixed(2)}
              </span>
              <span className={`text-sm font-black font-mono ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPriceUp ? '▲' : '▼'} {Math.abs(latest?.close - (prev?.close || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Confidence Index</span>
            <p className="text-xl font-black font-mono text-blue-400">{signal?.confidenceAdj || 0}%</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <ConditionBadge label="Trend" active={indicators ? latest.close > indicators.ema200 : false} info="Price > 200 EMA" />
          <ConditionBadge label="Momnt" active={indicators ? indicators.rsi14 >= 50 : false} info="RSI ≥ 50" />
          <ConditionBadge label="Trig" active={indicators ? latest.close > indicators.ema20 : false} info="Price > 20 EMA" />
          <ConditionBadge label="Vol" active={indicators ? latest.volume >= indicators.volSma20 : false} info="Vol > Avg" />
        </div>

        <div className="h-48">
          <TradingChart symbol={symbol} candles={candles} />
        </div>

        <div className="pt-6 border-t border-slate-800/40">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isAiEnabled ? 'bg-blue-600/10 border-blue-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <Sparkles size={18} className={isAiEnabled ? 'text-blue-500' : 'text-slate-500'} />
            </div>
            <div className="flex-1">
              <p className={`text-sm leading-relaxed italic font-medium ${isAiEnabled ? 'text-slate-300' : 'text-slate-600'}`}>
                {isLoading ? "Consulting Grounded Macro Logic..." : `"${commentary}"`}
              </p>
              <div className="flex gap-2 mt-3">
                {signal?.reasonCodes.slice(0, 3).map(code => (
                  <span key={code} className="text-[8px] font-black bg-slate-900 px-2 py-1 rounded text-slate-500 uppercase tracking-widest">
                    {code.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {signal?.action === 'BUY' && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-in zoom-in-95">
            <ExecStat label="Target" value={`$${signal.target?.toFixed(2)}`} />
            <ExecStat label="Stop" value={`$${signal.stop?.toFixed(2)}`} color="text-rose-400" />
            <ExecStat label="Size" value={signal.shares || 0} color="text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
};

const ConditionBadge = ({ label, active, info }: { label: string, active: boolean, info: string }) => (
  <div className="group relative flex flex-col items-center gap-1.5">
    <div className={`p-2 rounded-xl border ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800/40 border-slate-800/40 text-slate-600'}`}>
      {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    <div className="absolute bottom-full mb-2 px-3 py-1 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-slate-800 shadow-2xl">
      {info}
    </div>
  </div>
);

const ExecStat = ({ label, value, color = "text-white" }: any) => (
  <div className="flex flex-col items-center">
    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-black font-mono ${color}`}>{value}</span>
  </div>
);

export default SignalCard;
