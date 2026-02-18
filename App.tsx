
import React, { useState, useEffect, useRef } from 'react';
import { 
  WATCHLIST, 
  DEFAULT_CONFIG 
} from './constants';
import { 
  Candle, 
  Signal, 
  BotState, 
  AppConfig 
} from './types';
import { 
  generateMockCandles, 
  fetchLatestVix 
} from './services/dataModule';
import { evaluateSignal } from './services/engine';
import { fetchVerifiedMarketStats, VerifiedPriceData } from './services/marketDataService';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BacktestView from './components/BacktestView';
import JournalView from './components/JournalView';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'backtest' | 'journal' | 'settings'>('dashboard');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [marketData, setMarketData] = useState<Record<string, Candle[]>>({});
  const [verifiedPrices, setVerifiedPrices] = useState<VerifiedPriceData[]>([]);
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
  
  // Adaptive Polling State
  const [pollInterval, setPollInterval] = useState(120000); // Start at 2m for heavy Grounding
  const [quotaTripped, setQuotaTripped] = useState(false);

  // Initialize data
  useEffect(() => {
    const initialData: Record<string, Candle[]> = {};
    WATCHLIST.forEach(symbol => {
      initialData[symbol] = generateMockCandles(symbol, 400);
    });
    setMarketData(initialData);
  }, []);

  // Verification Loop with Adaptive Polling & Circuit Breaker
  useEffect(() => {
    if (!isRunning) return;

    const performVerification = async () => {
      const liveStats = await fetchVerifiedMarketStats(WATCHLIST);
      
      if (liveStats.length > 0) {
        // Check for Quota Error in results
        const isExhausted = liveStats.some(s => s.error === 'QUOTA_EXHAUSTED');
        
        if (isExhausted) {
          setQuotaTripped(true);
          // Scale back interval significantly (Adaptive Backoff)
          setPollInterval(prev => Math.min(prev * 1.5, 600000)); // Max 10 mins
        } else {
          setQuotaTripped(false);
          setVerifiedPrices(liveStats);
          
          setMarketData(prev => {
            const next = { ...prev };
            liveStats.forEach(stat => {
              const candles = next[stat.symbol];
              if (!candles) return;
              const last = candles[candles.length - 1];
              const newCandle: Candle = {
                ...last,
                timestamp: Date.now(),
                close: stat.price || last.close,
                high: stat.high || last.high,
                low: stat.low || last.low,
                quality: 'REALTIME',
                anomalies: []
              };
              next[stat.symbol] = [...candles.slice(1), newCandle];
            });
            return next;
          });
        }
      }
    };

    performVerification();
    const verifyId = setInterval(performVerification, pollInterval);
    return () => clearInterval(verifyId);
  }, [isRunning, pollInterval]);

  // Evaluate Signals
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
    <div className="flex h-screen bg-slate-950 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          vix={vix} 
          isRunning={isRunning} 
          setIsRunning={setIsRunning} 
          config={config}
        />
        
        {quotaTripped && (
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-8 py-2 flex items-center justify-between text-[10px] font-bold text-orange-400 uppercase tracking-widest">
            <span>Quota Exhausted: Live Grounding Paused (Scaling Interval to {Math.round(pollInterval/1000)}s)</span>
            <span className="opacity-50">Circuit Breaker Active</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={WATCHLIST} 
              signals={signals} 
              marketData={marketData}
              botStates={botStates}
              verifiedData={verifiedPrices}
              isAiEnabled={config.isAiEnabled}
            />
          )}
          
          {activeTab === 'backtest' && <BacktestView config={config} />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Engine Parameters</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Configure risk management and capital allocation logic.</p>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-8 backdrop-blur-sm shadow-xl">
                  {/* AI Toggle Section */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${config.isAiEnabled ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'} transition-colors`}>
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">Gemini AI Analysis</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Real-time technical commentary and trade thesis.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, isAiEnabled: !config.isAiEnabled})}
                      className={`relative w-14 h-7 rounded-full transition-colors ${config.isAiEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${config.isAiEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Capital Allocation (USD)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-mono font-bold">$</div>
                      <input 
                        type="number" 
                        value={config.accountUsd}
                        onChange={(e) => setConfig({...config, accountUsd: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-10 pr-4 text-lg font-mono font-bold text-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Risk Per Trade (%)
                    </label>
                    <div className="flex items-center gap-6">
                      <input 
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={config.riskPct}
                        onChange={(e) => setConfig({...config, riskPct: Number(e.target.value)})}
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-2xl font-black font-mono text-emerald-400 w-20 text-right">{config.riskPct}%</span>
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
