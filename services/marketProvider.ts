
/**
 * @file services/marketProvider.ts
 * @description Real-World Market Data Provider with Resilient Proxy Rotation.
 */

import { Candle } from '../types';

export interface MarketTicker {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
  changePercent: number;
  isReal?: boolean;
}

const ASSET_METRICS: Record<string, { base: number; vol: number }> = {
  'GLD': { base: 245.50, vol: 0.15 },
  'SLV': { base: 28.30, vol: 0.22 },
  'GDX': { base: 38.15, vol: 0.28 },
  'COPX': { base: 45.90, vol: 0.25 },
  'DBC': { base: 22.10, vol: 0.12 }
};

/**
 * World-Class Proxy Rotation for Browser-Only Environments
 * Bypasses CORS and prevents single-point-of-failure for market data.
 */
const PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest="
];

async function resilientFetch(url: string): Promise<Response> {
  let lastError = null;
  for (const proxy of PROXIES) {
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      if (response.ok) return response;
      console.warn(`Proxy ${proxy} returned status ${response.status}. Retrying next...`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("ALL_PROXIES_FAILED");
}

/**
 * Deterministic fallback generator for when Upstream is severed.
 */
const generateSeededPrice = (symbol: string, timestamp: number): number => {
  const metrics = ASSET_METRICS[symbol] || { base: 100, vol: 0.1 };
  const tick = Math.floor(timestamp / 5000);
  const hash = Array.from(symbol + tick).reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  const noise = (Math.sin(hash) * 10000 - Math.floor(Math.sin(hash) * 10000)) - 0.5;
  return metrics.base + (noise * metrics.vol);
};

/**
 * Fetches real prices from Yahoo Finance via resilient proxying.
 */
export const fetchDeterministicPrices = async (symbols: string[]): Promise<MarketTicker[]> => {
  const symbolList = symbols.join(',');
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}`;
  
  try {
    const response = await resilientFetch(yahooUrl);
    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    if (results.length === 0) throw new Error("EMPTY_UPSTREAM_RESPONSE");

    return results.map((quote: any) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice || generateSeededPrice(quote.symbol, Date.now()),
      high: quote.regularMarketDayHigh || quote.regularMarketPrice,
      low: quote.regularMarketDayLow || quote.regularMarketPrice,
      volume: quote.regularMarketVolume || 0,
      timestamp: (quote.regularMarketTime || Date.now() / 1000) * 1000,
      changePercent: quote.regularMarketChangePercent || 0,
      isReal: true
    }));
  } catch (error) {
    console.warn("Real-time tick failed. Using Deterministic Fallback.", error);
    const now = Date.now();
    return symbols.map(symbol => ({
      symbol,
      price: generateSeededPrice(symbol, now),
      high: generateSeededPrice(symbol, now) + 0.1,
      low: generateSeededPrice(symbol, now) - 0.1,
      volume: 100000,
      timestamp: now,
      changePercent: 0,
      isReal: false
    }));
  }
};

/**
 * Backfills historical context using proxied Yahoo Chart data.
 * Optimized for 15m candle close logic.
 */
export const getHistoricalContext = async (symbol: string): Promise<Candle[]> => {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=15m&range=5d`;
  
  try {
    const response = await resilientFetch(yahooUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error("MALFORMED_CHART_DATA");

    const indicators = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;

    if (!timestamps || !indicators) throw new Error("INCOMPLETE_CHART_DATA");

    return timestamps.map((ts: number, i: number) => {
      const close = indicators.close[i];
      if (close === null || close === undefined) return null;

      return {
        timestamp: ts * 1000,
        open: indicators.open[i] ?? close,
        high: indicators.high[i] ?? close,
        low: indicators.low[i] ?? close,
        close: close,
        volume: indicators.volume[i] ?? 0,
        quality: 'REALTIME',
        anomalies: []
      };
    }).filter((c: any) => c !== null);
  } catch (error) {
    console.error(`Upstream connection failed for ${symbol}. Initializing logic with safety buffer.`, error);
    const candles: Candle[] = [];
    const now = Date.now();
    for (let i = 300; i >= 0; i--) {
      const ts = now - (i * 15 * 60 * 1000);
      const price = generateSeededPrice(symbol, ts);
      candles.push({
        timestamp: ts,
        open: price, 
        high: price + (Math.random() * 0.1), 
        low: price - (Math.random() * 0.1), 
        close: price,
        volume: 50000, 
        quality: 'BACKFILLED', 
        anomalies: ['SIMULATED_DATA']
      });
    }
    return candles;
  }
};
