
/**
 * @file services/engine.ts
 * @description The "Decision Brain" of the bot. Evaluates strategy rules, 
 * market hours, data integrity, and regime filters to produce signals.
 */

import { 
  Candle, 
  Signal, 
  SignalAction, 
  BotState, 
  AppConfig 
} from '../types';
import { calculateIndicators } from './indicators';
import { ATR_MULTIPLIER_STOP, ATR_MULTIPLIER_TARGET } from '../constants';
import { isMarketOpen } from './marketHours';

/**
 * Core Evaluation Cycle
 * Executed every 15m (or on tick update in simulation).
 */
export const evaluateSignal = (
  symbol: string,
  candles: Candle[],
  vix: number,
  currentState: BotState,
  cooldownCounter: number,
  config: AppConfig
): { signal: Signal; newState: BotState; newCooldown: number } => {
  const latest = candles[candles.length - 1];
  const ind = calculateIndicators(candles);
  const reasonCodes: string[] = [];
  
  let action: SignalAction = 'WAIT';
  let baseConfidence = 0;
  let decayMultiplier = 1.0;
  let newState = currentState;
  let newCooldown = cooldownCounter;

  // --- PHASE 1: MARKET STATUS ---
  if (!isMarketOpen()) {
    return {
      signal: createSignal(symbol, latest.close, 'WAIT', 0, ['MARKET_CLOSED'], vix, false, 1.0),
      newState: currentState,
      newCooldown: cooldownCounter
    };
  }

  // --- PHASE 2: DATA INTEGRITY ---
  const isStale = (Date.now() - latest.timestamp) > 25 * 60 * 1000;
  if (isStale) {
    return {
      signal: createSignal(symbol, latest.close, 'PAUSE_DATA_STALE', 0, ['STALE_DATA'], vix, true, 1.0),
      newState: currentState,
      newCooldown: cooldownCounter
    };
  }

  // Confidence decay based on quality tags
  if (latest.quality === 'DELAYED') decayMultiplier *= 0.9;
  if (latest.anomalies.length > 0) decayMultiplier *= 0.8;

  // --- PHASE 3: REGIME FILTERS ---
  if (vix > config.vixThresholdPause) {
    return {
      signal: createSignal(symbol, latest.close, 'PAUSE_REGIME', 0, ['HIGH_VIX_PAUSE'], vix, false, 1.0),
      newState: currentState,
      newCooldown: cooldownCounter
    };
  }

  // --- PHASE 4: STATE MACHINE LOGIC ---
  if (currentState === 'COOLDOWN') {
    if (cooldownCounter <= 0) {
      newState = 'WAIT';
      newCooldown = 0;
    } else {
      action = 'WAIT';
      reasonCodes.push(`COOLDOWN_${cooldownCounter}_BARS`);
      newCooldown = cooldownCounter - 1;
    }
  }

  if (newState === 'WAIT') {
    // STRATEGY RULES:
    // 1. Trend: Price must be above 200 EMA
    // 2. Momentum: RSI must be 50+
    // 3. Trigger: Price must be above 20 EMA
    // 4. Volume: Volume must be above 20 SMA
    const trendOk = latest.close > ind.ema200;
    const momentumOk = ind.rsi14 >= 50;
    const triggerOk = latest.close > ind.ema20;
    const volumeOk = latest.volume >= ind.volSma20;

    if (trendOk) reasonCodes.push('TREND_UP');
    if (momentumOk) reasonCodes.push('MOMENTUM_OK');
    if (triggerOk) reasonCodes.push('TRIGGER_UP');
    if (volumeOk) reasonCodes.push('VOL_CONFIRM');

    if (trendOk && momentumOk && triggerOk && volumeOk) {
      action = 'BUY';
      baseConfidence = 85;
      newState = 'LONG';
    } else {
      action = 'WAIT';
    }
  } else if (newState === 'LONG') {
    action = 'HOLD';
    reasonCodes.push('POSITION_ACTIVE');
  }

  const signal = createSignal(symbol, latest.close, action, baseConfidence, reasonCodes, vix, false, decayMultiplier);

  // --- PHASE 5: RISK & SIZING ---
  if (action === 'BUY') {
    const stopPrice = latest.close - (ATR_MULTIPLIER_STOP * ind.atr14);
    const targetPrice = latest.close + (ATR_MULTIPLIER_TARGET * ind.atr14);
    const riskPerShare = latest.close - stopPrice;
    const riskUsd = config.accountUsd * (config.riskPct / 100);
    let shares = Math.floor(riskUsd / riskPerShare);
    
    // Regime scaling
    if (vix > config.vixThresholdReduce) {
      shares = Math.floor(shares * 0.5);
      signal.reasonCodes.push('REGIME_REDUCED_SIZE');
    }

    signal.entry = latest.close;
    signal.stop = stopPrice;
    signal.target = targetPrice;
    signal.shares = shares;
  }

  return { signal, newState, newCooldown };
};

/**
 * Helper to construct the Signal object with adjusted confidence.
 */
const createSignal = (
  symbol: string,
  price: number,
  action: SignalAction,
  confidence: number,
  reasonCodes: string[],
  vix: number,
  isStale: boolean,
  decay: number
): Signal => ({
  id: Math.random().toString(36).substr(2, 9),
  symbol,
  timestamp: Date.now(),
  action,
  price,
  confidence,
  confidenceAdj: Math.round(confidence * decay),
  reasonCodes,
  vix,
  isStale
});
