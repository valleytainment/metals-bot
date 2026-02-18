import { GoogleGenAI } from "@google/genai";
import { Signal, Candle } from '../types';

// Initialize with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSignalCommentary = async (signal: Signal, candles: Candle[]): Promise<string> => {
  if (!process.env.API_KEY) return "AI analysis unavailable (Missing API Key).";
  
  const last5 = candles.slice(-5).map(c => `O: ${c.open.toFixed(2)}, H: ${c.high.toFixed(2)}, L: ${c.low.toFixed(2)}, C: ${c.close.toFixed(2)}`).join('\n');
  
  const prompt = `
    Analyze this trading signal for ${signal.symbol}.
    Action: ${signal.action}
    Price: ${signal.price}
    Confidence: ${signal.confidenceAdj}%
    Reasoning: ${signal.reasonCodes.join(', ')}
    VIX: ${signal.vix}
    
    Recent 15m Price Action:
    ${last5}
    
    Provide a concise, professional trader's insight (max 2 sentences) on the validity of this setup.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // response.text is a property access, not a function call
    return response.text || "No commentary available.";
  } catch (err) {
    return "Failed to fetch AI analysis.";
  }
};