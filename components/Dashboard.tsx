
import React from 'react';
import { Signal, Candle, BotState, MacroCheck } from '../types';
import { MarketTicker } from '../services/marketProvider';
import SignalCard from './SignalCard';
import { ShieldCheck, ShieldX, Activity, Zap, Cpu, Server, Network } from 'lucide-react';

interface DashboardProps {
  watchlist: string[];
  signals: Record<string, Signal>;
  marketData: Record<string, Candle[]>;
  botStates: Record<string, BotState>;
  tickers: MarketTicker[];
  macroStatus: MacroCheck | null;
  isAiEnabled: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  watchlist, 
  signals, 
  marketData, 
  botStates, 
  tickers, 
  macroStatus, 
  isAiEnabled 
}) => {
  const realTickerCount = tickers.filter(t => t.isReal).length;
  const integrityScore = Math.round((realTickerCount / watchlist.length) * 100);
  const activeProxy = tickers.find(t => t.sourceProxy)?.sourceProxy || "SEARCHING";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* TACTICAL DATA MONITOR */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/80 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integrity Score</span>
            <ShieldCheck size={14} className={integrityScore > 80 ? "text-emerald-500" : "text-amber-500"} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tighter ${integrityScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {integrityScore}/100
            </span>
          </div>
          <p className="text-[8px] text-slate-600 font-bold uppercase mt-2">Real-World Vector Ratio</p>
        </div>

        <div className="bg-[#0f172a]/80 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Proxy</span>
            <Network size={14} className="text-blue-500" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase italic">
            {activeProxy}
          </span>
          <p className="text-[8px] text-slate-600 font-bold uppercase mt-2">Upstream Tunnel</p>
        </div>

        <div className="bg-[#0f172a]/80 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Audit</span>
            <Cpu size={14} className={isAiEnabled ? "text-blue-500" : "text-slate-700"} />
          </div>
          <span className="text-xl font-black text-white tracking-tighter">
            {isAiEnabled ? 'GROUNDED' : 'BLIND'}
          </span>
          <p className="text-[8px] text-slate-600 font-bold uppercase mt-2">Logic Verification</p>
        </div>

        <div className="bg-[#0f172a]/80 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">VIX Sensitivity</span>
            <Activity size={14} className="text-rose-500" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase">
            ACTIVE
          </span>
          <p className="text-[8px] text-slate-600 font-bold uppercase mt-2">Regime Volatility Filter</p>
        </div>
      </section>

      {/* MACRO ALERT BANNER */}
      {macroStatus && !macroStatus.isSafe && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-6 flex items-start gap-6 backdrop-blur-md shadow-2xl shadow-rose-900/10 animate-pulse">
          <div className="p-4 bg-rose-500 rounded-2xl text-white">
            <ShieldX size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-500 font-black text-sm uppercase tracking-widest mb-1">Macro Integrity Alert</h3>
            <p className="text-slate-300 text-xs font-medium leading-relaxed uppercase tracking-tight italic">"{macroStatus.reason}"</p>
          </div>
        </div>
      )}

      {/* PRICE PULSE GRID */}
      <section className="bg-[#0f172a]/40 border border-slate-800/60 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Live Pulse</h2>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-0.5">Real-Time Sync Terminal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {watchlist.map(symbol => {
            const ticker = tickers.find(t => t.symbol === symbol);
            const isUp = (ticker?.changePercent || 0) >= 0;
            const isReal = ticker?.isReal ?? false;
            return (
              <div key={symbol} className={`relative bg-slate-950/40 border p-6 rounded-3xl flex flex-col gap-1 transition-all group overflow-hidden ${isReal ? 'border-slate-800/60' : 'border-amber-500/30'}`}>
                {!isReal && <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-black text-[7px] font-black uppercase tracking-tighter">SIMULATED</div>}
                <span className="text-[9px] font-black text-slate-500 group-hover:text-blue-400 tracking-widest transition-colors">{symbol}</span>
                <div className="text-2xl font-black font-mono text-white tracking-tighter">
                  ${ticker?.price.toFixed(2) || "---"}
                </div>
                <div className={`text-[10px] font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(ticker?.changePercent || 0).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SIGNAL HUB */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {watchlist.map(symbol => (
          <SignalCard 
            key={symbol}
            symbol={symbol}
            signal={signals[symbol]}
            candles={marketData[symbol] || []}
            state={botStates[symbol]}
            isAiEnabled={isAiEnabled}
            macroStatus={macroStatus}
            isReal={tickers.find(t => t.symbol === symbol)?.isReal ?? false}
          />
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
