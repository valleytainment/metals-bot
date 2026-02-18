
import React from 'react';
import { Signal, Candle, BotState } from '../types';
import SignalCard from './SignalCard';

interface DashboardProps {
  watchlist: string[];
  signals: Record<string, Signal>;
  marketData: Record<string, Candle[]>;
  botStates: Record<string, BotState>;
}

const Dashboard: React.FC<DashboardProps> = ({ watchlist, signals, marketData, botStates }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {watchlist.map((symbol) => {
        const signal = signals[symbol];
        const candles = marketData[symbol] || [];
        const state = botStates[symbol];
        
        return (
          <SignalCard 
            key={symbol} 
            symbol={symbol} 
            signal={signal} 
            candles={candles}
            state={state}
          />
        );
      })}
    </div>
  );
};

export default Dashboard;
