
/**
 * @file services/marketHours.ts
 * @description Precise synchronization for NYSE trading sessions.
 */

/**
 * Checks if the current time falls within the standard NYSE trading session.
 * Handled in New York Time (Eastern Time).
 */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  
  const nyTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now);

  const hour = parseInt(nyTime.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(nyTime.find(p => p.type === 'minute')?.value || '0');
  const month = parseInt(nyTime.find(p => p.type === 'month')?.value || '0');
  const dayOfMonth = parseInt(nyTime.find(p => p.type === 'day')?.value || '0');
  const weekday = nyTime.find(p => p.type === 'weekday')?.value || '';

  // 1. Weekend Check
  const isWeekend = weekday === 'Saturday' || weekday === 'Sunday';
  if (isWeekend) return false;

  // 2. Simple Holiday Check (Core US Holidays)
  // Jan 1, July 4, Dec 25
  if ((month === 1 && dayOfMonth === 1) || 
      (month === 7 && dayOfMonth === 4) || 
      (month === 12 && dayOfMonth === 25)) {
    return false;
  }

  // 3. Precise Session Bounds (9:30 AM - 4:00 PM)
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 570 && totalMinutes < 960;
};

/**
 * Returns human-readable session status.
 */
export const getSessionContext = (): string => {
  if (isMarketOpen()) return "SESSION_ACTIVE";
  
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return "WEEKEND_HALT";
  
  return "POST_MARKET_MONITORING";
};
