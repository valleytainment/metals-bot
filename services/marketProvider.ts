
/**
 * @file services/marketProvider.ts
 * @description Pure Real-World Market Data Engine. 
 * Strict integrity: No synthetic generators, no seeded fallbacks. 
 * If the link is severed, the system halts.
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
  isReal: boolean;
  sourceProxy?: string;
}

/**
 * STATEFUL PROXY HEALTH TRACKER
 */
interface ProxyNode {
  name: string;
  url: string;
  failureCount: number;
  lastFailure: number;
}

const PROXY_NODES: ProxyNode[] = [
  { name: 'CORS.IO', url: "https://corsproxy.io/?", failureCount: 0, lastFailure: 0 },
  { name: 'ALLORIGINS', url: "https://api.allorigins.win/raw?url=", failureCount: 0, lastFailure: 0 },
  { name: 'CODETABS', url: "https://api.codetabs.com/v1/proxy?quest=", failureCount: 0, lastFailure: 0 }
];

const CIRCUIT_BREAKER_THRESHOLD = 3;
const COOLDOWN_PERIOD = 60000;

const getHealthyProxies = () => {
  const now = Date.now();
  return [...PROXY_NODES].sort((a, b) => {
    const aPenalty = (a.failureCount >= CIRCUIT_BREAKER_THRESHOLD && now - a.lastFailure < COOLDOWN_PERIOD) ? 1000 : a.failureCount;
    const bPenalty = (b.failureCount >= CIRCUIT_BREAKER_THRESHOLD && now - b.lastFailure < COOLDOWN_PERIOD) ? 1000 : b.failureCount;
    return aPenalty - bPenalty;
  });
};

async function ultraFetch(url: string): Promise<{ data: any; proxy: string }> {
  let lastError = null;
  const healthyProxies = getHealthyProxies();
  
  for (const proxy of healthyProxies) {
    try {
      const target = proxy.name === 'CORS.IO' ? `${proxy.url}${url}` : `${proxy.url}${encodeURIComponent(url)}`;
      
      const response = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      const text = await response.text();
      
      if (!response.ok || text.includes('Too many requests') || text.includes('Edge:') || text.includes('Error:')) {
        throw new Error(`Proxy ${proxy.name} rejected: ${text.slice(0, 40)}`);
      }

      const data = JSON.parse(text);
      proxy.failureCount = 0;
      return { data, proxy: proxy.name };

    } catch (e: any) {
      console.warn(`[DATA_LINK_WARNING] ${proxy.name} failed: ${e.message}`);
      proxy.failureCount++;
      proxy.lastFailure = Date.now();
      lastError = e;
    }
  }
  throw lastError || new Error("UPSTREAM_TOTAL_BLACKOUT");
}

/**
 * Fetches real-time price vectors including the VIX (^VIX).
 */
export const fetchDeterministicPrices = async (symbols: string[]): Promise<MarketTicker[]> => {
  // Include VIX in the quote request to ensure volatility data is real-world
  const querySymbols = [...symbols, '^VIX'].join(',');
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${querySymbols}`;
  
  try {
    const { data, proxy } = await ultraFetch(yahooUrl);
    const results = data.quoteResponse?.result || [];

    if (results.length === 0) throw new Error("UPSTREAM_EMPTY");

    return results.map((quote: any) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      high: quote.regularMarketDayHigh || quote.regularMarketPrice,
      low: quote.regularMarketDayLow || quote.regularMarketPrice,
      volume: quote.regularMarketVolume || 0,
      timestamp: (quote.regularMarketTime || Date.now() / 1000) * 1000,
      changePercent: quote.regularMarketChangePercent || 0,
      isReal: true,
      sourceProxy: proxy
    }));
  } catch (error) {
    console.error("CRITICAL_UPSTREAM_FAILURE: Connection severed. No simulation available.");
    return [];
  }
};

/**
 * Historical Data Integrity Primer.
 */
export const getHistoricalContext = async (symbol: string): Promise<Candle[]> => {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=15m&range=5d`;
  
  try {
    const { data } = await ultraFetch(yahooUrl);
    const result = data.chart?.result?.[0];
    if (!result) throw new Error("UPSTREAM_MALFORMED");

    const indicators = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;

    if (!timestamps || !indicators) throw new Error("UPSTREAM_INCOMPLETE");

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
        quality: 'REALTIME' as const,
        anomalies: []
      };
    }).filter((c: any) => c !== null);
  } catch (error) {
    console.error(`Historical primer for ${symbol} failed. Connection strictly required.`);
    return [];
  }
};
