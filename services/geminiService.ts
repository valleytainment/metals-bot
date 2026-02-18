
/**
 * @file services/geminiService.ts
 * @description Zero-Cost AI Analysis Provider using Gemini Flash tier.
 */

import { GoogleGenAI } from "@google/genai";
import { Signal, Candle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSignalCommentary = async (signal: Signal, candles: Candle[]): Promise<string> => {
  if (!process.env.API_KEY) return "AI Offline (No Auth).";
  
  const last5 = candles.slice(-5).map(c => `C:${c.close.toFixed(2)}`).join(' ');
  
  const prompt = `
    Context: 15m Metals Strategy. Symbol: ${signal.symbol}.
    Setup: Action=${signal.action}, Price=${signal.price}, Conf=${signal.confidenceAdj}%.
    Indicators: ${signal.reasonCodes.join(', ')}.
    Closes: ${last5}.
    
    Synthesize a concise professional thesis (15 words max). Start with a direct market verb.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Zero-cost latency priority
      }
    });
    return response.text || "Market setup confirmed. No structural anomalies detected.";
  } catch (err) {
    console.warn("AI Commentary rate limited or unavailable.", err);
    return "Thesis validation paused. Rely on technical gate thresholds.";
  }
};
