'use client'

import { useState, useEffect } from 'react'

/**
 * A hook that returns true when the given CSS media query matches.
 * Defaults to false during SSR to avoid hydration mismatches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Shorthand: returns true on screens ≤ 768px (phones + small tablets) */
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}
