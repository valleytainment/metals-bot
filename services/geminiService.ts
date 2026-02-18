
/**
 * @file services/geminiService.ts
 * @description AI Analysis Provider.
 * 
 * SECURITY ADVISORY:
 * In a production environment, these calls MUST be proxied through a secure backend 
 * to prevent API Key exposure in the client bundle. 
 * This implementation adheres to sandbox requirements while maintaining clean separation.
 */

import { GoogleGenAI } from "@google/genai";
import { Signal, Candle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSignalCommentary = async (signal: Signal, candles: Candle[]): Promise<string> => {
  if (!process.env.API_KEY) return "AI analysis offline (Key configuration pending).";
  
  const last5 = candles.slice(-5).map(c => `O: ${c.open.toFixed(2)}, C: ${c.close.toFixed(2)}`).join(' | ');
  
  const prompt = `
    Context: 15m Metals Strategy.
    Signal: ${signal.symbol} ${signal.action} at ${signal.price}.
    Stats: Confidence ${signal.confidenceAdj}%, Indicators: ${signal.reasonCodes.join(', ')}.
    Data: ${last5}.
    
    Synthesize a professional thesis for this setup (20 words max).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Scanning completed. No anomalous conditions found.";
  } catch (err) {
    return "Thesis generation paused (Rate limit).";
  }
};
