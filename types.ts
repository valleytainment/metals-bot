
export type CandleQuality = 'REALTIME' | 'DELAYED' | 'BACKFILLED' | 'INTERPOLATED';
export type SignalAction = 'BUY' | 'HOLD' | 'EXIT' | 'WAIT' | 'PAUSE_DATA_STALE' | 'PAUSE_REGIME';
export type BotState = 'WAIT' | 'LONG' | 'COOLDOWN';

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

export interface Indicators {
  ema20: number;
  ema200: number;
  rsi14: number;
  atr14: number;
  volSma20: number;
}

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
  confidence: number;
  confidenceAdj: number;
  reasonCodes: string[];
  vix: number;
  isStale: boolean;
}

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

export interface AppConfig {
  accountUsd: number;
  riskPct: number;
  vixThresholdReduce: number;
  vixThresholdPause: number;
  watchlist: string[];
}
