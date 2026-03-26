/**
 * @file useMediaQuery.js
 * @description React hook for responsive device detection via CSS media queries.
 *
 * Uses window.matchMedia for efficient, event-driven breakpoint tracking
 * without polling or resize listeners. SSR-safe (defaults to false).
 *
 * @module hooks/useMediaQuery
 */

import { useState, useEffect } from 'react';

/**
 * useMediaQuery — Subscribe to a CSS media query and return whether it matches.
 *
 * @param {string} query — CSS media query string (e.g. "(max-width: 768px)")
 * @returns {boolean} True if the query currently matches
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isTablet = useMediaQuery('(max-width: 1024px)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    function handleChange(e) {
      setMatches(e.matches);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/* ── Pre-defined breakpoint hooks ──────────────────────────────────────── */

/** @returns {boolean} True when viewport <= 480px (small mobile) */
export function useIsSmallMobile() {
  return useMediaQuery('(max-width: 480px)');
}

/** @returns {boolean} True when viewport <= 768px (mobile / portrait tablet) */
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

/** @returns {boolean} True when viewport <= 1024px (tablet / small laptop) */
export function useIsTablet() {
  return useMediaQuery('(max-width: 1024px)');
}

/** @returns {boolean} True when viewport >= 1280px (large desktop) */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1280px)');
}

/** @returns {boolean} True when user prefers reduced motion */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** @returns {boolean} True when device is in landscape orientation */
export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)');
}

/** @returns {boolean} True when device supports touch (coarse pointer) */
export function useIsTouchDevice() {
  return useMediaQuery('(pointer: coarse)');
}

export default useMediaQuery;
