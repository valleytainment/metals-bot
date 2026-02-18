
import React from 'react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Area 
} from 'recharts';
import { Candle } from '../types';

interface TradingChartProps {
  symbol: string;
  candles: Candle[];
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, candles }) => {
  const data = candles.slice(-50).map(c => ({
    time: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: c.close,
    high: c.high,
    low: c.low
  }));

  const minPrice = Math.min(...data.map(d => d.low)) * 0.9995;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.0005;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="time" 
          axisLine={false} 
          tickLine={false} 
          interval={10}
          tick={{ fontSize: 9, fill: '#475569', fontWeight: 700, fontFamily: 'JetBrains Mono' }} 
        />
        <YAxis 
          domain={[minPrice, maxPrice]} 
          hide 
        />
        <Tooltip
          cursor={{ stroke: '#1e293b', strokeWidth: 1 }}
          contentStyle={{ 
            backgroundColor: '#020617', 
            border: '1px solid #1e293b', 
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
            color: '#f8fafc',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          }}
          itemStyle={{ color: '#3b82f6' }}
          labelStyle={{ color: '#64748b', marginBottom: '4px' }}
        />
        <Area 
          type="monotone" 
          dataKey="price" 
          stroke="#3b82f6" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorPrice)" 
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default TradingChart;
