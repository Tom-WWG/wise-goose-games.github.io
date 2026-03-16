// src/components/GameDetail.tsx
// High-conversion game landing page — designed for short attention spans.
// Color palette: deep navy base, bright cyan accent, white text, warm coral secondary.
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Building, Brain, Ghost, Puzzle, Gamepad2, Apple, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import type { Game } from '../data/games';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  building: Building,
  brain: Brain,
  ghost: Ghost,
  puzzle: Puzzle,
  gamepad2: Gamepad2,
  star: Star,
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

function CTAButtons({ game, size = 'normal' }: { game: Game; size?: 'normal' | 'large' }) {
  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];
  const btnClass = size === 'large'
    ? 'inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-body font-bold text-lg transition-all duration-300 hover:scale-105'
    : 'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all duration-300 hover:scale-105';

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {steamPlatform && (
        <a
          href={steamPlatform.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} bg-[#38BDB4] text-[#062028] hover:bg-[#4DD4CB] shadow-lg shadow-[#38BDB4]/30`}
        >
          <Gamepad2 size={size === 'large' ? 22 : 18} />
          Get on Steam
        </a>
      )}
      {iosPlatform && (
        <a
          href={iosPlatform.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} bg-white/15 text-white border border-white/30 hover:bg-white/25`}
        >
          <Apple size={size === 'large' ? 22 : 18} />
          App Store
        </a>
      )}
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

  // GSAP scroll animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(pageRef.current?.querySelectorAll('[data-reveal]') ?? [], {
        opacity: 1, y: 0, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      sections.forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="game-landing">

      {/* ===== HERO: Above the fold — dark, immersive, CTA visible ===== */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-[#062028]">
        {/* Background — gameplay screenshot, subtle */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 blur-[2px] scale-110"
          style={{ backgroundImage: `url(${screenshots[1] ?? screenshots[0] ?? game.steamAssets.header})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#062028]/60 via-transparent to-[#062028]" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <img
            src="/pp-assets/T_Title.svg"
            alt={game.title}
            className="mx-auto mb-8 w-full max-w-xs md:max-w-sm lg:max-w-md drop-shadow-2xl"
          />

          <p className="font-body text-xl md:text-2xl text-[#38BDB4] font-bold tracking-wide mb-4">
            {game.tagline}
          </p>

          <p className="font-body text-white/70 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {game.shortDescription}
          </p>

          <CTAButtons game={game} size="large" />

          {game.price && (
            <p className="mt-5 font-body text-white/40 text-sm">{game.price}</p>
          )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ===== TRAILER: The hook — contrasting lighter section ===== */}
      {videoId && (
        <section className="bg-[#0A1F2E] py-16 md:py-24 px-6">
          <div data-reveal className="max-w-4xl mx-auto">
            <h2 className="font-drama italic text-2xl md:text-3xl text-white/90 mb-6 text-center">
              Watch the Trailer
            </h2>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#38BDB4]/20">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={`${game.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURE HIGHLIGHTS: Bright contrast break ===== */}
      {game.featureHighlights.length > 0 && (
        <section className="bg-[#0F3444] py-16 md:py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {game.featureHighlights.map((highlight) => {
                const Icon = iconMap[highlight.icon] ?? Puzzle;
                return (
                  <div
                    key={highlight.title}
                    data-reveal
                    className="rounded-2xl bg-[#0A2535] border border-[#38BDB4]/20 p-8 text-center transition-all duration-300 hover:border-[#38BDB4]/40 hover:-translate-y-1"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#38BDB4]/15 flex items-center justify-center mx-auto mb-5">
                      <Icon size={28} className="text-[#38BDB4]" />
                    </div>
                    <h3 className="font-body font-bold text-white text-xl mb-3">
                      {highlight.title}
                    </h3>
                    <p className="font-body text-white/60 text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== SCREENSHOTS: Dark section with bright images ===== */}
      {screenshots.length > 0 && (
        <section className="bg-[#062028] py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 data-reveal className="font-drama italic text-3xl md:text-4xl text-white mb-10 text-center">
              Gameplay
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {screenshots.map((src, index) => (
                <button
                  key={src}
                  data-reveal
                  onClick={() => setLightboxIndex(index)}
                  className="block rounded-xl overflow-hidden cursor-zoom-in focus-visible:outline-[#38BDB4] group ring-1 ring-white/15 hover:ring-[#38BDB4]/50 transition-all duration-300"
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
          </div>
        </section>
      )}

      {/* ===== FEATURES LIST: Lighter section for readability ===== */}
      <section className="bg-[#0F3444] py-16 md:py-24 px-6">
        <div data-reveal className="max-w-2xl mx-auto">
          <h2 className="font-drama italic text-3xl md:text-4xl text-white mb-10 text-center">
            What&apos;s Inside
          </h2>
          <ul className="space-y-4">
            {game.features.map((feature) => (
              <li key={feature} className="flex items-start gap-4">
                <span className="mt-2 w-2.5 h-2.5 rounded-full bg-[#38BDB4] shrink-0" />
                <span className="font-body text-white/80 text-base leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== FINAL CTA: Dark, focused ===== */}
      <section className="bg-[#062028] py-20 md:py-32 px-6">
        <div data-reveal className="max-w-xl mx-auto text-center">
          <p className="font-drama italic text-4xl md:text-5xl text-white mb-4">
            Ready to play?
          </p>
          <p className="font-body text-white/50 mb-10 text-lg">
            {game.price} on Steam and iOS.
          </p>
          <CTAButtons game={game} size="large" />

          {game.pressKit && (
            <div className="mt-12">
              <a
                href={game.pressKit}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-white/40 hover:text-[#38BDB4] text-sm transition-colors"
              >
                Press Kit →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ===== STICKY CTA BAR: Mobile only ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#062028]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 safe-area-pb">
        <CTAButtons game={game} />
      </div>

      {/* ===== LIGHTBOX ===== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot lightbox"
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null); }}
              aria-label="Previous screenshot"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={screenshots[lightboxIndex]}
            alt={`${game.title} screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < screenshots.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null); }}
              aria-label="Next screenshot"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 font-body text-sm">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
