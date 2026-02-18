
import { 
  Candle, 
  Indicators, 
  Signal, 
  SignalAction, 
  BotState, 
  AppConfig 
} from '../types';
import { calculateIndicators } from './indicators';
import { ATR_MULTIPLIER_STOP, ATR_MULTIPLIER_TARGET, COOLDOWN_BARS } from '../constants';

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
  let confidence = 0;
  let newState = currentState;
  let newCooldown = cooldownCounter;

  // 1. Data Integrity Check
  const isStale = (Date.now() - latest.timestamp) > 25 * 60 * 1000;
  if (isStale) {
    return {
      signal: createSignal(symbol, latest.close, 'PAUSE_DATA_STALE', 0, ['STALE_DATA'], vix, true),
      newState: currentState,
      newCooldown: cooldownCounter
    };
  }

  // 2. Regime Filter
  if (vix > config.vixThresholdPause) {
    return {
      signal: createSignal(symbol, latest.close, 'PAUSE_REGIME', 0, ['HIGH_VIX_PAUSE'], vix, false),
      newState: currentState,
      newCooldown: cooldownCounter
    };
  }

  // 3. Logic based on state machine
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
    // BUY RULES
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
      confidence = 85;
      newState = 'LONG';
    } else {
      action = 'WAIT';
    }
  } else if (newState === 'LONG') {
    // EXIT RULES (Placeholder - usually handled by actual trade manager, but signals track them)
    // We stay long until an external exit trigger, but signal shows 'HOLD'
    action = 'HOLD';
    reasonCodes.push('POSITION_ACTIVE');
  }

  const signal = createSignal(symbol, latest.close, action, confidence, reasonCodes, vix, false);

  // Position Sizing
  if (action === 'BUY') {
    const stopPrice = latest.close - (ATR_MULTIPLIER_STOP * ind.atr14);
    const targetPrice = latest.close + (ATR_MULTIPLIER_TARGET * ind.atr14);
    const riskPerShare = latest.close - stopPrice;
    const riskUsd = config.accountUsd * (config.riskPct / 100);
    let shares = Math.floor(riskUsd / riskPerShare);
    
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

const createSignal = (
  symbol: string,
  price: number,
  action: SignalAction,
  confidence: number,
  reasonCodes: string[],
  vix: number,
  isStale: boolean
): Signal => ({
  id: Math.random().toString(36).substr(2, 9),
  symbol,
  timestamp: Date.now(),
  action,
  price,
  confidence,
  confidenceAdj: confidence, // For now simple
  reasonCodes,
  vix,
  isStale
});
