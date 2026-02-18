
/**
 * @file constants.ts
 * @description Global configuration constants for the strategy engine and UI.
 */

import { AppConfig } from './types';

/** Valid ETFs for the Metals Universe (Week 1 Scope) */
export const WATCHLIST = ['GLD', 'SLV', 'GDX', 'COPX', 'DBC'];

/** Fixed timeframe for the strategy logic */
export const TIMEFRAME = '15m';

/** Risk Multipliers: Based on 15m ATR for Metals Volatility */
export const ATR_MULTIPLIER_STOP = 2.5;
export const ATR_MULTIPLIER_TARGET = 4.0;

/** Recovery period (in candles) after an exit before new entries are allowed */
export const COOLDOWN_BARS = 3;

/** Out-of-the-box safe defaults for account risk management */
export const DEFAULT_CONFIG: AppConfig = {
  accountUsd: 10000,
  riskPct: 0.5,
  vixThresholdReduce: 25,
  vixThresholdPause: 30,
  watchlist: WATCHLIST,
  isAiEnabled: true,
};
