
/**
 * @file services/journalService.ts
 * @description Asynchronous Strategic Ledger Service.
 * Mimics real-world DB latency and provides an async interface for future cloud migration.
 */

import { JournalTrade } from '../types';

const STORAGE_KEY = 'metals_bot_ledger_v2';

/**
 * Persists a new trade entry asynchronously.
 */
export const saveTrade = async (trade: JournalTrade): Promise<void> => {
  // Simulate database write latency
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const existing = await getTrades();
  const updated = [trade, ...existing].slice(0, 1000);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Retrieves all ledger entries asynchronously.
 */
export const getTrades = async (): Promise<JournalTrade[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Wipes the registry asynchronously.
 */
export const clearTrades = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Forensic Export for auditing.
 */
export const exportLedger = async () => {
  const trades = await getTrades();
  const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metals_ledger_audit_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
