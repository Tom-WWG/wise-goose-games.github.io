// src/components/ThemeSwitcher.tsx
import { useState, useEffect } from 'react';

const themes = [
  { value: 'brutalist-dark', label: 'BRUTALIST DARK' },
  { value: 'wgg-warm-dark', label: 'WGG WARM DARK' },
  { value: 'wgg-warm-light', label: 'WGG WARM LIGHT' },
  { value: 'pp-deep-ocean', label: 'P&P DEEP OCEAN' },
  { value: 'pp-midnight-cyan', label: 'P&P MIDNIGHT CYAN' },
];

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState('brutalist-dark');

  useEffect(() => {
    const stored = localStorage.getItem('color-theme') || 'brutalist-dark';
    setCurrent(stored);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setCurrent(value);
    document.documentElement.setAttribute('data-color-theme', value);
    localStorage.setItem('color-theme', value);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] text-[10px] font-semibold tracking-wider uppercase py-1 px-2 cursor-pointer focus:outline-none focus:border-[var(--accent)]"
      style={{ borderRadius: 0 }}
      aria-label="Color theme"
    >
      {themes.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
