import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'obsidian' | 'midnight' | 'emerald' | 'rose' | 'violet';

export interface Theme {
  id: ThemeId;
  nameEn: string;
  nameFr: string;
  primary: string;
  description: string;
}

export const THEMES: Theme[] = [
  { id: 'obsidian', nameEn: 'Obsidian', nameFr: 'Obsidienne', primary: '#f59e0b', description: 'Dark amber' },
  { id: 'midnight', nameEn: 'Midnight', nameFr: 'Minuit', primary: '#3b82f6', description: 'Deep blue' },
  { id: 'emerald', nameEn: 'Emerald', nameFr: 'Émeraude', primary: '#10b981', description: 'Forest green' },
  { id: 'rose', nameEn: 'Rose', nameFr: 'Rose', primary: '#f43f5e', description: 'Crimson rose' },
  { id: 'violet', nameEn: 'Violet', nameFr: 'Violet', primary: '#8b5cf6', description: 'Deep violet' },
];

const STORAGE_KEY = 'rc-theme';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: Theme[];
  currentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'obsidian',
  setTheme: () => undefined,
  themes: THEMES,
  currentTheme: THEMES[0],
});

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === 'obsidian') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', id);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    return stored && THEMES.some(t => t.id === stored) ? stored : 'obsidian';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyTheme(id);
  };

  const currentTheme = THEMES.find(t => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
