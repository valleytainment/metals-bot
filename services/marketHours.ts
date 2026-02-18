
/**
 * @file services/marketHours.ts
 * @description specialized utility for synchronizing the engine with New York Stock Exchange (NYSE) hours.
 * Handles Timezone conversions to ensure "Personal Use" compliance with US Market sessions.
 */

/**
 * Checks if the current time falls within the standard NYSE trading session.
 * Standard hours: 9:30 AM - 4:00 PM Eastern Time, Monday through Friday.
 * 
 * @returns {boolean} True if the market is currently active.
 */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  
  // Create a formatter for US Eastern Time (NYSE Home Time)
  const nyTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long'
  }).formatToParts(now);

  const hour = parseInt(nyTime.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(nyTime.find(p => p.type === 'minute')?.value || '0');
  const day = nyTime.find(p => p.type === 'weekday')?.value || '';

  // Weekend detection logic
  const isWeekend = day === 'Saturday' || day === 'Sunday';
  
  // Minute-of-day calculation for precise opening/closing bounds
  const totalMinutes = hour * 60 + minute;
  
  // Opening Bell: 09:30 (570 mins) | Closing Bell: 16:00 (960 mins)
  const isOpen = totalMinutes >= 570 && totalMinutes < 960 && !isWeekend;
  
  return isOpen;
};

/**
 * Provides a human-readable string for the next expected market activity.
 * Useful for UI state placeholders.
 * 
 * @returns {string} Contextual market schedule string.
 */
export const getNextMarketOpen = (): string => {
  return "Next Session: Monday 9:30 AM ET"; 
};
