
/**
 * @file services/macroService.ts
 * @description Uses Gemini 3 Pro Grounding to validate the "Macro Thesis" of a trade.
 * Checks for sudden news events (e.g. FOMC, Geopolitical shifts) that might invalidate a long position.
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MacroCheck {
  isSafe: boolean;
  reason: string;
  sources: { title: string; uri: string }[];
}

/**
 * Performs a real-time web search to see if any news "black swans" exist for the metal sector.
 */
export const validateMacroThesis = async (symbols: string[]): Promise<MacroCheck> => {
  if (!process.env.API_KEY) return { isSafe: true, reason: "AI Check Bypassed (No Key)", sources: [] };

  const prompt = `
    Analyze current breaking news for the metals market and ETFs: ${symbols.join(', ')}.
    Identify if there are any sudden negative catalysts (e.g., unexpected interest rate hikes, trade bans, major production surplus news) 
    that would make opening a NEW LONG position extremely risky in the next 4 hours.
    
    If safe, respond with "SAFE". If risky, provide a short explanation starting with "RISK:".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "SAFE";
    const isSafe = !text.toUpperCase().includes("RISK:");
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Financial Report',
        uri: chunk.web?.uri || ''
      }));

    return {
      isSafe,
      reason: text,
      sources
    };
  } catch (error) {
    console.warn("Macro Service: Grounding failed. Defaulting to technical-only mode.");
    return { isSafe: true, reason: "Manual technical validation required.", sources: [] };
  }
};
