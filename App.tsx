
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sparkles, Radio, Database, Bell, ShieldCheck, Globe, AlertTriangle, ShieldX, Wallet } from 'lucide-react';
import { WATCHLIST, DEFAULT_CONFIG } from './constants';
import { Candle, Signal, BotState, AppConfig, MacroCheck, Position } from './types';
import { MetalsStrategy } from './services/strategy';
import { PaperEngine } from './services/paperEngine';
import { RiskManager } from './services/riskManager';
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
  const [config, setConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG, paperTrading: true });
  const [marketData, setMarketData] = useState<Record<string, Candle[]>>({});
  const [latestTickers, setLatestTickers] = useState<MarketTicker[]>([]);
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  
  // High-performance Engines
  const strategy = useMemo(() => new MetalsStrategy(), []);
  const paperEngine = useMemo(() => new PaperEngine(config.accountUsd), [config.accountUsd]);
  
  const [paperAccount, setPaperAccount] = useState(paperEngine.getAccount());
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  
  const [vix, setVix] = useState(20);
  const [isRunning, setIsRunning] = useState(true);
  const [macroStatus, setMacroStatus] = useState<MacroCheck | null>(null);
  const [isPrimed, setIsPrimed] = useState(false);
  const [dataIntegrity, setDataIntegrity] = useState(0); 
  const [feedStatus, setFeedStatus] = useState<'LIVE' | 'DISCONNECTED'>('DISCONNECTED');

  const playAlertSound = useCallback((type: 'entry' | 'exit') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type === 'entry' ? 'sine' : 'square';
      osc.frequency.setValueAtTime(type === 'entry' ? 880 : 440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) { console.warn("Audio Context blocked."); }
  }, []);

  // 1. SYSTEM INITIALIZATION
  useEffect(() => {
    const warmup = async () => {
      if ("Notification" in window) await Notification.requestPermission();
      const initialData: Record<string, Candle[]> = {};
      let realCount = 0;
      await Promise.all(WATCHLIST.map(async (symbol) => {
        const history = await getHistoricalContext(symbol);
        initialData[symbol] = history.length > 0 ? strategy.populateIndicators(history) : [];
        if (history.length > 0) realCount++;
      }));
      setDataIntegrity(Math.round((realCount / WATCHLIST.length) * 100));
      setMarketData(initialData);
      setIsPrimed(true);
    };
    warmup();
  }, [strategy]);

  // 2. LIVE TICK LOOP
  useEffect(() => {
    if (!isRunning || !isPrimed) return;
    
    const tick = async () => {
      try {
        const allResults = await fetchDeterministicPrices(WATCHLIST);
        if (allResults.length === 0) {
          setFeedStatus('DISCONNECTED');
          setDataIntegrity(0);
          return;
        }

        const vixTicker = allResults.find(t => t.symbol === '^VIX');
        if (vixTicker) setVix(vixTicker.price);
        const prices = allResults.filter(t => t.symbol !== '^VIX');
        
        setFeedStatus('LIVE');
        setLatestTickers(prices);
        
        const tickerMap = new Map<string, Candle>();
        setMarketData(prev => {
          const next = { ...prev };
          prices.forEach(ticker => {
            const history = next[ticker.symbol] || [];
            if (history.length === 0) return;
            const last = history[history.length - 1];
            
            let currentCandle: Candle;
            if (ticker.timestamp === last.timestamp) {
              currentCandle = {
                ...last,
                close: ticker.price,
                high: Math.max(last.high, ticker.price),
                low: Math.min(last.low, ticker.price)
              };
              next[ticker.symbol][history.length - 1] = currentCandle;
            } else {
              currentCandle = {
                ...last,
                timestamp: ticker.timestamp,
                close: ticker.price,
                high: Math.max(last.high, ticker.price),
                low: Math.min(last.low, ticker.price),
                volume: ticker.volume,
                quality: 'REALTIME'
              };
              next[ticker.symbol] = [...history.slice(1), currentCandle];
            }
            // Populate indicators on every tick
            next[ticker.symbol] = strategy.populateIndicators(next[ticker.symbol]);
            tickerMap.set(ticker.symbol, currentCandle);
          });
          return next;
        });

        // Update Paper Engine with latest prices
        paperEngine.updateEquity(tickerMap);
        setPaperAccount(paperEngine.getAccount());

        // Process Signals & Trades
        prices.forEach(ticker => {
          const candles = marketData[ticker.symbol];
          if (!candles || candles.length < 200) return;

          const currentCandle = candles[candles.length - 1];
          const activePos = paperEngine.getPositions().find(p => p.symbol === ticker.symbol);

          if (!activePos) {
            const signal = strategy.checkEntry(ticker.symbol, candles, vix, config);
            if (signal && !RiskManager.isSafetyTripped(paperAccount)) {
              const shares = RiskManager.calculateSize(signal, currentCandle, paperAccount, config);
              if (shares > 0 && paperEngine.openPosition(signal, currentCandle, shares)) {
                playAlertSound('entry');
                setSignals(prev => ({ ...prev, [ticker.symbol]: signal }));
              }
            }
          } else {
            // Check Exit
            if (strategy.checkExit(activePos, currentCandle)) {
              const trade = paperEngine.closePosition(ticker.symbol, currentCandle);
              if (trade) {
                playAlertSound('exit');
                saveTrade(trade);
              }
            }
          }
        });
        
        setOpenPositions(paperEngine.getPositions());
        setDataIntegrity(Math.round((prices.filter(p => p.isReal).length / WATCHLIST.length) * 100));

      } catch (err) {
        setFeedStatus('DISCONNECTED');
      }
    };

    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [isRunning, isPrimed, strategy, paperEngine, vix, config, marketData, paperAccount]);

  return (
    <div className="flex h-screen bg-[#020617] font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header vix={vix} isRunning={isRunning} setIsRunning={setIsRunning} config={config} />
        
        <div className="bg-slate-900/40 border-b border-slate-800/40 px-10 py-2 flex items-center justify-between">
           <div className="flex items-center gap-8">
             <div className="flex items-center gap-2">
               <Radio size={12} className={feedStatus === 'LIVE' ? "text-emerald-500 animate-pulse" : "text-rose-500"} />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 Feed: {feedStatus === 'LIVE' ? 'Raw Upstream' : 'Disconnected'}
               </span>
             </div>
             
             <div className="flex items-center gap-2 border-l border-slate-800 pl-8">
               <Wallet size={12} className="text-blue-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 Paper Equity: <span className="text-white">${paperAccount.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
               </span>
             </div>

             <div className="flex items-center gap-2 border-l border-slate-800 pl-8">
               <AlertTriangle size={12} className={paperAccount.drawdown > 10 ? "text-rose-500" : "text-emerald-500"} />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 Max DD: <span className={paperAccount.drawdown > 10 ? "text-rose-500" : "text-emerald-500"}>{paperAccount.drawdown.toFixed(2)}%</span>
               </span>
             </div>
           </div>
           {!isPrimed && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Syncing Registry...</span>}
        </div>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              watchlist={WATCHLIST} 
              signals={signals} 
              marketData={marketData}
              botStates={{}} // Bot state now derived from positions
              tickers={latestTickers}
              macroStatus={macroStatus}
              isAiEnabled={config.isAiEnabled}
            />
          )}
          {activeTab === 'backtest' && <BacktestView config={config} />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-10">
                <header>
                  <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">System Constraints</h2>
                </header>
                <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800/60 space-y-8">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Initial Balance</label>
                        <input type="number" value={config.accountUsd} onChange={e => setConfig({...config, accountUsd: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-blue-400" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Risk % per Trade</label>
                        <input type="number" value={config.riskPct} step="0.1" onChange={e => setConfig({...config, riskPct: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-emerald-400" />
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
