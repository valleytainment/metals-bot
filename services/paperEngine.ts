
import { PaperAccount, Position, Signal, Candle, JournalTrade } from '../types';

export class PaperEngine {
  private account: PaperAccount;
  private positions: Map<string, Position> = new Map();
  private slippage = 0.0005; // 0.05% slippage
  private fee = 0.001; // 0.1% transaction fee

  constructor(initialBalance: number) {
    this.account = {
      balance: initialBalance,
      equity: initialBalance,
      peakEquity: initialBalance,
      drawdown: 0,
      dailyPnL: 0,
      history: [{ timestamp: Date.now(), equity: initialBalance }]
    };
  }

  getAccount(): PaperAccount {
    return { ...this.account };
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  openPosition(signal: Signal, candle: Candle, shares: number): boolean {
    if (shares <= 0) return false;
    const cost = shares * signal.price * (1 + this.slippage);
    const totalCost = cost + (cost * this.fee);

    if (totalCost > this.account.balance) return false;

    this.account.balance -= totalCost;
    this.positions.set(signal.symbol, {
      symbol: signal.symbol,
      entry: signal.price * (1 + this.slippage),
      shares,
      stop: signal.stop || 0,
      target: signal.target || 0,
      openedTs: Date.now()
    });
    this.updateEquity(new Map([[signal.symbol, candle]]));
    return true;
  }

  closePosition(symbol: string, candle: Candle): JournalTrade | null {
    const pos = this.positions.get(symbol);
    if (!pos) return null;

    const proceeds = pos.shares * candle.close * (1 - this.slippage);
    const finalProceeds = proceeds - (proceeds * this.fee);
    
    this.account.balance += finalProceeds;
    this.positions.delete(symbol);

    const profit = finalProceeds - (pos.shares * pos.entry);
    this.account.dailyPnL += profit;

    return {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      openedTs: pos.openedTs,
      closedTs: Date.now(),
      entry: pos.entry,
      exit: candle.close,
      shares: pos.shares,
      stop: pos.stop,
      target: pos.target,
      outcome: profit > 0 ? 'PROFIT' : 'LOSS',
      rMultiple: profit / (pos.entry - pos.stop) / pos.shares
    };
  }

  updateEquity(tickers: Map<string, Candle>) {
    let currentPositionsValue = 0;
    this.positions.forEach((pos, symbol) => {
      const current = tickers.get(symbol);
      if (current) {
        currentPositionsValue += pos.shares * current.close;
      } else {
        currentPositionsValue += pos.shares * pos.entry;
      }
    });

    this.account.equity = this.account.balance + currentPositionsValue;
    this.account.peakEquity = Math.max(this.account.peakEquity, this.account.equity);
    this.account.drawdown = ((this.account.peakEquity - this.account.equity) / this.account.peakEquity) * 100;
    
    if (this.account.history.length === 0 || 
        Date.now() - this.account.history[this.account.history.length-1].timestamp > 60000) {
      this.account.history.push({ timestamp: Date.now(), equity: this.account.equity });
    }
  }
}
