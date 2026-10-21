import React, { useEffect, useState } from 'react';
import { formatCurrency, toBanglaNumber } from '../utils/formatters';

interface AnimatedNumberProps {
  value: number;
  privacyMode?: boolean;
  useBanglaNumerals?: boolean;
  currencySymbol?: string;
  className?: string;
  prefix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  privacyMode = false,
  useBanglaNumerals = true,
  currencySymbol = '৳',
  className = '',
  prefix = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    if (privacyMode) return;

    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 300; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * easedProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    const rafId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(rafId);
  }, [value, privacyMode]);

  if (privacyMode) {
    return (
      <span className={`inline-flex items-center gap-1 select-none font-bold tracking-wider ${className}`}>
        <span>{currencySymbol}</span>
        <span className="text-sm opacity-60">••••••</span>
      </span>
    );
  }

  const formatted = formatCurrency(displayValue, useBanglaNumerals, currencySymbol);

  return (
    <span className={`tabular-nums transition-all ${className}`}>
      {prefix}
      {formatted}
    </span>
  );
};
