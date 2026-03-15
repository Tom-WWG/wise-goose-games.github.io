// src/components/NavbarClient.tsx
import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';

interface Props {
  currentPath: string;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/contact', label: 'Contact' },
];

export default function NavbarClient({ currentPath }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Theme: read initial from <html> attribute
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    setTheme(current ?? 'light');
  }, []);

  // Scroll morphing: IntersectionObserver on [data-hero]
  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) { setIsScrolled(true); return; } // No hero on this page = always scrolled style

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  const scrolledClasses = isScrolled
    ? 'bg-[var(--bg-color)]/80 backdrop-blur-xl border border-[var(--border-color)] shadow-lg'
    : 'bg-transparent border border-transparent';

  const textColor = isScrolled ? 'text-[var(--text-color)]' : 'text-white';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-5xl mt-4 rounded-full px-6 py-3 transition-all duration-300 ${scrolledClasses}`}
    >
      <div className="flex items-center justify-between">
        {/* Logo area */}
        <div className="flex items-center gap-3">
          <a href="/">
            <img src="/WWG_Goose_Header_280px.png" alt="Wise Goose Games" className="h-10 w-auto" />
          </a>
          <a href="/" className="hidden sm:block">
            <img src="/WWG_Text_Header_280px.png" alt="Wise Goose Games" className="logo-text-light h-8 w-auto" />
            <img src="/WWG_Text_Header_Dark_280px.png" alt="Wise Goose Games" className="logo-text-dark h-8 w-auto" />
          </a>
        </div>

        {/* Desktop nav */}
        <div className={`hidden md:flex items-center gap-1 ${textColor}`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                currentPath === link.href ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/10'
              }`}
            >
              {link.label}
            </a>
          ))}
          <button onClick={toggleTheme} className="ml-2 p-2 rounded-full hover:bg-white/10 transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className={`md:hidden p-2 ${textColor}`} onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMobileOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-color)] hover:bg-[var(--light-gray)] transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button onClick={toggleTheme} className="px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-color)] hover:bg-[var(--light-gray)] text-left flex items-center gap-2">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      )}
    </nav>
  );
}
