import React from 'react';

/**
 * Performance optimization utilities
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch multiple function calls into a single execution
 */
export function batchCalls<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 0
): (...args: Parameters<T>) => void {
  let pending: Parameters<T>[] = [];
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    pending.push(args);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      const allArgs = pending;
      pending = [];
      timeout = null;
      
      // Execute with the last set of arguments
      if (allArgs.length > 0) {
        func(...allArgs[allArgs.length - 1]);
      }
    }, delay);
  };
}

/**
 * Deep equality check for objects
 * Useful for React dependency arrays
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }

    throw lastError;
  });
}

/**
 * Check if value has changed (shallow comparison)
 */
export function hasChanged(prev: any, next: any): boolean {
  if (prev === next) return false;
  
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return true;
    return prev.some((item, index) => item !== next[index]);
  }

  return true;
}

