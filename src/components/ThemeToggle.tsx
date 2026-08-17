// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme';

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

/**
 * Compact icon button that switches between light and dark themes.
 * Shows a sun in dark mode (tap to go light) and a moon in light mode.
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 18 }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex items-center justify-center rounded-xl transition-colors ${className}`}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
};

export default ThemeToggle;
