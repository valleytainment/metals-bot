
import { Candle, Signal, IStrategy, Position, AppConfig, SignalAction } from '../types';
import { calculateIndicators } from './indicators';

export class MetalsStrategy implements IStrategy {
  name = 'Metals_Alpha_15m';
  timeframe = '15m';

  populateIndicators(candles: Candle[]): Candle[] {
    if (candles.length < 200) return candles;
    const indicators = calculateIndicators(candles);
    const last = candles[candles.length - 1];
    
    return [
      ...candles.slice(0, -1),
      { ...last, ...indicators }
    ];
  }

  checkEntry(symbol: string, candles: Candle[], vix: number, config: AppConfig): Signal | null {
    if (candles.length < 200) return null;
    
    const latest = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    
    // Technical Gates (Ours & Freqtrade parity)
    const trendOk = latest.close > (latest.ema200 || 0);
    const momentumOk = (latest.rsi14 || 0) >= 50;
    const triggerOk = latest.close > (latest.ema20 || 0);
    const volumeOk = latest.volume >= (latest.volSma20 || 0);
    
    const reasonCodes: string[] = [];
    if (trendOk) reasonCodes.push('TREND_UP');
    if (momentumOk) reasonCodes.push('MOMENTUM_OK');
    if (triggerOk) reasonCodes.push('TRIGGER_UP');
    if (volumeOk) reasonCodes.push('VOL_CONFIRM');

    if (trendOk && momentumOk && triggerOk && volumeOk) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        symbol,
        timestamp: Date.now(),
        action: 'BUY',
        price: latest.close,
        confidence: 85,
        confidenceAdj: 85,
        reasonCodes,
        vix,
        isStale: false
      };
    }

    return null;
  }

  checkExit(position: Position, currentCandle: Candle): boolean {
    // 1. Hard Risk Stop
    if (currentCandle.low <= position.stop) return true;
    
    // 2. Profit Target Hit
    if (currentCandle.high >= position.target) return true;

    // 3. Technical Exit (Trend Broken)
    if (currentCandle.ema200 && currentCandle.close < currentCandle.ema200) return true;

    return false;
  }
}
