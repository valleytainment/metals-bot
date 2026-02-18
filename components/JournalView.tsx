
/**
 * @file components/JournalView.tsx
 * @description Forensic repository for strategy execution.
 * Tracks historical manual fills triggered by the bot's signal logic.
 */

import React, { useState, useEffect } from 'react';
import { JournalTrade } from '../types';
import { BookOpen, Trash2, Filter, Download } from 'lucide-react';

const JournalView: React.FC = () => {
  const [trades, setTrades] = useState<JournalTrade[]>([]);

  // Load persistence data from LocalStorage (Simulated SQLite Week 1)
  useEffect(() => {
    const saved = localStorage.getItem('metals_journal');
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  /** Utility to purge local history */
  const clearHistory = () => {
    if (window.confirm("Purge all historical records? This cannot be undone.")) {
      localStorage.removeItem('metals_journal'); 
      setTrades([]);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-32 animate-in fade-in duration-1000">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-full mb-6 opacity-20">
          <BookOpen size={64} />
        </div>
        <p className="text-xl font-black text-slate-400">Ledger Empty</p>
        <p className="text-sm font-medium max-w-xs text-center mt-2 opacity-60">
          Automated logging initiates whenever the Bot Engine transitions a monitored symbol into a 'LONG' state.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
      
      {/* SECTION: JOURNAL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter">Strategic Ledger</h2>
          <p className="text-xs text-slate-500 font-medium">Historical audit of all generated LONG transitions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all">
            <Filter size={18} />
          </button>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
            <Download size={18} />
          </button>
          <div className="w-px h-6 bg-slate-800 mx-1" />
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all"
          >
            <Trash2 size={14} /> Purge Ledger
          </button>
        </div>
      </div>

      {/* SECTION: THE LEDGER TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <TableHead label="Asset" />
              <TableHead label="Timestamp" />
              <TableHead label="Price Basis" />
              <TableHead label="Risk Parameter" />
              <TableHead label="Status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-5">
                   <div className="flex flex-col">
                     <span className="text-sm font-black text-slate-100 tracking-tighter group-hover:text-blue-400 transition-colors">{trade.symbol}</span>
                     <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Bot Execution</span>
                   </div>
                </td>
                <td className="p-5 text-xs font-mono text-slate-500">
                  {new Date(trade.openedTs).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-300 font-mono tracking-tighter">${trade.entry.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-600 uppercase font-black">Average Fill</span>
                  </div>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-rose-500 font-mono tracking-tighter">${trade.stop.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-600 uppercase font-black">Stop Loss</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-500 font-mono tracking-tighter">${trade.target.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-600 uppercase font-black">Target Exit</span>
                      </div>
                   </div>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Active Session
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableHead = ({ label }: { label: string }) => (
  <th className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</th>
);

export default JournalView;
