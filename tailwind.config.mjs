// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-color)',
        text: 'var(--text-color)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
        'light-gray': 'var(--light-gray)',
        border: 'var(--border-color)',
        surface: 'var(--surface-color)',
        'deep-dark': 'var(--deep-dark)',
      },
      fontFamily: {
        body: ['Montserrat', 'sans-serif'],
        drama: ['Cormorant Garamond', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
