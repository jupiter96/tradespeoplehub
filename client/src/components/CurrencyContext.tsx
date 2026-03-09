import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type CurrencyCode = "GBP" | "USD" | "EUR";

const CURRENCY_STORAGE_KEY = "trades_currency";
const RATES_STORAGE_KEY = "trades_currency_rates";
const RATES_DATE_KEY = "trades_currency_rates_date";
const RATES_CACHE_HOURS = 24;

interface Rates {
  USD: number;
  EUR: number;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Rates | null;
  loading: boolean;
  error: string | null;
  /** Convert GBP amount to selected currency and format with symbol (e.g. "£10.00", "$13.34") */
  formatPrice: (gbpAmount: number, options?: { minFractionDigits?: number; maxFractionDigits?: number }) => string;
  /** Symbol for current currency: £ $ € */
  symbol: string;
  /** Multiplier from GBP to current currency (1 for GBP) */
  rate: number;
  /** Convert amount entered in selected currency to GBP (for sending to API). */
  toGBP: (amountInSelectedCurrency: number) => number;
  /** Convert GBP amount from API to selected currency for display in inputs. */
  fromGBP: (gbpAmount: number) => number;
  /** Format amount that is already in selected currency (e.g. user input) with symbol — no conversion. Use for fund amount, fee, total in billing. */
  formatAmountInSelectedCurrency: (amount: number, options?: { minFractionDigits?: number; maxFractionDigits?: number }) => string;
}

// Fallback when API fails: 1 USD = 0.87 EUR = 0.75 GBP → 1 GBP = 1/0.75 USD, 1 GBP = 0.87/0.75 EUR
const defaultRates: Rates = {
  USD: 1 / 0.75,       // 1 GBP = 1.333... USD
  EUR: 0.87 / 0.75,   // 1 GBP = 1.16 EUR
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function loadStoredCurrency(): CurrencyCode {
  try {
    const s = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (s === "GBP" || s === "USD" || s === "EUR") return s;
  } catch (_) {}
  return "GBP";
}

function loadCachedRates(): Rates | null {
  try {
    const date = localStorage.getItem(RATES_DATE_KEY);
    if (date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime()) || (Date.now() - d.getTime()) / (1000 * 60 * 60) > RATES_CACHE_HOURS)
        return null;
    }
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      const r = JSON.parse(raw) as Rates;
      if (typeof r?.USD === "number" && typeof r?.EUR === "number") return r;
    }
  } catch (_) {}
  return null;
}

function saveRates(rates: Rates) {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
    localStorage.setItem(RATES_DATE_KEY, new Date().toISOString());
  } catch (_) {}
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(loadStoredCurrency);
  const [rates, setRates] = useState<Rates | null>(loadCachedRates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch (_) {}
    window.location.reload();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cache = loadCachedRates();
    if (cache) {
      setRates(cache);
      setLoading(false);
      setError(null);
    }

    const url = "https://api.frankfurter.app/latest?from=GBP&to=USD,EUR";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rates");
        return res.json();
      })
      .then((data: { rates?: { USD?: number; EUR?: number } }) => {
        if (cancelled) return;
        const r = data?.rates;
        const next: Rates = {
          USD: typeof r?.USD === "number" ? r.USD : defaultRates.USD,
          EUR: typeof r?.EUR === "number" ? r.EUR : defaultRates.EUR,
        };
        setRates(next);
        setError(null);
        saveRates(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Exchange rates unavailable");
          setRates(defaultRates);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const rate = useMemo(() => {
    if (currency === "GBP") return 1;
    const r = rates ?? defaultRates;
    return currency === "USD" ? r.USD : r.EUR;
  }, [currency, rates]);

  const symbol = useMemo(() => {
    if (currency === "GBP") return "£";
    if (currency === "USD") return "$";
    return "€";
  }, [currency]);

  const formatPrice = useCallback(
    (gbpAmount: number, options?: { minFractionDigits?: number; maxFractionDigits?: number }) => {
      const value = gbpAmount * rate;
      const minF = options?.minFractionDigits ?? 2;
      const maxF = options?.maxFractionDigits ?? 2;
      const formatted = value.toLocaleString("en-US", {
        minimumFractionDigits: minF,
        maximumFractionDigits: maxF,
      });
      return `${symbol}${formatted}`;
    },
    [rate, symbol]
  );

  const toGBP = useCallback(
    (amountInSelectedCurrency: number) => (rate === 0 ? amountInSelectedCurrency : amountInSelectedCurrency / rate),
    [rate]
  );

  const fromGBP = useCallback(
    (gbpAmount: number) => gbpAmount * rate,
    [rate]
  );

  const formatAmountInSelectedCurrency = useCallback(
    (amount: number, options?: { minFractionDigits?: number; maxFractionDigits?: number }) => {
      const minF = options?.minFractionDigits ?? 2;
      const maxF = options?.maxFractionDigits ?? 2;
      const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: minF,
        maximumFractionDigits: maxF,
      });
      return `${symbol}${formatted}`;
    },
    [symbol]
  );

  const value = useMemo<CurrencyContextType>(
    () => ({
      currency,
      setCurrency,
      rates,
      loading,
      error,
      formatPrice,
      symbol,
      rate,
      toGBP,
      fromGBP,
      formatAmountInSelectedCurrency,
    }),
    [currency, setCurrency, rates, loading, error, formatPrice, symbol, rate, toGBP, fromGBP, formatAmountInSelectedCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

/** Safe hook: returns null if outside provider (e.g. admin). Caller can fallback to GBP. */
export function useCurrencyOptional(): CurrencyContextType | null {
  return useContext(CurrencyContext);
}
