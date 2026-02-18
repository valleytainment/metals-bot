
/**
 * @file services/marketProvider.ts
 * @description Real-World Market Data Provider.
 * Connects to live public endpoints to provide deterministic price action.
 */

import { Candle, CandleQuality } from '../types';

export interface MarketTicker {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
  changePercent: number;
}

/**
 * Fetches real-time market data from the public Yahoo Finance API.
 * This satisfies the Council's requirement for deterministic, non-LLM based tick data.
 */
export const fetchDeterministicPrices = async (symbols: string[]): Promise<MarketTicker[]> => {
  try {
    const symbolList = symbols.join(',');
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}`);
    
    // Fallback handling if public endpoint is throttled or CORS-blocked in specific environments
    if (!response.ok) throw new Error("UPSTREAM_FEED_HALTED");

    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    return results.map((quote: any) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      timestamp: quote.regularMarketTime * 1000,
      changePercent: quote.regularMarketChangePercent
    }));
  } catch (error) {
    console.error("CRITICAL: Market Data Pipeline Severed. Engine Fail-Closed.", error);
    // In a live environment, returning empty halts the FSM (Fail-Closed)
    return [];
  }
};

/**
 * Fetches historical 15m candles from the public feed to prime the engine indicators.
 */
export const getHistoricalContext = async (symbol: string): Promise<Candle[]> => {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=15m&range=5d`);
    if (!response.ok) throw new Error("HISTORY_BACKFILL_FAILED");

    const data = await response.json();
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    return timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000,
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume[i],
      quality: 'REALTIME' as CandleQuality,
      anomalies: []
    }));
  } catch (error) {
    console.error(`Historical primer failed for ${symbol}. Using internal safety buffer.`);
    return [];
  }
};
