/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  const label = isDark ? 'gündüz moduna geç' : 'gece moduna geç';
  const buttonText = isDark ? 'gündüz modu' : 'gece modu';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      aria-label={label}
      title={label}
    >
      {buttonText}
    </button>
  );
};

export default ThemeToggle;