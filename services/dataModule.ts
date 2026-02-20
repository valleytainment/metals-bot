
import { Candle, CandleQuality } from '../types';

/**
 * Generates synthetic candle data strictly for backtesting simulation only.
 * This is not used in the live market engine.
 */
export const generateMockCandles = (
  symbol: string, 
  count: number = 300, 
  startPrice: number = 200, 
  volatility: number = 0.002
): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  const now = Date.now();
  const interval = 15 * 60 * 1000;

  for (let i = count; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const change = currentPrice * volatility * (Math.random() - 0.5);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * 0.001);
    const low = Math.min(open, close) - (Math.random() * currentPrice * 0.001);
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      quality: 'BACKFILLED',
      anomalies: []
    });
    currentPrice = close;
  }
  return candles;
};

/**
 * VIX is now sourced from the live MarketTicker feed.
 * This function is kept as a placeholder if local logic is needed.
 */
export const fetchLatestVix = (): number => {
  return 0; // Handled by App.tsx from live ticker data
};
