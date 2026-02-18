
/**
 * @file components/Dashboard.tsx
 * @description Primary command center for the Bot.
 * Now displays live grounded data and verified source links for transparency.
 */

import React from 'react';
import { Signal, Candle, BotState } from '../types';
import SignalCard from './SignalCard';
import { ArrowUpRight, ArrowDownRight, Activity, ExternalLink, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  watchlist: string[];
  signals: Record<string, Signal>;
  marketData: Record<string, Candle[]>;
  botStates: Record<string, BotState>;
  verifiedData?: any[]; // Data from Google Search Grounding
}

const Dashboard: React.FC<DashboardProps> = ({ watchlist, signals, marketData, botStates, verifiedData }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SECTION: REAL-TIME PRICE BOARD (GROUNDED) */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Verified</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Activity size={18} className="text-blue-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Grounded Market Pulse</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {watchlist.map(symbol => {
            const grounded = verifiedData?.find(d => d.symbol === symbol);
            const candles = marketData[symbol] || [];
            const latest = candles[candles.length - 1];
            const price = grounded?.price || latest?.close || 0;
            const isUp = (grounded?.change || 0) >= 0;

            return (
              <div key={`ticker-${symbol}`} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-blue-500/30 transition-all group">
                <span className="text-xs font-bold text-slate-500 group-hover:text-blue-400">{symbol}</span>
                <span className="text-xl font-black font-mono text-slate-100 tracking-tighter">
                  ${price.toFixed(2)}
                </span>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(grounded?.change || 0).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION: VERIFIED SOURCES (MANDATORY PER GUIDELINES) */}
        {verifiedData && verifiedData.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 block">Data Integrity Verification Sources</span>
            <div className="flex flex-wrap gap-4">
              {verifiedData[0].sources?.map((source: any, idx: number) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all group"
                >
                  <ExternalLink size={10} className="group-hover:animate-pulse" />
                  <span className="truncate max-w-[150px]">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION: SIGNAL CARDS GRID */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {watchlist.map((symbol) => {
          const signal = signals[symbol];
          const candles = marketData[symbol] || [];
          const state = botStates[symbol];
          
          return (
            <SignalCard 
              key={symbol} 
              symbol={symbol} 
              signal={signal} 
              candles={candles}
              state={state}
            />
          );
        })}
      </section>
    </div>
  );
};

export default Dashboard;
