// src/components/Hero.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import type { Game } from '../data/games';
import TrailerModal from './TrailerModal';
import StoreBadges from './StoreBadges';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

interface Props {
  game: Game;
  headerImage: string;
}

export default function Hero({ game, headerImage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;



  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current?.querySelectorAll('[data-animate]') ?? [], {
        opacity: 1, y: 0, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-animate="play"]', {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.5,
      });
      gsap.from('[data-animate="bar"]', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section
        ref={containerRef}
        data-hero
        className="relative flex flex-col overflow-hidden"
      >
        {/* Background — solid base */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />

        {/* Image wrapper — mobile: in-flow at natural aspect ratio; desktop: absolute fill via CSS */}
        <div
          data-hero-image
        >
          {/* Capsule art — responsive <img> for LCP + SEO */}
          <img
            src={headerImage}
            srcSet={`${headerImage.replace('.webp', '-640w.webp')} 640w, ${headerImage.replace('.webp', '-1232w.webp')} 1232w, ${headerImage.replace('.webp', '-2464w.webp')} 2464w, ${headerImage.replace('.webp', '-3696w.webp')} 3696w`}
            sizes="100vw"
            alt={`${game.title} — ${game.tagline}`}
            width={3696}
            height={1727}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain"
          />
          {/* Gradient — desktop only (image is not full-screen on mobile) */}
          <div
            className="hero-gradient absolute inset-0"
            style={{
              background: `linear-gradient(transparent 40%, var(--bg-primary) 100%)`,
            }}
          />
          {/* Play button — centered over the image on both breakpoints */}
          {videoId && (
            <button
              data-animate="play"
              onClick={() => setShowTrailer(true)}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 group cursor-pointer"
              aria-label="Watch trailer"
            >
              <div
                className="w-[72px] h-[72px] flex items-center justify-center transition-colors"
                style={{
                  border: '2px solid rgba(255,255,255,0.7)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '20px solid white',
                    borderTop: '12px solid transparent',
                    borderBottom: '12px solid transparent',
                    marginLeft: '4px',
                  }}
                />
              </div>
              <span className="text-[10px] font-body font-semibold tracking-[2px] text-white/70 uppercase">
                WATCH TRAILER
              </span>
            </button>
          )}
        </div>

        {/* Info bar — mobile: flows below image with solid bg; desktop: absolute bottom overlay via CSS */}
        <div
          data-animate="bar"
          className="hero-bar z-10 px-6 md:px-8 pb-6"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="hero-title-block">
              <h1
                className="font-body font-bold text-[22px] md:text-[26px]"
                style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
              >
                {game.title}
              </h1>
              <p
                className="font-drama italic text-[12px] md:text-[14px] mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {game.tagline}
              </p>
            </div>
            <StoreBadges game={game} utmContent="hero_cta" showPrice />
          </div>
        </div>
      </section>

      {/* Accent divider */}
      <div className="h-[2px]" style={{ backgroundColor: 'var(--accent)' }} />

      {/* Trailer modal */}
      {videoId && (
        <TrailerModal
          videoId={videoId}
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
}
