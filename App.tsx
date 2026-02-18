
import React, { useState, useEffect } from 'react';
import { WATCHLIST, DEFAULT_CONFIG } from './constants';
import { Candle, Signal, BotState, AppConfig, JournalTrade } from './types';
import { fetchLatestVix } from './services/dataModule';
import { evaluateSignal } from './services/engine';
import { fetchDeterministicPrices, getHistoricalContext, MarketTicker } from './services/marketProvider';
import { validateMacroThesis, MacroCheck } from './services/macroService';
import { saveTrade } from './services/journalService';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BacktestView from './components/BacktestView';
import JournalView from './components/JournalView';
import { Sparkles, ShieldAlert } from 'lucide-react';

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

  // Initialize Historical Context (Deterministic)
  useEffect(() => {
    const initialData: Record<string, Candle[]> = {};
    WATCHLIST.forEach(symbol => {
      initialData[symbol] = getHistoricalContext(symbol, 400);
    });
    setMarketData(initialData);
  }, []);

  // DETERMINISTIC PRICE FEED LOOP (Sub-second simulation)
  useEffect(() => {
    if (!isRunning) return;

    const tick = async () => {
      const prices = await fetchDeterministicPrices(WATCHLIST);
      setLatestTickers(prices);
      setVix(fetchLatestVix());

      setMarketData(prev => {
        const next = { ...prev };
        prices.forEach(ticker => {
          const history = next[ticker.symbol];
          if (!history) return;
          const last = history[history.length - 1];
          // Simple O(1) rolling update simulation for the terminal UI
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

    const intervalId = setInterval(tick, 5000); // 5s Ticks for UI fluidity
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // AI MACRO VALIDATION LOOP (Lower frequency grounding)
  useEffect(() => {
    if (!isRunning || !config.isAiEnabled) return;

    const checkMacro = async () => {
      const result = await validateMacroThesis(WATCHLIST);
      setMacroStatus(result);
    };

    checkMacro();
    const intervalId = setInterval(checkMacro, 300000); // Check every 5 mins
    return () => clearInterval(intervalId);
  }, [isRunning, config.isAiEnabled]);

  // SIGNAL EVALUATION & PERSISTENCE
  useEffect(() => {
    WATCHLIST.forEach(symbol => {
      const candles = marketData[symbol];
      if (!candles || candles.length < 250) return;

      const { signal, newState, newCooldown } = evaluateSignal(
        symbol,
        candles,
        vix,
        botStates[symbol],
        cooldowns[symbol],
        config
      );

      // Transition to LONG: Log the trade automatically
      if (botStates[symbol] === 'WAIT' && newState === 'LONG' && signal.action === 'BUY') {
        const trade: JournalTrade = {
          id: signal.id,
          symbol,
          openedTs: Date.now(),
          entry: signal.entry || signal.price,
          shares: signal.shares || 0,
          stop: signal.stop || 0,
          target: signal.target || 0
        };
        saveTrade(trade);
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
        <Header 
          vix={vix} 
          isRunning={isRunning} 
          setIsRunning={setIsRunning} 
          config={config}
        />
        
        {macroStatus && !macroStatus.isSafe && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-8 py-2 flex items-center justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} />
              <span>AI Macro Alert: {macroStatus.reason}</span>
            </div>
            <span className="opacity-50">Grounding Source: {macroStatus.sources[0]?.title || 'Financial News'}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={WATCHLIST} 
              signals={signals} 
              marketData={marketData}
              botStates={botStates}
              isAiEnabled={config.isAiEnabled}
              verifiedData={latestTickers.map(t => ({
                ...t,
                sources: macroStatus?.sources || []
              }))}
            />
          )}
          
          {activeTab === 'backtest' && <BacktestView config={config} />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-white">Engine Configuration</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Institutional-grade risk and intelligence parameters.</p>
                </div>

                <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800/60 space-y-10 backdrop-blur-md shadow-2xl">
                  {/* AI Toggle Section */}
                  <div className="flex items-center justify-between p-6 bg-slate-950/40 rounded-3xl border border-slate-800/40">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl ${config.isAiEnabled ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800/40 text-slate-500 border border-slate-700/40'} transition-all`}>
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Macro Grounding Thesis</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Enable Gemini 3 Pro to validate setups against live world news.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, isAiEnabled: !config.isAiEnabled})}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 ${config.isAiEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${config.isAiEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operating Capital (USD)</label>
                      <input 
                        type="number" 
                        value={config.accountUsd}
                        onChange={(e) => setConfig({...config, accountUsd: Number(e.target.value)})}
                        className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-5 px-6 text-xl font-mono font-black text-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Allocation (%)</label>
                      <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl py-5 px-6 flex items-center justify-between">
                        <input 
                          type="range" min="0.1" max="5.0" step="0.1"
                          value={config.riskPct}
                          onChange={(e) => setConfig({...config, riskPct: Number(e.target.value)})}
                          className="flex-1 mr-6 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
