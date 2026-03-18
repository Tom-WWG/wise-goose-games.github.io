// src/components/NavbarClient.tsx
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface Props {
  currentPath: string;
}

const navLinks = [
  { href: '/games', label: 'GAMES' },
  { href: '/contact', label: 'CONTACT' },
];

export default function NavbarClient({ currentPath }: Props) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-8"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <img
          src="/WWG_Goose_Face_128.png"
          alt="Wise Goose Games"
          width={128}
          height={128}
          className="h-7 w-auto"
        />
        <span
          className="hidden sm:inline font-body font-bold text-sm tracking-wide"
          style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}
        >
          WISE GOOSE GAMES
        </span>
      </a>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-5">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-body font-semibold text-[13px] tracking-wider transition-colors hover:text-[var(--text-primary)]"
            style={{
              color: currentPath === link.href
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              letterSpacing: '0.5px',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2"
        style={{ color: 'var(--text-primary)' }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {isMobileOpen && (
        <div
          className="absolute top-[60px] left-0 right-0 md:hidden flex flex-col py-4 px-6 gap-1"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 px-4 font-body font-semibold text-xs tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
