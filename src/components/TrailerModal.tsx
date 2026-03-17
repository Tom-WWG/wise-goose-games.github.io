// src/components/TrailerModal.tsx
import { useEffect } from 'react';
import gsap from 'gsap';

interface Props {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ videoId, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Animate on open
  useEffect(() => {
    if (!isOpen) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      '.trailer-modal-backdrop',
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.trailer-modal-embed',
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.1 }
    );
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="trailer-modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Game trailer"
    >
      <div
        className="trailer-modal-embed w-[90vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
            title="Game trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
