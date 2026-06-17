import { useState, useEffect } from 'react';

/**
 * A React hook that maintains a ticking game clock for live matches.
 * Ticks second-by-second on the client side, and automatically syncs
 * with new official minute/second values from the API when they arrive.
 * 
 * @param {number} initialMinute - The official elapsed minute from the API
 * @param {number} initialSecond - The official elapsed second from the API (from periods.seconds_elapsed)
 * @param {boolean} isLive - Whether the match is currently live
 * @returns {{ minute: number, second: number, formatted: string }}
 */
export function useLiveMatchClock(initialMinute = 0, initialSecond = 0, isLive = false) {
  const [time, setTime] = useState({ minute: initialMinute, second: initialSecond });

  // Keep state synchronized with incoming official values (API polling re-calibration)
  useEffect(() => {
    setTime({ minute: initialMinute, second: initialSecond });
  }, [initialMinute, initialSecond]);

  // Run the tick interval only when the match is LIVE
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setTime(prev => {
        let newSec = prev.second + 1;
        let newMin = prev.minute;
        
        if (newSec >= 60) {
          newSec = 0;
          newMin += 1;
        }
        
        return { minute: newMin, second: newSec };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  const pad = (num) => String(num).padStart(2, '0');
  const formatted = `${pad(time.minute)}:${pad(time.second)}`;

  return {
    minute: time.minute,
    second: time.second,
    formatted
  };
}
