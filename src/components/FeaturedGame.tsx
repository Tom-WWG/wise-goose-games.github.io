// src/components/FeaturedGame.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Game } from '../data/games';
import StoreBadges from './StoreBadges';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  game: Game;
}

export default function FeaturedGame({ game }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(sectionRef.current?.querySelectorAll('[data-animate]') ?? [], {
        opacity: 1, y: 0, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-animate]', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 bg-bg"
    >
      <div className="max-w-4xl mx-auto px-6">

        {/* Capsule art — links to game detail page */}
        <a
          data-animate
          href={`/games/${game.id}`}
          className="block mb-8 group"
        >
          {game.steamAssets.header && (
            <img
              src={game.steamAssets.header}
              alt={game.title}
              width={920}
              height={430}
              loading="lazy"
              className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
            />
          )}
        </a>

        {/* Tagline + platforms + CTAs — tight and direct */}
        <div data-animate className="text-center">
          <span className="inline-block bg-accent text-white font-body font-semibold text-sm px-4 py-1.5 rounded-full mb-5">
            {game.tagline}
          </span>

          <p className="font-body text-text/70 text-base max-w-lg mx-auto mb-6">
            {game.shortDescription}
          </p>

          {/* CTAs — platform-aware via StoreBadges */}
          <div className="flex justify-center mb-4">
            <StoreBadges game={game} utmContent="featured_cta" showPrice />
          </div>
        </div>

      </div>
    </section>
  );
}

