
/**
 * @file services/indicators.ts
 * @description Mathematical implementation of technical indicators.
 */

import { Candle, Indicators } from '../types';

/**
 * Calculates the Exponential Moving Average.
 * Formula: EMA = Price(t) * k + EMA(y) * (1 – k)
 */
export const calculateEMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
};

/**
 * Calculates the Relative Strength Index.
 * Measures the speed and change of price movements.
 */
export const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[data.length - i] - data[data.length - i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

/**
 * Calculates the Average True Range.
 * Used for volatility-based stop loss placement.
 */
export const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length <= period) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    trs.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close)
    ));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
};

/**
 * Batch calculation of all strategy indicators for a symbol.
 */
export const calculateIndicators = (candles: Candle[]): Indicators => {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  return {
    ema20: calculateEMA(closes, 20),
    ema200: calculateEMA(closes, 200),
    rsi14: calculateRSI(closes, 14),
    atr14: calculateATR(candles, 14),
    volSma20: volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  };
};
