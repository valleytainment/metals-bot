
/**
 * @file types.ts
 * @description Central Domain Model definitions for the Metals Signal Bot.
 * Defines the strict interfaces for Market Data, Signals, Indicators, and Bot State.
 */

/** Quality of the candle data provided by the API source */
export type CandleQuality = 'REALTIME' | 'DELAYED' | 'BACKFILLED' | 'INTERPOLATED';

/** Valid actions the Bot Engine can emit */
export type SignalAction = 'BUY' | 'HOLD' | 'EXIT' | 'WAIT' | 'PAUSE_DATA_STALE' | 'PAUSE_REGIME';

/** The internal lifecycle state of a specific symbol monitor */
export type BotState = 'WAIT' | 'LONG' | 'COOLDOWN';

/** Represents a single 15-minute price bar with integrity metadata */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quality: CandleQuality;
  anomalies: string[];
}

/** Pre-calculated technical indicators for a specific candle window */
export interface Indicators {
  /** Short-term trigger line */
  ema20: number;
  /** Long-term regime/trend filter */
  ema200: number;
  /** Momentum oscillator (0-100) */
  rsi14: number;
  /** Volatility measurement for stop/target placement */
  atr14: number;
  /** Volume trend filter */
  volSma20: number;
}

/** A generated trading signal containing entry/risk parameters */
export interface Signal {
  id: string;
  symbol: string;
  timestamp: number;
  action: SignalAction;
  price: number;
  entry?: number;
  stop?: number;
  target?: number;
  shares?: number;
  /** Base logic confidence (0-100) */
  confidence: number;
  /** Confidence adjusted by data quality/vix decay */
  confidenceAdj: number;
  /** Explanatory codes for transparency */
  reasonCodes: string[];
  /** Market volatility context at time of signal */
  vix: number;
  /** Flag for data pipeline latency */
  isStale: boolean;
}

/** Historical record of a trade execution for the Journal */
export interface JournalTrade {
  id: string;
  symbol: string;
  openedTs: number;
  closedTs?: number;
  entry: number;
  exit?: number;
  shares: number;
  stop: number;
  target: number;
  outcome?: 'PROFIT' | 'LOSS' | 'TIME_STOP';
  outcomeRationale?: string;
  rMultiple?: number;
}

/** Global Bot configuration parameters */
export interface AppConfig {
  /** Starting account equity in USD */
  accountUsd: number;
  /** Maximum percentage of equity to risk per trade */
  riskPct: number;
  /** VIX level at which to halve position sizing */
  vixThresholdReduce: number;
  /** VIX level at which to stop all new entries */
  vixThresholdPause: number;
  /** Array of symbols to monitor */
  watchlist: string[];
}
