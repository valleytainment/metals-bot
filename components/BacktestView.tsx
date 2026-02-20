
import React, { useState } from 'react';
import { AppConfig, Candle } from '../types';
import { BacktestEngine } from '../services/backtestEngine';
import { MetalsStrategy } from '../services/strategy';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Info, Target, Zap } from 'lucide-react';
import { WATCHLIST } from '../constants';

interface BacktestViewProps {
  config: AppConfig;
}

const BacktestView: React.FC<BacktestViewProps> = ({ config }) => {
  const [selectedAsset, setSelectedAsset] = useState(WATCHLIST[0]);
  const [results, setResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      const strategy = new MetalsStrategy();
      const report = await BacktestEngine.run(strategy, selectedAsset, config);
      setResults(report);
    } catch (err: any) {
      setError(err.message || "Upstream Connection Failed");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      
      {/* HEADER: CONFIGURATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 border border-slate-800/60 p-10 rounded-[2.5rem] gap-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
             <BarChart3 className="text-blue-500" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">Forensic Backtester</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">High-Precision Vector Simulation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Target Vector</label>
            <select 
              value={selectedAsset} 
              onChange={e => setSelectedAsset(e.target.value)}
              className="bg-slate-950 border border-slate-800/60 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              {WATCHLIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            disabled={isSimulating}
            onClick={runBacktest}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] px-12 py-5 rounded-2xl transition-all disabled:opacity-50 shadow-2xl shadow-blue-900/20 active:scale-95"
          >
            {isSimulating ? 'Processing...' : 'Engage Simulator'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl flex items-center gap-4 text-rose-500">
           <AlertCircle size={20} />
           <p className="text-xs font-black uppercase tracking-widest">Upstream Error: {error}</p>
        </div>
      )}

      {results && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox label="Execution Count" value={results.trades.length} />
            <StatBox label="Success Ratio" value={`${results.winRate.toFixed(1)}%`} color="text-blue-400" />
            <StatBox label="Total Return" value={`${results.totalReturn.toFixed(2)}%`} color={results.totalReturn > 0 ? "text-emerald-400" : "text-rose-400"} />
            <StatBox label="Max Drawdown" value={`${results.maxDrawdown.toFixed(1)}%`} color="text-rose-400" icon={<AlertCircle size={14} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-slate-800/60 h-96 flex flex-col">
               <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-6">Historical Equity Curve</h3>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityCurve}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#020617', borderRadius: '16px', border: '1px solid #1e293b', fontFamily: 'JetBrains Mono'}}
                      itemStyle={{color: '#3b82f6'}}
                      labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={3} dot={false} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-slate-800/60 h-96 flex flex-col">
               <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-6">Profit/Loss Distribution</h3>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={results.trades}>
                   <Tooltip contentStyle={{backgroundColor: '#020617', borderRadius: '16px', border: '1px solid #1e293b', fontFamily: 'JetBrains Mono'}} />
                   <Bar dataKey="pnl">
                     {results.trades.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={entry.outcome === 'PROFIT' ? '#10b981' : '#f43f5e'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!results && !isSimulating && (
        <div className="bg-slate-900/40 border border-slate-800/60 border-dashed p-32 rounded-[3rem] flex flex-col items-center justify-center text-slate-600 gap-6">
           <Zap size={64} className="opacity-10" />
           <p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">Awaiting Simulation Vector</p>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color = "text-slate-100", icon }: any) => (
  <div className="bg-[#0f172a]/80 backdrop-blur-md p-8 rounded-3xl border border-slate-800/60 hover:border-blue-500/30 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
      {icon && <span className={color}>{icon}</span>}
    </div>
    <p className={`text-3xl font-black font-mono tracking-tighter ${color}`}>{value}</p>
  </div>
);

export default BacktestView;
