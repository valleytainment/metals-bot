# 🦅 METALS SIGNAL BOT | PRO TERMINAL v1.1.0

**Institutional-Grade Market Intelligence Engine for Precious Metals ETFs.**

---

## 💎 core_philosophy
The Metals Signal Bot is a non-discretionary, long-only execution engine designed for the **Metals Universe (GLD, SLV, GDX, COPX, DBC)**. It operates on a "Trust No Data" architecture, utilizing **Gemini 3 Pro Grounding** to verify tick data against live web sources before committing to signal transitions.

## 🏗️ technical_stack
- **Logic Engine**: Deterministic Finite State Machine (FSM).
- **Verification**: Google Search Grounding (Real-time financial cross-referencing).
- **Analytics**: Optimized rolling-window indicators (EMA, RSI, ATR).
- **UX**: Professional Glassmorphic Dashboard (Tailwind + Framer-style transitions).

## 📈 strategy_specifications (The "Metal-Clad" Logic)
The engine evaluates the 15-minute candle close against four primary gates:
1.  **Trend Alignment**: `Close > EMA(200)` (Determines high-timeframe structural health).
2.  **Momentum Gate**: `RSI(14) >= 50` (Ensures velocity is positive).
3.  **Trigger Event**: `Close > EMA(20)` (Tactical entry timing).
4.  **Volume Confirmation**: `Volume > SMA(Volume, 20)` (Validates institutional participation).

## 🛡️ risk_management_framework
- **Dynamic Stops**: 2.5x ATR (Volatility-adjusted exit).
- **Profit Targets**: 4.0x ATR (Ensures positive expectancy > 1.6R).
- **Regime Scaling**: 
  - `VIX > 25`: Position size reduced by 50%.
  - `VIX > 30`: New entries paused (Safety First).
- **Time Stop**: Automatic signal exit at 15:45 ET (Preventing overnight gap risk).

## 🚀 operational_runbook
1.  **Initialization**: Verify `SYSTEM_HEARTBEAT` is green in the header.
2.  **Verification**: Ensure "Live Verified" status is active (Indicates Gemini Grounding is functional).
3.  **Execution**: When a **BUY** alert fires, execute manually in Robinhood/Webull.
4.  **Auditing**: All trades are automatically logged to the Strategic Ledger (Journal) for weekly performance reviews.

---
*FOR PERSONAL USE ONLY. THE ENGINE IS THE AUTHORITY. VERIFY EVERY FILL.*
