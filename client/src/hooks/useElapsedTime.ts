import { useState, useEffect } from 'react';

export function useElapsedTime(startTime: Date | string | null | undefined) {
  const [elapsed, setElapsed] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    started: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    started: false,
  });

  useEffect(() => {
    if (!startTime) {
      setElapsed({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        started: false,
      });
      return;
    }

    const updateElapsed = () => {
      const now = new Date().getTime();
      const startTimeMs = new Date(startTime).getTime();
      const difference = now - startTimeMs;

      if (difference < 0) {
        setElapsed({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          started: false,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setElapsed({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
        started: true,
      });
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}
