
/**
 * @file services/journalService.ts
 * @description Robust persistence for the Strategic Ledger.
 * Provides forensic export capabilities for trade reviews.
 */

import { JournalTrade } from '../types';

const STORAGE_KEY = 'metals_bot_ledger_v2';

export const saveTrade = (trade: JournalTrade) => {
  const existing = getTrades();
  const updated = [trade, ...existing].slice(0, 1000); // Keep last 1000
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getTrades = (): JournalTrade[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearTrades = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Generates a JSON blob for forensic audit backup.
 */
export const exportLedger = () => {
  const trades = getTrades();
  const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metals_ledger_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
