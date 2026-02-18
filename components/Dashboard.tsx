
import React from 'react';
import { Signal, Candle, BotState, MacroCheck } from '../types';
import { MarketTicker } from '../services/marketProvider';
import SignalCard from './SignalCard';
import { Activity, ShieldAlert, Globe, Zap, Cpu } from 'lucide-react';

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
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* MACRO ALERT BANNER */}
      {macroStatus && !macroStatus.isSafe && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-6 flex items-start gap-6 backdrop-blur-md shadow-2xl shadow-rose-900/10 animate-pulse">
          <div className="p-4 bg-rose-500 rounded-2xl text-white">
            <ShieldAlert size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-500 font-black text-sm uppercase tracking-widest mb-1">Macro Integrity Alert</h3>
            <p className="text-slate-300 text-xs font-medium leading-relaxed uppercase tracking-tight italic">"{macroStatus.reason}"</p>
          </div>
          <div className="flex flex-col gap-2">
            {macroStatus.sources.map((s, i) => (
              <a key={i} href={s.uri} target="_blank" className="text-[9px] font-black text-rose-400 hover:text-white transition-colors bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                SOURCE {i+1}
              </a>
            ))}
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
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Price Pulse</h2>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-0.5">Live Deterministic Tick Feed (5s)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
              <Cpu size={14} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FSM Processing</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
              <Globe size={14} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Macro Scanned</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {watchlist.map(symbol => {
            const ticker = tickers.find(t => t.symbol === symbol);
            const isUp = (ticker?.changePercent || 0) >= 0;
            return (
              <div key={symbol} className="bg-slate-950/40 border border-slate-800/60 p-6 rounded-3xl flex flex-col gap-1 transition-all hover:scale-[1.02] hover:bg-slate-950 hover:border-blue-500/40 group cursor-default">
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
          />
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
