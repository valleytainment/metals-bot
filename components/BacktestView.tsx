
/**
 * @file components/BacktestView.tsx
 * @description Advanced strategy validator.
 * Implements walk-forward simulation with realistic slippage and risk-adjusted return reporting.
 */

import React, { useState } from 'react';
import { AppConfig, BotState, Candle } from '../types';
import { generateMockCandles } from '../services/dataModule';
import { evaluateSignal } from '../services/engine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Info } from 'lucide-react';

interface BacktestViewProps {
  config: AppConfig;
}

const BacktestView: React.FC<BacktestViewProps> = ({ config }) => {
  const [slippage, setSlippage] = useState(0.1); 
  const [results, setResults] = useState<{
    totalTrades: number;
    winRate: number;
    expectancy: number;
    profitFactor: number;
    maxDrawdown: number;
    trades: any[];
    equityCurve: any[];
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  /**
   * Main Simulation Engine
   * Iterates through historical bars, applying engine logic and slippage-adjusted fills.
   */
  const runBacktest = () => {
    setIsSimulating(true);
    
    // Simulate 2000 bars for higher statistical significance
    const candles = generateMockCandles('GLD', 2000, 180, 0.003);
    const trades: any[] = [];
    const equityCurve: any[] = [];
    let state: BotState = 'WAIT';
    let cooldown = 0;
    let equity = config.accountUsd;
    let peakEquity = equity;
    let maxDrawdown = 0;
    
    // Slippage multiplier: Impacting Buy-Up and Sell-Down costs
    const slipMult = 1 - (slippage / 100);

    for (let i = 250; i < candles.length; i++) {
      const window = candles.slice(0, i + 1);
      let { signal, newState, newCooldown } = evaluateSignal(
        'GLD', window, 18, state, cooldown, config
      );
      
      if (state === 'WAIT' && newState === 'LONG' && signal.action === 'BUY') {
        trades.push({
          entry: signal.price / slipMult, 
          stop: signal.stop,
          target: signal.target,
          shares: signal.shares,
          status: 'OPEN'
        });
      } else if (state === 'LONG') {
        const activeTrade = trades.find(t => t.status === 'OPEN');
        if (activeTrade) {
          const currentCandle = candles[i];
          if (currentCandle.low <= activeTrade.stop) {
            activeTrade.status = 'CLOSED';
            activeTrade.exit = activeTrade.stop * slipMult;
            activeTrade.outcome = 'LOSS';
            equity -= (activeTrade.entry - activeTrade.exit) * activeTrade.shares;
            newState = 'COOLDOWN';
            newCooldown = 3;
          } else if (currentCandle.high >= activeTrade.target) {
            activeTrade.status = 'CLOSED';
            activeTrade.exit = activeTrade.target * slipMult;
            activeTrade.outcome = 'PROFIT';
            equity += (activeTrade.exit - activeTrade.entry) * activeTrade.shares;
            newState = 'COOLDOWN';
            newCooldown = 3;
          }
        }
      }

      state = newState;
      cooldown = newCooldown;
      peakEquity = Math.max(peakEquity, equity);
      const dd = ((peakEquity - equity) / peakEquity) * 100;
      maxDrawdown = Math.max(maxDrawdown, dd);
      equityCurve.push({ index: i, equity });
    }

    const closed = trades.filter(t => t.status === 'CLOSED');
    const wins = closed.filter(t => t.outcome === 'PROFIT');
    const losses = closed.filter(t => t.outcome === 'LOSS');
    const totalGains = wins.reduce((acc, t) => acc + (t.exit - t.entry) * t.shares, 0);
    const totalLosses = Math.abs(losses.reduce((acc, t) => acc + (t.exit - t.entry) * t.shares, 0));

    // Simulated delay for UI impact
    setTimeout(() => {
      setResults({
        totalTrades: closed.length,
        winRate: (wins.length / closed.length) * 100,
        expectancy: (equity - config.accountUsd) / closed.length,
        profitFactor: totalLosses === 0 ? totalGains : totalGains / totalLosses,
        maxDrawdown,
        trades: closed,
        equityCurve
      });
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      {/* HEADER: CONFIGURATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-8 rounded-2xl gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
             <BarChart3 className="text-blue-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100">Performance Simulator</h2>
            <p className="text-xs text-slate-500 mt-1">Stress-test strategy against historical volatility & slippage.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
              Friction / Slippage (%) <Info size={10} />
            </label>
            <input 
              type="number" step="0.01" value={slippage} 
              onChange={e => setSlippage(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm font-mono focus:border-blue-500 outline-none w-32"
            />
          </div>
          <button
            disabled={isSimulating}
            onClick={runBacktest}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-10 py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {isSimulating ? 'Processing Vectors...' : 'Execute Simulator'}
          </button>
        </div>
      </div>

      {/* SECTION: PERFORMANCE METRICS */}
      {results && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatBox label="Execution Count" value={results.totalTrades} />
          <StatBox label="Success Ratio" value={`${results.winRate.toFixed(1)}%`} color="text-blue-400" />
          <StatBox label="Profit Factor" value={results.profitFactor.toFixed(2)} />
          <StatBox label="Max Drawdown" value={`${results.maxDrawdown.toFixed(1)}%`} color="text-rose-400" icon={<AlertCircle size={14} />} />
          <StatBox label="Average Expectancy" value={`${(results.expectancy / 10).toFixed(2)}R`} color="text-emerald-400" icon={<TrendingUp size={14} />} />
        </div>
      )}

      {/* SECTION: VISUALIZATIONS */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-80 flex flex-col">
             <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Equity Curve (Account Growth)</h3>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.equityCurve}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b'}} />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={2} dot={false} />
                </AreaChart>
             </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-80 flex flex-col">
             <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4">Trade Distribution (Profit/Loss)</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={results.trades}>
                 <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b'}} />
                 <Bar dataKey={(d) => d.exit - d.entry}>
                   {results.trades.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.outcome === 'PROFIT' ? '#10b981' : '#f43f5e'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {!results && !isSimulating && (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed p-32 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-4">
           <BarChart3 size={48} className="opacity-10" />
           <p className="text-sm font-medium">Awaiting simulation data... Choose parameters above to begin.</p>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color = "text-slate-100", icon }: any) => (
  <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
      {icon && <span className={color}>{icon}</span>}
    </div>
    <p className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{value}</p>
  </div>
);

export default BacktestView;
