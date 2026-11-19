'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-surface-container hover:bg-surface-container-high text-on-surface-variant ${className}`}
      aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-300 select-none">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
