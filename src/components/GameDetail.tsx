// src/components/GameDetail.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Building, Brain, Ghost, Puzzle, Gamepad2, Apple, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Game } from '../data/games';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  building: Building,
  brain: Brain,
  ghost: Ghost,
  puzzle: Puzzle,
  gamepad2: Gamepad2,
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

interface Props {
  game: Game;
}

export default function GameDetail({ game }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const screenshots = game.steamAssets.screenshots ?? [];

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

  // GSAP scroll animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const sections = sectionsRef.current?.querySelectorAll('[data-section]') ?? [];
      gsap.set(sections, { opacity: 1, y: 0, clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-section]', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionsRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;
  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

  return (
    <div ref={pageRef}>
      {/* Hero Banner */}
      <section
        className="relative min-h-[60vh] flex items-end overflow-hidden bg-cover bg-center"
        style={
          game.steamAssets.header
            ? { backgroundImage: `url(${game.steamAssets.header})` }
            : undefined
        }
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent" />

        {/* Title and tagline overlaid at bottom */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 md:pb-24 w-full">
          <h1 className="font-drama italic text-5xl md:text-7xl text-white mb-3">
            {game.title}
          </h1>
          <span className="inline-block bg-accent text-white font-body font-semibold text-sm px-4 py-1.5 rounded-full">
            {game.tagline}
          </span>
        </div>
      </section>

      {/* Main content sections */}
      <div ref={sectionsRef} className="max-w-6xl mx-auto px-6 py-16 space-y-20">

        {/* Trailer */}
        {videoId && (
          <section data-section>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${game.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </section>
        )}

        {/* Description */}
        <section data-section>
          <p className="font-body text-lg leading-relaxed text-text/80">
            {game.longDescription}
          </p>
        </section>

        {/* Feature Highlights */}
        {game.featureHighlights.length > 0 && (
          <section data-section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {game.featureHighlights.map((highlight) => {
                const Icon = iconMap[highlight.icon] ?? Puzzle;
                return (
                  <div
                    key={highlight.title}
                    className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Icon size={22} className="text-accent" />
                    </div>
                    <h3 className="font-body font-semibold text-text text-lg">
                      {highlight.title}
                    </h3>
                    <p className="font-body text-text/70 text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Screenshots Gallery */}
        {screenshots.length > 0 && (
          <section data-section>
            <h2 className="font-drama italic text-3xl md:text-4xl text-text mb-6">
              Screenshots
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {screenshots.map((src, index) => (
                <button
                  key={src}
                  onClick={() => setLightboxIndex(index)}
                  className="block rounded-xl overflow-hidden cursor-zoom-in focus-visible:outline-accent group"
                  aria-label={`View screenshot ${index + 1}`}
                >
                  <img
                    src={src}
                    alt={`${game.title} screenshot ${index + 1}`}
                    className="w-full h-full object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Buy CTAs */}
        {(steamPlatform || iosPlatform) && (
          <section data-section>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {steamPlatform && (
                <a
                  href={steamPlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                >
                  <span className="bg-slide" />
                  <Gamepad2 size={18} />
                  Get on Steam
                </a>
              )}
              {iosPlatform && (
                <a
                  href={iosPlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                >
                  <span className="bg-slide" />
                  <Apple size={18} />
                  Download on App Store
                </a>
              )}
            </div>
          </section>
        )}

        {/* Press Kit */}
        {game.pressKit && (
          <section data-section className="text-center">
            <a
              href={game.pressKit}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body font-semibold text-accent hover:underline text-lg"
            >
              Press Kit →
            </a>
          </section>
        )}

      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot lightbox"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {/* Previous arrow */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null); }}
              aria-label="Previous screenshot"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Image */}
          <img
            src={screenshots[lightboxIndex]}
            alt={`${game.title} screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {lightboxIndex < screenshots.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null); }}
              aria-label="Next screenshot"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 font-body text-sm">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
