// src/components/Philosophy.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const dramaticRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = dramaticRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(el.querySelectorAll('[data-word]'), { opacity: 1, y: 0, clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-word]', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.03,
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Split the dramatic text into word spans
  const dramaticWords = [
    { text: 'hand-crafted', accent: true },
    { text: 'challenges', accent: false },
    { text: 'that', accent: false },
    { text: 'respect', accent: false },
    { text: 'how', accent: false },
    { text: 'you', accent: false },
    { text: 'think.', accent: false },
  ];

  return (
    <section className="w-full bg-light-gray py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Muted contrast block */}
        <div className="mb-10">
          <p className="font-body text-lg text-text/60">Most puzzle games focus on:</p>
          <p className="font-body text-lg text-text/60">
            quantity, procedural generation, difficulty for its own sake.
          </p>
        </div>

        {/* Dramatic brand statement */}
        <div>
          <p className="font-body text-lg text-text/60 mb-2">We focus on:</p>
          <p
            ref={dramaticRef}
            className="font-drama italic text-4xl md:text-6xl"
          >
            {dramaticWords.map((word, i) => (
              <span key={i} data-word className={word.accent ? 'text-accent' : undefined}>
                {word.text}
                {i < dramaticWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
