// src/components/GameDetail.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Game } from '../data/games';
import StoreBadges from './StoreBadges';
import SocialProofComponent from './SocialProof';
import FAQDrawer from './FAQDrawer';

gsap.registerPlugin(ScrollTrigger);

function CTABar({ game, centered = false }: { game: Game; centered?: boolean }) {
  const utmContent = centered ? 'detail_bottom_cta' : 'detail_top_cta';
  const badgeHeight = centered ? 'h-[48px]' : 'h-[40px]';

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
          {centered ? (
            <h2
              className="font-body font-bold text-[16px]"
              style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
            >
              {game.title}
            </h2>
          ) : (
            <h1
              className="font-body font-bold text-[18px]"
              style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
            >
              {game.title}
            </h1>
          )}
          <p
            className="font-drama italic text-[11px] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {centered ? `Available now on Steam, iOS, and Android` : game.tagline}
          </p>
        </div>
        <StoreBadges
          game={game}
          utmContent={utmContent}
          badgeHeight={badgeHeight}
          showPrice={!centered}
        />
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

  // GSAP entrance + scroll animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(pageRef.current?.querySelectorAll('[data-reveal], [data-enter-detail], [data-reveal-content]') ?? [], {
        opacity: 1, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Entrance animations for trailer + CTA bar
      const entranceEls = gsap.utils.toArray<HTMLElement>('[data-enter-detail]');
      gsap.from(entranceEls, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.15,
      });

      // Content sections (scroll-triggered)
      const contentEls = gsap.utils.toArray<HTMLElement>('[data-reveal-content]');
      contentEls.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });

      // Staggered reveal on screenshots (each triggered independently)
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      items.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });

      // Bottom CTA bar (scroll-triggered)
      const bottomCta = pageRef.current?.querySelector('[data-cta-bottom]');
      if (bottomCta) {
        gsap.from(bottomCta, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bottomCta,
            start: 'top 90%',
            once: true,
          },
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Split screenshots into two rows for interweaved layout
  const screenshotRow1 = screenshots.slice(0, 2);
  const screenshotRow2 = screenshots.slice(2);

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
        width={2560}
        height={1440}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </button>
  );

  const row2Cols = screenshotRow2.length === 1 ? 'grid-cols-1'
    : screenshotRow2.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div ref={pageRef}>
      {/* ===== CTA BAR: Immediately below trailer ===== */}
      <div data-enter-detail>
        <CTABar game={game} />
      </div>

      {/* ===== SCREENSHOTS ROW 1: Edge-to-edge, above first text block ===== */}
      {screenshotRow1.length > 0 && (
        <div className="screenshot-grid" style={{ marginTop: '2px' }}>
          <div className={`grid ${screenshotRow1.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`} style={{ gap: '2px' }}>
            {screenshotRow1.map((src, i) => renderCell(src, i))}
          </div>
        </div>
      )}

      {/* ===== CONTENT BLOCK 1: Description + Feature highlights ===== */}
      <section
        className="px-6 md:px-8 py-12 md:py-16 max-w-4xl mx-auto"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {game.longDescription && (
          <div data-reveal-content className="mb-10">
            <p
              className="font-body text-[15px] md:text-[16px] leading-[1.8]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {game.longDescription}
            </p>
          </div>
        )}

        {game.featureHighlights && game.featureHighlights.length > 0 && (
          <div data-reveal-content className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {game.featureHighlights.map((highlight) => (
              <div
                key={highlight.title}
                className="p-5"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderLeft: '2px solid var(--accent)',
                }}
              >
                <h3
                  className="font-body font-bold text-[13px] uppercase tracking-[1px] mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {highlight.title}
                </h3>
                <p
                  className="font-body text-[13px] leading-[1.6]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== SCREENSHOTS ROW 2: Visual break between content blocks ===== */}
      {screenshotRow2.length > 0 && (
        <div style={{ marginTop: '2px' }}>
          <div className={`grid ${row2Cols}`} style={{ gap: '2px' }}>
            {screenshotRow2.map((src, i) => renderCell(src, screenshotRow1.length + i))}
          </div>
        </div>
      )}

      {/* ===== CONTENT BLOCK 2: Features list + How It Works ===== */}
      {((game.features && game.features.length > 0) || (game.keyMechanics && (game.keyMechanics.core || game.keyMechanics.pieces || game.keyMechanics.progression))) && (
        <section
          className="px-6 md:px-8 py-12 md:py-16 max-w-4xl mx-auto"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {game.features && game.features.length > 0 && (
            <div data-reveal-content className="mb-12">
              <h2
                className="font-body font-bold text-[14px] uppercase tracking-[1.5px] mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Features
              </h2>
              <ul className="space-y-2">
                {game.features.map((feature) => (
                  <li
                    key={feature}
                    className="font-body text-[14px] flex items-start gap-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span
                      className="mt-[7px] w-[6px] h-[6px] flex-shrink-0"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {game.keyMechanics && (game.keyMechanics.core || game.keyMechanics.pieces || game.keyMechanics.progression) && (
            <div data-reveal-content>
              <h2
                className="font-body font-bold text-[14px] uppercase tracking-[1.5px] mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                How It Works
              </h2>
              <div className="space-y-4">
                {game.keyMechanics.core && (
                  <div>
                    <h3
                      className="font-body font-semibold text-[12px] uppercase tracking-[1px] mb-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Core Mechanic
                    </h3>
                    <p
                      className="font-body text-[14px] leading-[1.7]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {game.keyMechanics.core}
                    </p>
                  </div>
                )}
                {game.keyMechanics.pieces && (
                  <div>
                    <h3
                      className="font-body font-semibold text-[12px] uppercase tracking-[1px] mb-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Puzzle Pieces
                    </h3>
                    <p
                      className="font-body text-[14px] leading-[1.7]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {game.keyMechanics.pieces}
                    </p>
                  </div>
                )}
                {game.keyMechanics.progression && (
                  <div>
                    <h3
                      className="font-body font-semibold text-[12px] uppercase tracking-[1px] mb-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Progression
                    </h3>
                    <p
                      className="font-body text-[14px] leading-[1.7]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {game.keyMechanics.progression}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== SOCIAL PROOF: Above final CTA ===== */}
      {game.socialProof && (
        <div data-reveal-content>
          <SocialProofComponent socialProof={game.socialProof} />
        </div>
      )}

      {/* ===== FINAL CTA: Centered, below screenshots ===== */}
      <div data-cta-bottom>
        <CTABar game={game} centered />
      </div>

      {/* ===== FAQ DRAWER: Below final CTA, unobtrusive ===== */}
      {game.faq && game.faq.length > 0 && (
        <FAQDrawer faqs={game.faq} />
      )}

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
            width={2560}
            height={1440}
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
