
/**
 * @file services/macroService.ts
 * @description Advanced Grounding Engine for Sector News.
 */

import { GoogleGenAI } from "@google/genai";
import { MacroCheck } from '../types';

/**
 * Validates the current market regime using Google Search Grounding.
 * This acts as a "Circuit Breaker" for macro-level black swan events.
 */
export const validateMacroThesis = async (symbols: string[]): Promise<MacroCheck> => {
  if (!process.env.API_KEY) {
    return { isSafe: true, reason: "Bypassed (API Key Pending)", sources: [] };
  }

  const prompt = `
    Analyze current financial news and geopolitical events impacting the Metals Sector and ETFs: ${symbols.join(', ')}.
    Check for:
    1. Unexpected Central Bank rate decisions.
    2. Geopolitical escalations affecting supply chains (Russia, China, Middle East).
    3. Major mining production halts or labor strikes.
    
    If any significant "Black Swan" or bearish catalyst is active that would invalidate a LONG position in the next 24 hours, start your response with "RISK:".
    Otherwise, respond with "SAFE".
  `;

  try {
    // Create a new instance right before the call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "SAFE";
    const isSafe = !text.toUpperCase().includes("RISK:");
    
    // Extracting URLs from groundingChunks as per Google Search Grounding guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Sector Report',
        uri: chunk.web?.uri || ''
      }));

    return {
      isSafe,
      reason: text.replace("SAFE", "").replace("RISK:", "").trim() || "Market conditions stable.",
      sources: sources.slice(0, 3)
    };
  } catch (error) {
    return { isSafe: true, reason: "News telemetry interrupted. Proceed with technical caution.", sources: [] };
  }
};
