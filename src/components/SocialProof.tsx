// src/components/SocialProof.tsx
// Renders social proof elements (Steam reviews, press quotes, awards)
// designed to sit near conversion CTAs per the improvement plan.

import { useEffect, useState } from 'react';
import type { SocialProof as SocialProofData } from '../data/games';

interface Props {
  socialProof: SocialProofData;
}

export default function SocialProof({ socialProof }: Props) {
  const { steamReviewSummary, pressQuotes, awards } = socialProof;
  const hasContent = steamReviewSummary || (pressQuotes && pressQuotes.length > 0) || (awards && awards.length > 0);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  useEffect(() => {
    if (!pressQuotes || pressQuotes.length <= 1) return;
    
    // Pick a random starting quote on mount to vary the initial view
    setActiveQuoteIdx(Math.floor(Math.random() * pressQuotes.length));

    // Cycle quotes every 7 seconds
    const interval = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % pressQuotes.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [pressQuotes]);

  if (!hasContent) return null;

  return (
    <div
      className="px-6 md:px-8 py-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
        {/* Review summary */}
        {steamReviewSummary && (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star opacity-80"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span
              className="font-body font-semibold text-[13px] tracking-wide"
              style={{ color: 'var(--accent)' }}
            >
              {steamReviewSummary}
            </span>
          </div>
        )}

        {/* Press quotes (Cycling) */}
        {pressQuotes && pressQuotes.length > 0 && (
          <div className="flex flex-col items-center gap-4 min-h-[120px] justify-center relative w-full overflow-hidden">
            {pressQuotes.map((quote, i) => (
              <blockquote 
                key={i} 
                className={`text-center max-w-xl transition-all duration-700 absolute w-full ${
                  i === activeQuoteIdx 
                    ? 'opacity-100 translate-y-0 visible relative' 
                    : 'opacity-0 translate-y-4 invisible absolute'
                }`}
              >
                <p
                  className="font-drama italic text-[18px] md:text-[20px] leading-[1.6]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  "{quote.quote}"
                </p>
                <cite
                  className="font-body text-[11px] font-semibold uppercase tracking-[1px] mt-2 block not-italic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  — {quote.url ? (
                    <a
                      href={quote.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[var(--text-secondary)]"
                      style={{ color: 'inherit' }}
                    >
                      {quote.source}
                    </a>
                  ) : (
                    quote.source
                  )}
                </cite>
              </blockquote>
            ))}
          </div>
        )}

        {/* Awards / laurels */}
        {awards && awards.length > 0 && (
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {awards.map((award, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center px-4 py-2"
                style={{
                  borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <span
                  className="font-body font-bold text-[11px] uppercase tracking-[1px]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {award.name}
                </span>
                <span
                  className="font-body text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {award.event}{award.year ? ` ${award.year}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
