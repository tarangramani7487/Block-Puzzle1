import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dayKey, msUntilTomorrow } from '../game/daily';

/** Today's local day key; updates at midnight and when the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(dayKey);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(dayKey());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setToday(dayKey()), msUntilTomorrow() + 1000);
    return () => clearTimeout(t);
  }, [today]);

  return today;
}
