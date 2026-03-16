// src/components/GameDetail.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gamepad2, Apple, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Game } from '../data/games';

gsap.registerPlugin(ScrollTrigger);

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

function CTABar({ game, centered = false }: { game: Game; centered?: boolean }) {
  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

  const layout = centered
    ? 'flex flex-col items-center text-center gap-4'
    : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4';

  return (
    <div
      className="px-6 md:px-8 py-4"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '2px solid var(--accent)',
      }}
    >
      <div className={layout}>
        <div>
          <h2
            className={`font-body font-bold ${centered ? 'text-[16px]' : 'text-[18px]'}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
          >
            {game.title}
          </h2>
          <p
            className="font-drama italic text-[11px] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {centered ? `Available now on Steam and iOS` : game.tagline}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {game.price && !centered && (
            <span
              className="font-body font-semibold text-[12px] mr-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {game.price}
            </span>
          )}
          {steamPlatform && (
            <a
              href={steamPlatform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary flex items-center gap-2 ${centered ? 'px-8 py-3 text-[13px]' : ''}`}
            >
              <Gamepad2 size={14} />
              GET ON STEAM
            </a>
          )}
          {iosPlatform && (
            <a
              href={iosPlatform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-secondary flex items-center gap-2 ${centered ? 'px-7 py-3 text-[13px]' : ''}`}
            >
              <Apple size={14} />
              APP STORE
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  game: Game;
}

export default function GameDetail({ game }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const screenshots = game.steamAssets.screenshots ?? [];
  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;

  // Lightbox keyboard handler
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

  // GSAP stagger on screenshots
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(pageRef.current?.querySelectorAll('[data-reveal]') ?? [], {
        opacity: 1, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      gsap.from(items, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.screenshot-grid',
          start: 'top 85%',
          once: true,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Adaptive grid layout based on screenshot count
  const renderScreenshotGrid = () => {
    if (screenshots.length === 0) return null;

    const count = screenshots.length;
    let row1: string[] = [];
    let row2: string[] = [];

    if (count === 1) {
      row1 = screenshots.slice(0, 1);
    } else if (count === 2) {
      row1 = screenshots.slice(0, 2);
    } else if (count === 3) {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 3);
    } else if (count === 4) {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 4);
    } else {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 5);
    }

    const renderCell = (src: string, globalIndex: number) => (
      <button
        key={src}
        data-reveal
        onClick={() => setLightboxIndex(globalIndex)}
        className="block overflow-hidden cursor-zoom-in focus-visible:outline-[var(--accent)] group"
        style={{ aspectRatio: '16/10' }}
        aria-label={`View screenshot ${globalIndex + 1}`}
      >
        <img
          src={src}
          alt={`${game.title} screenshot ${globalIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </button>
    );

    const row1Cols = row1.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
    const row2Cols = row2.length === 1 ? 'grid-cols-1'
      : row2.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
      <div className="screenshot-grid" style={{ marginTop: '2px' }}>
        <div className={`grid ${row1Cols}`} style={{ gap: '2px' }}>
          {row1.map((src, i) => renderCell(src, i))}
        </div>
        {row2.length > 0 && (
          <div className={`grid ${row2Cols}`} style={{ gap: '2px', marginTop: '2px' }}>
            {row2.map((src, i) => renderCell(src, row1.length + i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={pageRef}>
      {/* ===== TRAILER: Full-width, capped height ===== */}
      {videoId && (
        <div style={{ backgroundColor: '#000' }}>
          <div
            className="w-full mx-auto"
            style={{
              aspectRatio: '16/9',
              maxHeight: 'calc(100vh - 130px)',
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={`${game.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* ===== CTA BAR: Immediately below trailer ===== */}
      <CTABar game={game} />

      {/* ===== SCREENSHOT GRID: Edge-to-edge ===== */}
      {renderScreenshotGrid()}

      {/* ===== FINAL CTA: Centered, below screenshots ===== */}
      <CTABar game={game} centered />

      {/* ===== LIGHTBOX ===== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
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
            alt={`${game.title} screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
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
      )}
    </div>
  );
}
