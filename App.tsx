
import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, Globe, Radio } from 'lucide-react';
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
  const [isPrimed, setIsPrimed] = useState(false);

  // 1. ASYNC ENGINE WARMUP: Fetch Real Historical Data
  useEffect(() => {
    const warmup = async () => {
      const initialData: Record<string, Candle[]> = {};
      await Promise.all(WATCHLIST.map(async (symbol) => {
        const history = await getHistoricalContext(symbol);
        initialData[symbol] = history;
      }));
      setMarketData(initialData);
      setIsPrimed(true);
    };
    warmup();
  }, []);

  // 2. LIVE DETERMINISTIC TICK LOOP (5s Resolution)
  useEffect(() => {
    if (!isRunning || !isPrimed) return;
    
    const tick = async () => {
      const prices = await fetchDeterministicPrices(WATCHLIST);
      
      // FAIL-CLOSED GATE: Halt processing if real data feed is lost
      if (prices.length === 0) {
        console.warn("RE-SYNCING: Live feed interrupted. Holding previous state.");
        return;
      }

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
  }, [isRunning, isPrimed]);

  // 3. ASYNC MACRO THESIS VALIDATION (5m Cycle)
  useEffect(() => {
    if (!isRunning || !config.isAiEnabled || !isPrimed) return;
    const checkMacro = async () => {
      const result = await validateMacroThesis(WATCHLIST);
      setMacroStatus(result);
    };
    checkMacro();
    const id = setInterval(checkMacro, 300000);
    return () => clearInterval(id);
  }, [isRunning, config.isAiEnabled, isPrimed]);

  // 4. SIGNAL ORCHESTRATION & LEDGER COMMITS
  useEffect(() => {
    if (!isPrimed) return;

    WATCHLIST.forEach(symbol => {
      const candles = marketData[symbol];
      if (!candles || candles.length < 250) return;

      const { signal, newState, newCooldown } = evaluateSignal(
        symbol, candles, vix, botStates[symbol], cooldowns[symbol], config
      );

      // ASYNC PERSISTENCE: Record transitions to LONG in the ledger
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
  }, [marketData, vix, config, isPrimed]);

  return (
    <div className="flex h-screen bg-[#020617] font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header vix={vix} isRunning={isRunning} setIsRunning={setIsRunning} config={config} />
        
        {/* NETWORK STATUS OVERLAY */}
        <div className="bg-slate-900/40 border-b border-slate-800/40 px-10 py-1.5 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <Radio size={12} className={latestTickers.length > 0 ? "text-emerald-500 animate-pulse" : "text-rose-500"} />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Feed: Yahoo Finance Real-time</span>
             </div>
             <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
               <Globe size={12} className={macroStatus ? "text-blue-500" : "text-slate-700"} />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Macro Thesis: Grounded</span>
             </div>
           </div>
           {!isPrimed && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Priming Historical Context...</span>}
        </div>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {!isPrimed ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
               <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-500">Synchronizing Live Financial Vectors</p>
            </div>
          ) : (
            <>
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
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Operational Hub</h2>
                      <p className="text-slate-500 text-sm font-medium mt-1">Institutional-grade risk guardrails and AI thesis control.</p>
                    </header>

                    <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800/60 space-y-10 backdrop-blur-md shadow-2xl">
                      <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-3xl border border-slate-800/40">
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl border transition-all ${config.isAiEnabled ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-slate-800/40 text-slate-500 border-slate-700/40'}`}>
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider">Strategic Grounding</h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Cross-reference technical setups with live geopolitical news.</p>
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
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Equity Pool (USD)</label>
                          <input 
                            type="number" value={config.accountUsd}
                            onChange={(e) => setConfig({...config, accountUsd: Number(e.target.value)})}
                            className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-5 px-6 text-xl font-mono font-black text-blue-400 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Risk Per Node (%)</label>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
