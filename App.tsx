
import React, { useState, useEffect } from 'react';
// Fix: Added missing Sparkles icon import
import { Sparkles } from 'lucide-react';
import { WATCHLIST, DEFAULT_CONFIG } from './constants';
import { Candle, Signal, BotState, AppConfig, JournalTrade, MacroCheck } from './types';
import { fetchLatestVix } from './services/dataModule';
import { evaluateSignal } from './services/engine';
import { fetchDeterministicPrices, getHistoricalContext, MarketTicker } from './services/marketProvider';
import { validateMacroThesis } from './services/macroService';
import { saveTrade } from './services/journalService';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BacktestView from './components/BacktestView';
import JournalView from './components/JournalView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'backtest' | 'journal' | 'settings'>('dashboard');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [marketData, setMarketData] = useState<Record<string, Candle[]>>({});
  const [latestTickers, setLatestTickers] = useState<MarketTicker[]>([]);
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
  const [macroStatus, setMacroStatus] = useState<MacroCheck | null>(null);

  // 1. Initialize Historical Context (Static)
  useEffect(() => {
    const initialData: Record<string, Candle[]> = {};
    WATCHLIST.forEach(symbol => {
      initialData[symbol] = getHistoricalContext(symbol, 400);
    });
    setMarketData(initialData);
  }, []);

  // 2. High-Frequency Ticker Loop (Deterministic 5s)
  useEffect(() => {
    if (!isRunning) return;
    const tick = async () => {
      const prices = await fetchDeterministicPrices(WATCHLIST);
      setLatestTickers(prices);
      setVix(fetchLatestVix());

      setMarketData(prev => {
        const next = { ...prev };
        prices.forEach(ticker => {
          const history = next[ticker.symbol] || [];
          if (history.length === 0) return;
          const last = history[history.length - 1];
          const newCandle: Candle = {
            ...last,
            timestamp: ticker.timestamp,
            close: ticker.price,
            high: Math.max(last.high, ticker.price),
            low: Math.min(last.low, ticker.price),
            volume: ticker.volume
          };
          next[ticker.symbol] = [...history.slice(1), newCandle];
        });
        return next;
      });
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [isRunning]);

  // 3. Low-Frequency Macro Validation Loop (AI Grounding 5m)
  useEffect(() => {
    if (!isRunning || !config.isAiEnabled) return;
    const checkMacro = async () => {
      const res = await validateMacroThesis(WATCHLIST);
      setMacroStatus(res);
    };
    checkMacro();
    const id = setInterval(checkMacro, 300000);
    return () => clearInterval(id);
  }, [isRunning, config.isAiEnabled]);

  // 4. Tactical Evaluation & Persistence
  useEffect(() => {
    WATCHLIST.forEach(symbol => {
      const candles = marketData[symbol];
      if (!candles || candles.length < 250) return;

      const { signal, newState, newCooldown } = evaluateSignal(
        symbol, candles, vix, botStates[symbol], cooldowns[symbol], config
      );

      // Forensic Logging: Commit to Journal on LONG transition
      if (botStates[symbol] === 'WAIT' && newState === 'LONG' && signal.action === 'BUY') {
        saveTrade({
          id: signal.id,
          symbol,
          openedTs: Date.now(),
          entry: signal.entry || signal.price,
          shares: signal.shares || 0,
          stop: signal.stop || 0,
          target: signal.target || 0
        });
      }

      setSignals(prev => ({ ...prev, [symbol]: signal }));
      setBotStates(prev => ({ ...prev, [symbol]: newState }));
      setCooldowns(prev => ({ ...prev, [symbol]: newCooldown }));
    });
  }, [marketData, vix, config]);

  return (
    <div className="flex h-screen bg-[#020617] font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header vix={vix} isRunning={isRunning} setIsRunning={setIsRunning} config={config} />
        
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={WATCHLIST} 
              signals={signals} 
              marketData={marketData}
              botStates={botStates}
              tickers={latestTickers}
              macroStatus={macroStatus}
              isAiEnabled={config.isAiEnabled}
            />
          )}
          
          {activeTab === 'backtest' && <BacktestView config={config} />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <header>
                  <h2 className="text-3xl font-black tracking-tighter text-white">Institutional Config</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Refine capital allocation and AI macro thresholds.</p>
                </header>

                <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800/60 space-y-10 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-3xl border border-slate-800/40">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl border transition-all ${config.isAiEnabled ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-slate-800/40 text-slate-500 border-slate-700/40'}`}>
                        {/* Fix: Using Sparkles icon which is now imported */}
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">AI Thesis Grounding</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Consult Gemini 3 Pro for world-event risk validation.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, isAiEnabled: !config.isAiEnabled})}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 ${config.isAiEnabled ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${config.isAiEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Equity (USD)</label>
                      <input 
                        type="number" value={config.accountUsd}
                        onChange={(e) => setConfig({...config, accountUsd: Number(e.target.value)})}
                        className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-5 px-6 text-xl font-mono font-black text-blue-400 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Unit (%)</label>
                      <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl py-5 px-6 flex items-center justify-between">
                        <input 
                          type="range" min="0.1" max="5.0" step="0.1"
                          value={config.riskPct}
                          onChange={(e) => setConfig({...config, riskPct: Number(e.target.value)})}
                          className="flex-1 mr-6 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-xl font-black font-mono text-emerald-400">{config.riskPct}%</span>
                      </div>
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
