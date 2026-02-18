# 🦅 METALS SIGNAL BOT v1.0.4

**High-Precision Market Intelligence & Signal Engine for Metals ETFs.**

---

## 💎 Project Philosophy
The Metals Signal Bot is engineered for professional-grade market analysis, specifically tailored for the **Metals Universe (GLD, SLV, GDX, COPX, DBC)**. It operates on a strict **15-minute candle-close** logic, adhering to "Fail-Closed" principles where data integrity is prioritized over signal frequency.

## 🏗️ Technical Architecture
- **Core Engine**: Deterministic state machine (WAIT → LONG → COOLDOWN).
- **Verification Layer**: Real-time Google Search Grounding via **Gemini 3 Pro** to ensure "1000% real" data accuracy.
- **Indicator Suite**: Incremental EMA, RSI, ATR, and Volume SMA calculators.
- **UI/UX**: High-fidelity React dashboard with Tailwind CSS, Lucide icons, and Recharts.

## 📈 Trading Strategy (The "Metal-Clad" Logic)
The bot executes a Trend-Following Momentum strategy:
1.  **Primary Trend**: Price > 200 EMA (Daily/15m alignment).
2.  **Momentum Gate**: RSI(14) ≥ 50.
3.  **Trigger**: Price > 20 EMA.
4.  **Confirmation**: Volume > 20-period Volume SMA.
5.  **Risk Management**: 2.5x ATR Stops | 4.0x ATR Targets | VIX-based Position Scaling.

## 🛠️ Operating Model
1.  **Market Hours**: Operates exclusively during NYSE session (9:30 AM - 4:00 PM ET).
2.  **Execution**: Signals are generated for manual execution in retail brokers (Robinhood/Webull).
3.  **Safety**: Integrated Circuit Breaker for API Rate Limits (429 handling).

## 🚀 Quality Standards (Score 10+)
- **Aesthetics**: Glassmorphic UI with optimized typography (Inter & JetBrains Mono).
- **Performance**: Zero-lag state updates and memoized indicator calculations.
- **Reliability**: Dual-layer verification (Grounding + integrity tagging).
- **Explainability**: AI-driven technical commentary for every BUY trigger.

---
*Developed for personal use. Treat data as hostile. Verify every fill.*
