import { createContext, useContext } from 'react';

import { THEMES, type Theme } from './themes';

const ThemeContext = createContext<Theme>(THEMES[0]);

export const ThemeProvider = ThemeContext.Provider;

/** The active block/board theme. Components re-render when it changes. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
