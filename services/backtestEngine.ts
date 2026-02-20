
import { Candle, IStrategy, AppConfig, Position, Signal } from '../types';
import { getHistoricalContext } from './marketProvider';
import { RiskManager } from './riskManager';

export class BacktestEngine {
  static async run(strategy: IStrategy, symbol: string, config: AppConfig) {
    const historicalData = await getHistoricalContext(symbol);
    if (historicalData.length < 250) throw new Error("INSUFFICIENT_HISTORICAL_DATA");

    const slippage = 0.001; 
    let equity = config.accountUsd;
    let peakEquity = equity;
    let maxDrawdown = 0;
    const equityCurve: { timestamp: number; equity: number }[] = [];
    const trades: any[] = [];
    let activePosition: Position | null = null;

    // We start at index 200 to have a full indicator warmup
    for (let i = 200; i < historicalData.length; i++) {
      const window = historicalData.slice(0, i + 1);
      const processed = strategy.populateIndicators(window);
      const current = processed[processed.length - 1];

      if (!activePosition) {
        // Evaluate Entry
        const signal = strategy.checkEntry(symbol, processed, 18, config);
        if (signal) {
          // Mock account for sizing
          const mockAccount = { equity, drawdown: 0, balance: equity, peakEquity: equity, dailyPnL: 0, history: [] };
          const shares = RiskManager.calculateSize(signal, current, mockAccount, config);
          
          if (shares > 0) {
            const entryPrice = current.close * (1 + slippage);
            const stop = current.close - (current.atr14 || (current.close * 0.02)) * 2.5;
            const target = current.close + (current.atr14 || (current.close * 0.02)) * 4.0;
            
            activePosition = {
              symbol,
              entry: entryPrice,
              shares,
              stop,
              target,
              openedTs: current.timestamp
            };
          }
        }
      } else {
        // Evaluate Exit
        const shouldExit = strategy.checkExit(activePosition, current);
        if (shouldExit) {
          const exitPrice = current.close * (1 - slippage);
          const pnl = (exitPrice - activePosition.entry) * activePosition.shares;
          equity += pnl;
          
          trades.push({
            ...activePosition,
            exit: exitPrice,
            pnl,
            outcome: pnl > 0 ? 'PROFIT' : 'LOSS'
          });
          
          activePosition = null;
        }
      }

      peakEquity = Math.max(peakEquity, equity);
      maxDrawdown = Math.max(maxDrawdown, ((peakEquity - equity) / peakEquity) * 100);
      equityCurve.push({ timestamp: current.timestamp, equity });
    }

    return {
      totalReturn: ((equity - config.accountUsd) / config.accountUsd) * 100,
      winRate: (trades.filter(t => t.pnl > 0).length / trades.length) * 100,
      maxDrawdown,
      profitFactor: this.calculateProfitFactor(trades),
      trades,
      equityCurve
    };
  }

  private static calculateProfitFactor(trades: any[]) {
    const grossProfits = trades.filter(t => t.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const grossLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((a, b) => a + b.pnl, 0));
    return grossLosses === 0 ? grossProfits : grossProfits / grossLosses;
  }
}
