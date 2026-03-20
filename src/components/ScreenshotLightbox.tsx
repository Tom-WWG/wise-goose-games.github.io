// src/components/ScreenshotLightbox.tsx
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  screenshots: string[];
  gameTitle: string;
}

export default function ScreenshotLightbox({ screenshots, gameTitle }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const idx = (e as CustomEvent).detail?.index;
      if (typeof idx === 'number') {
        setLightboxIndex(idx);
      }
    };
    window.addEventListener('open-lightbox', handleOpen);
    return () => window.removeEventListener('open-lightbox', handleOpen);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, screenshots.length]);

  if (lightboxIndex === null) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={() => setLightboxIndex(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot lightbox"
    >
      <button
        className="absolute top-4 right-4 p-2 transition-colors"
        style={{ color: 'rgba(255,255,255,0.8)' }}
        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
        aria-label="Close lightbox"
      >
        <X size={24} />
      </button>

      {lightboxIndex > 0 && (
        <button
          className="absolute left-4 p-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.8)' }}
          onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null); }}
          aria-label="Previous screenshot"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <img
        src={screenshots[lightboxIndex]}
        alt={`${gameTitle} screenshot ${lightboxIndex + 1}`}
        width={2560}
        height={1440}
        className="max-w-[90vw] max-h-[90vh] object-contain animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      />

      {lightboxIndex < screenshots.length - 1 && (
        <button
          className="absolute right-4 p-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.8)' }}
          onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null); }}
          aria-label="Next screenshot"
        >
          <ChevronRight size={32} />
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {lightboxIndex + 1} / {screenshots.length}
      </div>
    </div>
  );
}
