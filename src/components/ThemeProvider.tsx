"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'skeuomorphic';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem('astro_theme') as Theme;
    if (savedTheme === 'skeuomorphic') {
      setTheme('skeuomorphic');
      document.documentElement.setAttribute('data-theme', 'skeuomorphic');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'default' ? 'skeuomorphic' : 'default';
      localStorage.setItem('astro_theme', newTheme);
      
      if (newTheme === 'skeuomorphic') {
        document.documentElement.setAttribute('data-theme', 'skeuomorphic');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
