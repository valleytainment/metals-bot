
/**
 * @file components/JournalView.tsx
 * @description Strategic Ledger for forensic auditing.
 * Interfaces with the Journal Service to persist and export trade history.
 */

import React, { useState, useEffect } from 'react';
import { JournalTrade } from '../types';
import { BookOpen, Trash2, Filter, Download, Database } from 'lucide-react';
import { getTrades, clearTrades, exportLedger } from '../services/journalService';

const JournalView: React.FC = () => {
  const [trades, setTrades] = useState<JournalTrade[]>([]);

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const handlePurge = () => {
    if (window.confirm("CRITICAL: Purge entire Strategic Ledger? This action is non-reversible.")) {
      clearTrades();
      setTrades([]);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-in fade-in duration-1000">
        <div className="p-10 bg-slate-900/40 border border-slate-800/60 rounded-[3rem] mb-8 opacity-30 shadow-2xl">
          <Database size={80} />
        </div>
        <h3 className="text-2xl font-black text-slate-400 tracking-tight">Ledger Depleted</h3>
        <p className="text-sm font-medium max-w-sm text-center mt-3 leading-relaxed opacity-50">
          The engine has not yet committed any trades to long-term storage. 
          Audit logs populate automatically upon state transition to LONG.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Strategic Ledger</h2>
          <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Forensic Repository & Forensic Audit Trail</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportLedger}
            className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group"
          >
            <Download size={14} className="group-hover:animate-bounce" /> Export Forensic JSON
          </button>
          <div className="w-px h-8 bg-slate-800 mx-2" />
          <button 
            onClick={handlePurge}
            className="flex items-center gap-3 px-6 py-3 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
          >
            <Trash2 size={14} /> Wipe Registry
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a]/80 border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800/60">
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Execution Node</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Chronology</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Price Basis</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Risk Parameters</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-800/20 transition-colors group">
                <td className="px-8 py-8">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-black text-white group-hover:border-blue-500/50 transition-all">
                       {trade.symbol.slice(0, 1)}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors">{trade.symbol}</span>
                       <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Manual Execution</span>
                     </div>
                   </div>
                </td>
                <td className="px-8 py-8 text-xs font-mono font-bold text-slate-500">
                  {new Date(trade.openedTs).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-8 py-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-200 font-mono tracking-tighter">${trade.entry.toFixed(2)}</span>
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">Entry Vector</span>
                  </div>
                </td>
                <td className="px-8 py-8">
                   <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-rose-500/80 font-mono tracking-tighter">${trade.stop.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Floor</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-500/80 font-mono tracking-tighter">${trade.target.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Ceiling</span>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">In Progress</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalView;
