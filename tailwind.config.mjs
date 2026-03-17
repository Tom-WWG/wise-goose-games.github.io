// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // New theme tokens
        'bg-primary': 'var(--bg-primary)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-footer': 'var(--bg-footer)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-footer': 'var(--text-footer)',
        accent: 'var(--accent)',
        'accent-text': 'var(--accent-text)',
        'border-subtle': 'var(--border-subtle)',
        'border-medium': 'var(--border-medium)',
        'border-strong': 'var(--border-strong)',
        // Backward-compat aliases (used by unrewritten pages: 404, terms, privacy, contact, games index)
        // Remove these once all pages are migrated to new tokens
        bg: 'var(--bg-primary)',
        text: 'var(--text-primary)',
        'accent-hover': 'var(--accent)', // old hover maps to accent
        'light-gray': 'var(--bg-elevated)',
        border: 'var(--border-subtle)',
        surface: 'var(--bg-elevated)',
        'deep-dark': 'var(--bg-footer)',
      },
      fontFamily: {
        body: ['Montserrat', 'system-ui', 'sans-serif'],
        drama: ['Cormorant Garamond', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
