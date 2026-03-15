// src/components/FeaturedGame.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Building, Brain, Ghost, Puzzle, Gamepad2, Apple } from 'lucide-react';
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

export default function FeaturedGame({ game }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const cards = cardsRef.current?.querySelectorAll('[data-feature-card]') ?? [];
      gsap.set(cards, { opacity: 1, y: 0, clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-feature-card]', {
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;
  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-bg"
    >
      <div className="max-w-6xl mx-auto px-6">

        {/* Steam Header Card */}
        {game.steamAssets.header && (
          <div className="mb-12">
            <img
              src={game.steamAssets.header}
              alt={`${game.title} header`}
              className="w-full max-w-2xl mx-auto block rounded-2xl drop-shadow-lg object-cover"
            />
          </div>
        )}

        {/* Info Panel */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="font-drama italic text-4xl md:text-6xl text-text mb-3">
            {game.title}
          </h2>

          <span className="inline-block bg-accent text-white font-body font-semibold text-sm px-4 py-1.5 rounded-full mb-5">
            {game.tagline}
          </span>

          <p className="font-body text-text/80 text-lg leading-relaxed mb-6">
            {game.shortDescription}
          </p>

          {/* Platform icons + price */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {steamPlatform && (
              <span className="flex items-center gap-1.5 text-text/70 font-body text-sm">
                <Gamepad2 size={18} className="text-accent" />
                Steam
              </span>
            )}
            {iosPlatform && (
              <span className="flex items-center gap-1.5 text-text/70 font-body text-sm">
                <Apple size={18} className="text-accent" />
                iOS
              </span>
            )}
            {game.price && (
              <span className="bg-surface border border-border text-text font-body font-semibold text-sm px-3 py-1 rounded-full">
                {game.price}
              </span>
            )}
          </div>
        </div>

        {/* Trailer Embed */}
        {videoId && (
          <div className="mb-16 max-w-3xl mx-auto">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${game.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* Feature Highlight Cards */}
        {game.featureHighlights.length > 0 && (
          <div
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-14"
          >
            {game.featureHighlights.map((highlight) => {
              const Icon = iconMap[highlight.icon] ?? Puzzle;
              return (
                <div
                  key={highlight.title}
                  data-feature-card
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
        )}

        {/* Buy CTAs */}
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

      </div>
    </section>
  );
}
