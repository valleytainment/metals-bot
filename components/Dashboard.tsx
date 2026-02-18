
import React from 'react';
import { Signal, Candle, BotState, MacroCheck } from '../types';
import { MarketTicker } from '../services/marketProvider';
import SignalCard from './SignalCard';
import { ArrowUpRight, ArrowDownRight, Activity, ExternalLink, ShieldCheck, Clock, Zap } from 'lucide-react';

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
  const isHealthy = tickers.length > 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* SECTION: DETERMINISTIC PRICE BOARD */}
      <section className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="bg-[#0f172a]/80 border border-slate-800/60 rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Activity size={24} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">Market Pulse Engine</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${isHealthy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    {isHealthy ? <ShieldCheck size={10} /> : <Clock size={10} />}
                    {isHealthy ? 'Deterministic Feed' : 'Syncing'}
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest px-2">• Ticks: 5s</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {macroStatus?.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-800/40 rounded-xl text-[10px] font-bold text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all hover:-translate-y-0.5"
                >
                  <ExternalLink size={10} />
                  <span className="truncate max-w-[120px]">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {watchlist.map(symbol => {
              const ticker = tickers.find(t => t.symbol === symbol);
              const candles = marketData[symbol] || [];
              const latest = candles[candles.length - 1];
              const prev = candles[candles.length - 2];
              const price = ticker?.price || latest?.close || 0;
              const isUp = latest && prev ? latest.close >= prev.close : true;

              return (
                <div key={`ticker-${symbol}`} className="bg-slate-950/40 border border-slate-800/50 p-6 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-blue-500/40 hover:bg-slate-950 transition-all group/card">
                  <span className="text-[10px] font-black text-slate-500 group-hover/card:text-blue-400 uppercase tracking-widest transition-colors">{symbol}</span>
                  <span className="text-2xl font-black font-mono text-white tracking-tighter">
                    ${price.toFixed(2)}
                  </span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(ticker?.price ? ((ticker.price - (prev?.close || ticker.price)) / ticker.price) * 100 : 0).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 px-2">
        <Zap size={18} className="text-amber-500 fill-amber-500" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tactical Signals Hub</h3>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {watchlist.map((symbol) => (
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
