
/**
 * @file services/indicators.ts
 * @description High-performance mathematical implementation of technical indicators.
 * Optimized for O(1) rolling updates where possible.
 */

import { Candle, Indicators } from '../types';

/**
 * Calculates the Exponential Moving Average.
 * Optimized to prevent re-calculation of the entire history.
 */
export const calculateEMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  
  // Start with simple average for the first period
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Apply the EMA formula for the rest
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
  }
  return ema;
};

/**
 * Calculates a single rolling EMA step.
 * Useful for high-frequency updates (O(1)).
 */
export const rollingEMA = (prevEma: number, currentPrice: number, period: number): number => {
  const k = 2 / (period + 1);
  return (currentPrice - prevEma) * k + prevEma;
};

/**
 * Calculates the Relative Strength Index.
 * Measures momentum and overbought/oversold conditions.
 */
export const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length <= period) return 50;
  
  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

/**
 * Calculates the Average True Range.
 * Critical for volatility-based risk management.
 */
export const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length <= period) return 0;
  const trs: number[] = [];
  
  for (let i = Math.max(1, candles.length - period - 1); i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close)
    );
    trs.push(tr);
  }
  
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
};

/**
 * Optimized batch calculation for the strategy engine.
 */
export const calculateIndicators = (candles: Candle[]): Indicators => {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  // For production performance, we slice the lookback to the minimum required window
  const lookback = 250; 
  const activeCloses = closes.slice(-lookback);
  const activeCandles = candles.slice(-lookback);

  return {
    ema20: calculateEMA(activeCloses, 20),
    ema200: calculateEMA(activeCloses, 200),
    rsi14: calculateRSI(activeCloses, 14),
    atr14: calculateATR(activeCandles, 14),
    volSma20: volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  };
};
