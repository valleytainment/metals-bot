
import { GoogleGenAI } from "@google/genai";
import { MacroCheck } from '../types';

/**
 * SECURITY NOTE: In production, the API Key should be handled via a secure backend proxy.
 * This client-side implementation uses the injected environment key for platform compatibility.
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs a real-time web search for macro-economic catalysts.
 * Ensures the bot has "World Awareness" before committing capital.
 */
export const validateMacroThesis = async (symbols: string[]): Promise<MacroCheck> => {
  if (!process.env.API_KEY) {
    return { isSafe: true, reason: "Macro validation bypass (No Key)", sources: [] };
  }

  const prompt = `
    Search for current breaking news for the following ETFs: ${symbols.join(', ')}.
    Identify if there are any significant negative catalysts (e.g. FOMC rate surprises, geopolitcal conflict, metal-specific production surges).
    Respond with "SAFE" if no immediate long-side dangers exist.
    If risky, provide a concise explanation starting with "RISK:".
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
    
    // Extract grounding sources for transparency/auditing
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Sector Report',
        uri: chunk.web?.uri || ''
      }));

    return {
      isSafe,
      reason: text,
      sources: sources.slice(0, 5)
    };
  } catch (error) {
    console.warn("Macro Validation: Engine fallback to technical-only mode.");
    return { isSafe: true, reason: "Market sentiment analysis currently unavailable.", sources: [] };
  }
};
