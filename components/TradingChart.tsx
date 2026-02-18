
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

  const minPrice = Math.min(...data.map(d => d.low)) * 0.999;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.001;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="time" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 9, fill: '#64748b' }} 
        />
        <YAxis 
          domain={[minPrice, maxPrice]} 
          hide 
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#0f172a', 
            border: '1px solid #334155', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#f8fafc'
          }}
          itemStyle={{ color: '#3b82f6' }}
        />
        <Area 
          type="monotone" 
          dataKey="price" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorPrice)" 
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default TradingChart;
