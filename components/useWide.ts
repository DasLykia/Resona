import { useEffect, useState } from 'react';

// Tailwind's 2xl breakpoint as a live flag, so layout and behaviour switch together
export const useWide = () => {
  const q = '(min-width: 1536px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
};
