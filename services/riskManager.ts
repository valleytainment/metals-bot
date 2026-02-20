
import { Signal, AppConfig, Position, PaperAccount, Candle } from '../types';

export class RiskManager {
  /**
   * Calculates position size using ATR volatility and equity risk.
   * Mirrors Hummingbot/Freqtrade's dynamic sizing logic.
   */
  static calculateSize(signal: Signal, candle: Candle, account: PaperAccount, config: AppConfig): number {
    const riskUsd = account.equity * (config.riskPct / 100);
    const atr = candle.atr14 || (candle.close * 0.01);
    
    // Stop distance is 2.5x ATR
    const stopDistance = 2.5 * atr;
    let shares = Math.floor(riskUsd / stopDistance);

    // Regime Scaling (VIX)
    if (signal.vix > config.vixThresholdReduce) {
      shares = Math.floor(shares * 0.5);
    }
    
    // Final check against absolute account limit (never more than 20% of equity in one ticker)
    const maxExposure = account.equity * 0.20;
    const currentExposure = shares * candle.close;
    if (currentExposure > maxExposure) {
      shares = Math.floor(maxExposure / candle.close);
    }

    return shares;
  }

  /**
   * Circuit breaker to stop trading if drawdown exceeds safe limits.
   */
  static isSafetyTripped(account: PaperAccount): boolean {
    // 20% Max Drawdown Protection
    if (account.drawdown > 20) return true;
    
    // 5% Daily Loss Limit
    if (account.dailyPnL < -(account.equity * 0.05)) return true;

    return false;
  }
}
