
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WATCHLIST, 
  DEFAULT_CONFIG 
} from './constants';
import { 
  Candle, 
  Signal, 
  BotState, 
  SignalAction, 
  AppConfig 
} from './types';
import { 
  generateMockCandles, 
  fetchLatestVix 
} from './services/dataModule';
import { evaluateSignal } from './services/engine';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BacktestView from './components/BacktestView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'backtest' | 'journal' | 'settings'>('dashboard');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [marketData, setMarketData] = useState<Record<string, Candle[]>>({});
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const [botStates, setBotStates] = useState<Record<string, BotState>>(() => {
    const initial: Record<string, BotState> = {};
    WATCHLIST.forEach(s => initial[s] = 'WAIT');
    return initial;
  });
  const [cooldowns, setCooldowns] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    WATCHLIST.forEach(s => initial[s] = 0);
    return initial;
  });
  const [vix, setVix] = useState(18);
  const [isRunning, setIsRunning] = useState(true);

  // Initialize data
  useEffect(() => {
    const initialData: Record<string, Candle[]> = {};
    WATCHLIST.forEach(symbol => {
      initialData[symbol] = generateMockCandles(symbol, 300);
    });
    setMarketData(initialData);
  }, []);

  // Update loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setVix(fetchLatestVix());
      
      setMarketData(prev => {
        const next = { ...prev };
        WATCHLIST.forEach(symbol => {
          const candles = next[symbol];
          if (!candles) return;
          const last = candles[candles.length - 1];
          // Simple walk forward simulation
          const newCandle: Candle = {
            ...last,
            timestamp: last.timestamp + (15 * 60 * 1000),
            close: last.close * (1 + (Math.random() - 0.5) * 0.002)
          };
          next[symbol] = [...candles.slice(1), newCandle];
        });
        return next;
      });
    }, 5000); // 5s tick for simulation speed

    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Evaluate Signals whenever market data or VIX updates
  useEffect(() => {
    WATCHLIST.forEach(symbol => {
      const candles = marketData[symbol];
      if (!candles || candles.length < 200) return;

      const { signal, newState, newCooldown } = evaluateSignal(
        symbol,
        candles,
        vix,
        botStates[symbol],
        cooldowns[symbol],
        config
      );

      setSignals(prev => ({ ...prev, [symbol]: signal }));
      setBotStates(prev => ({ ...prev, [symbol]: newState }));
      setCooldowns(prev => ({ ...prev, [symbol]: newCooldown }));
    });
  }, [marketData, vix, config]);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          vix={vix} 
          isRunning={isRunning} 
          setIsRunning={setIsRunning} 
          config={config}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={WATCHLIST} 
              signals={signals} 
              marketData={marketData}
              botStates={botStates}
            />
          )}
          
          {activeTab === 'backtest' && (
            <BacktestView config={config} />
          )}

          {activeTab === 'journal' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-xl">Trade Journal - Coming Soon</p>
              <p className="text-sm">Store manual entries and execution outcomes here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold">Bot Configuration</h2>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Account Balance (USD)</label>
                    <input 
                      type="number" 
                      value={config.accountUsd}
                      onChange={(e) => setConfig({...config, accountUsd: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Risk per Trade (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={config.riskPct}
                      onChange={(e) => setConfig({...config, riskPct: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                  <h3 className="text-lg font-semibold mb-3">VIX Safety Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Reduce Size Threshold</label>
                      <input 
                        type="number" 
                        value={config.vixThresholdReduce}
                        onChange={(e) => setConfig({...config, vixThresholdReduce: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Pause Trading Threshold</label>
                      <input 
                        type="number" 
                        value={config.vixThresholdPause}
                        onChange={(e) => setConfig({...config, vixThresholdPause: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
