import { useState, useEffect } from 'react';

export function useElapsedTime(
  startTime: Date | string | null | undefined,
  pauseTime?: Date | string | null | undefined,
  resumeTime?: Date | string | null | undefined
) {
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
      let difference: number;

      if (pauseTime && !resumeTime) {
        // Currently paused - calculate up to pause time only
        const pauseTimeMs = new Date(pauseTime).getTime();
        difference = pauseTimeMs - startTimeMs;
      } else if (pauseTime && resumeTime) {
        // Was paused and resumed - calculate total time minus paused duration
        const pauseTimeMs = new Date(pauseTime).getTime();
        const resumeTimeMs = new Date(resumeTime).getTime();
        const pausedDuration = resumeTimeMs - pauseTimeMs;
        // Calculate time from start to pause, then from resume to now
        const timeBeforePause = pauseTimeMs - startTimeMs;
        const timeAfterResume = now - resumeTimeMs;
        difference = timeBeforePause + timeAfterResume;
      } else {
        // Not paused - calculate normally
        difference = now - startTimeMs;
      }

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
  }, [startTime, pauseTime, resumeTime]);

  return elapsed;
}
