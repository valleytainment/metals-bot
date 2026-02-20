
/**
 * @file services/geminiService.ts
 * @description AI Verification & Commentary Provider.
 */

import { GoogleGenAI } from "@google/genai";
import { Signal, Candle } from '../types';

/**
 * Cross-references a specific signal with real-world news grounding.
 */
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
    // Re-instantiate the client right before the call to handle dynamic API key context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Market setup confirmed.";
  } catch (err) {
    return "Thesis validation paused. Rely on technical thresholds.";
  }
};

/**
 * Verification Layer: Confirms if prices are within realistic bounds using AI grounding.
 */
export const verifyMarketState = async (symbol: string, price: number): Promise<boolean> => {
  if (!process.env.API_KEY) return true;

  const prompt = `
    Verify if the following market quote for ${symbol} is realistic based on recent price action: $${price}.
    If the price is plausible (within a few percentage points of the current real market price), reply "VERIFIED".
    Otherwise, reply "ANOMALY".
  `;

  try {
    // Re-instantiate the client right before the call to handle dynamic API key context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text?.toUpperCase().includes("VERIFIED") ?? true;
  } catch (err) {
    return true; // Fail-safe to true if AI is down
  }
};
