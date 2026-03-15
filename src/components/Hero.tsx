// src/components/Hero.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  steamUrl: string;
  headerImage: string;
}

export default function Hero({ steamUrl, headerImage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current?.querySelectorAll('[data-animate]') ?? [], {
        opacity: 1, y: 0, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-animate]', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      data-hero
      className="relative min-h-dvh flex items-end overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${headerImage})` }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent" />

      {/* Content — bottom-left */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24 md:pb-32 w-full">
        <p data-animate className="font-body font-semibold tracking-tight text-3xl md:text-5xl text-white mb-2">
          Thoughtfully crafted
        </p>
        <p data-animate className="font-drama italic text-6xl md:text-8xl text-white">
          Games<span className="text-accent">.</span>
        </p>
        <p data-animate className="font-body text-lg text-white/80 mt-6 mb-8">
          Independent studio. Handmade puzzles. No filler.
        </p>
        <a data-animate href={steamUrl} target="_blank" rel="noopener noreferrer" className="btn-accent">
          <span className="bg-slide" />
          Play Pathways &amp; Poltergeists
        </a>
      </div>
    </section>
  );
}
