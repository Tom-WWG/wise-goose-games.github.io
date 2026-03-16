// src/components/Hero.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Gamepad2, Apple } from 'lucide-react';
import type { Game } from '../data/games';
import TrailerModal from './TrailerModal';

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

  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

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
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* Background key art */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${headerImage})` }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(transparent 0%, var(--bg-primary) 100%)`,
          }}
        />

        {/* Play button — centered */}
        {videoId && (
          <button
            data-animate="play"
            onClick={() => setShowTrailer(true)}
            className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
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

        {/* Bottom title bar */}
        <div
          data-animate="bar"
          className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-8 pb-6"
          style={{
            background: `linear-gradient(transparent, var(--bg-primary))`,
            paddingTop: '80px',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
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
            <div className="flex items-center gap-2 flex-wrap">
              {game.price && (
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
                  className="btn-primary flex items-center gap-2"
                >
                  <Gamepad2 size={14} />
                  WISHLIST ON STEAM
                </a>
              )}
              {iosPlatform && (
                <a
                  href={iosPlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Apple size={14} />
                  APP STORE
                </a>
              )}
            </div>
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
