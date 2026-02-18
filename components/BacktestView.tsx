import React, { useState } from 'react';
import { 
  AppConfig, 
  Signal, 
  BotState, 
  Candle 
} from '../types';
import { generateMockCandles } from '../services/dataModule';
import { evaluateSignal } from '../services/engine';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BacktestViewProps {
  config: AppConfig;
}

const BacktestView: React.FC<BacktestViewProps> = ({ config }) => {
  const [results, setResults] = useState<{
    totalTrades: number;
    winRate: number;
    expectancy: number;
    equityCurve: number[];
    trades: any[];
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runBacktest = () => {
    setIsSimulating(true);
    
    // Simulate over 1000 candles for GLD
    const candles = generateMockCandles('GLD', 1000, 180, 0.003);
    const trades: any[] = [];
    let state: BotState = 'WAIT';
    let cooldown = 0;
    let equity = config.accountUsd;
    const equityCurve: number[] = [equity];

    // Simple simulation loop
    for (let i = 250; i < candles.length; i++) {
      const window = candles.slice(0, i + 1);
      // Change: Use let instead of const to allow manual state overrides when trade exit conditions are met
      let { signal, newState, newCooldown } = evaluateSignal(
        'GLD', 
        window, 
        18, 
        state, 
        cooldown, 
        config
      );
      
      if (state === 'WAIT' && newState === 'LONG' && signal.action === 'BUY') {
        // Entered trade
        trades.push({
          entry: signal.price,
          stop: signal.stop,
          target: signal.target,
          shares: signal.shares,
          entryTs: candles[i].timestamp,
          status: 'OPEN'
        });
      } else if (state === 'LONG') {
        const activeTrade = trades.find(t => t.status === 'OPEN');
        if (activeTrade) {
          const currentCandle = candles[i];
          // Check stop/target
          if (currentCandle.low <= activeTrade.stop) {
            activeTrade.status = 'CLOSED';
            activeTrade.exit = activeTrade.stop;
            activeTrade.outcome = 'LOSS';
            const loss = (activeTrade.entry - activeTrade.exit) * activeTrade.shares;
            equity -= loss;
            // Fix: Reassigning let variables to initiate cooldown
            newState = 'COOLDOWN';
            newCooldown = 3;
          } else if (currentCandle.high >= activeTrade.target) {
            activeTrade.status = 'CLOSED';
            activeTrade.exit = activeTrade.target;
            activeTrade.outcome = 'PROFIT';
            const gain = (activeTrade.exit - activeTrade.entry) * activeTrade.shares;
            equity += gain;
            // Fix: Reassigning let variables to initiate cooldown
            newState = 'COOLDOWN';
            newCooldown = 3;
          }
        }
      }

      state = newState;
      cooldown = newCooldown;
      equityCurve.push(equity);
    }

    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => t.outcome === 'PROFIT').length;
    
    setTimeout(() => {
      setResults({
        totalTrades: closedTrades.length,
        winRate: (wins / closedTrades.length) * 100,
        expectancy: (equity - config.accountUsd) / closedTrades.length,
        equityCurve,
        trades: closedTrades
      });
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Strategy Backtester</h2>
        <button
          disabled={isSimulating}
          onClick={runBacktest}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSimulating ? 'Processing...' : 'Run GLD Backtest (1000 Bars)'}
        </button>
      </div>

      {!results && !isSimulating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          Click the button above to start a walk-forward simulation using the current strategy rules.
        </div>
      )}

      {isSimulating && (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-sm animate-pulse">Running Monte Carlo Simulations...</p>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Trades</p>
            <p className="text-3xl font-black">{results.totalTrades}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold">Win Rate</p>
            <p className="text-3xl font-black text-blue-500">{results.winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold">Avg Profit / Trade</p>
            <p className="text-3xl font-black text-green-500">${results.expectancy.toFixed(2)}</p>
          </div>

          <div className="md:col-span-3 bg-slate-900 p-6 rounded-xl border border-slate-800 h-64">
             <h3 className="text-sm font-bold uppercase mb-4 text-slate-500">Equity Curve (Walk-Forward)</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={results.trades}>
                 <XAxis hide />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs shadow-xl">
                            <p className="text-blue-400 font-bold mb-1">{data.outcome}</p>
                            <p>Profit: ${(data.exit - data.entry).toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                 />
                 <Bar dataKey={(d) => d.exit - d.entry}>
                   {results.trades.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.outcome === 'PROFIT' ? '#22c55e' : '#ef4444'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestView;