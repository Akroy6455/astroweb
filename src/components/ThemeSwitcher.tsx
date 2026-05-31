"use client";

import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title="Toggle Skeuomorphic Theme"
      className="theme-switcher-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: theme === 'skeuomorphic' ? '#fff' : 'var(--primary)',
          boxShadow: theme === 'skeuomorphic' ? 'inset 2px 2px 4px rgba(0,0,0,0.1)' : 'none',
          border: theme === 'skeuomorphic' ? '1px solid #ccc' : 'none'
        }}
      />
      <span>{theme === 'skeuomorphic' ? 'Neumorphic UI' : 'Classic UI'}</span>
    </button>
  );
}
