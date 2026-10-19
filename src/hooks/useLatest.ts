import { useLayoutEffect, useRef } from 'react';

/** Ref that always holds the latest committed value (for stable callbacks). */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
