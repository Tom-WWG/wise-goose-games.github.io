// src/components/StoreBadges.tsx
// Shared store-badge row used by Hero, GameDetail CTABar, and FeaturedGame.
// Automatically reorders badges based on the user's detected platform.

import { useEffect, useState } from 'react';
import { detectPlatform } from '../utils/platform';
import type { Game, GamePlatform } from '../data/games';
import { buildTrackedUrl } from '../utils/utm';
import { getStoredUtms } from '../utils/utmSession';

// ── Badge definitions ────────────────────────────────────────────

interface BadgeDef {
  key: string;
  platform: GamePlatform;
  ariaLabel: string;
  preLabel: string;
  label: string;
  icon: React.ReactNode;
}

function steamIcon() {
  return <img src="/500px-Steam_icon_logo.svg.png" alt="" width={20} height={20} className="w-5 h-5 object-contain" />;
}

function appleIcon() {
  return <img src="/500px-Apple_logo_black.svg.png" alt="" width={18} height={22} className="w-[18px] h-[22px] object-contain brightness-0 invert" />;
}

function googlePlayIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
      <path d="M0.5 0.8C0.18 1.14 0 1.64 0 2.27V17.73C0 18.36 0.18 18.86 0.5 19.2L0.58 19.27L9.83 10.02V9.97L0.58 0.72L0.5 0.8Z" fill="#4285F4"/>
      <path d="M13.07 13.27L9.83 10.02V9.97L13.07 6.73L13.16 6.78L16.96 8.95C18.03 9.55 18.03 10.44 16.96 11.05L13.16 13.22L13.07 13.27Z" fill="#FBBC04"/>
      <path d="M13.16 13.22L9.83 9.99L0.5 19.2C0.88 19.6 1.5 19.65 2.2 19.25L13.16 13.22Z" fill="#EA4335"/>
      <path d="M13.16 6.78L2.2 0.75C1.5 0.35 0.88 0.4 0.5 0.8L9.83 9.99L13.16 6.78Z" fill="#34A853"/>
    </svg>
  );
}

function buildBadges(game: Game): BadgeDef[] {
  const badges: BadgeDef[] = [];
  const steam = game.platforms['steam'];
  const ios = game.platforms['ios'];
  const android = game.platforms['android'];

  if (steam) badges.push({ key: 'steam', platform: steam, ariaLabel: 'Available on Steam', preLabel: 'AVAILABLE ON', label: 'Steam', icon: steamIcon() });
  if (ios) badges.push({ key: 'ios', platform: ios, ariaLabel: 'Download on the App Store', preLabel: 'DOWNLOAD ON THE', label: 'App Store', icon: appleIcon() });
  if (android) badges.push({ key: 'android', platform: android, ariaLabel: 'Get it on Google Play', preLabel: 'GET IT ON', label: 'Google Play', icon: googlePlayIcon() });

  return badges;
}

// ── Component ────────────────────────────────────────────────────

interface Props {
  game: Game;
  /** UTM content tag, e.g. 'hero_cta' or 'detail_top_cta' */
  utmContent: string;
  /** Badge height class, e.g. 'h-[40px]' or 'h-[48px]' */
  badgeHeight?: string;
  /** Whether to show the price label before badges */
  showPrice?: boolean;
}

export default function StoreBadges({ game, utmContent, badgeHeight = 'h-[40px]', showPrice = false }: Props) {
  const [orderedBadges, setOrderedBadges] = useState<BadgeDef[]>(() => buildBadges(game));
  const [campaign, setCampaign] = useState<string | undefined>(undefined);

  useEffect(() => {
    const detected = detectPlatform();
    const badges = buildBadges(game);

    if (detected !== 'unknown') {
      // Move the detected platform's badge to the front
      const idx = badges.findIndex((b) => b.key === detected);
      if (idx > 0) {
        const [primary] = badges.splice(idx, 1);
        badges.unshift(primary);
      }
    }

    setOrderedBadges(badges);

    const utms = getStoredUtms();
    if (utms?.utm_campaign) {
      setCampaign(utms.utm_campaign);
    }
  }, [game]);

  return (
    <div className="store-badge-row">
      {showPrice && game.price && (
        <span
          className="font-body font-semibold text-[12px] sm:mr-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {game.price}
        </span>
      )}
      {orderedBadges.map((badge, i) => {
        const isPrimary = i === 0;
        return (
          <a
            key={badge.key}
            href={buildTrackedUrl(badge.platform.url, { content: utmContent, campaign })}
            target="_blank"
            rel="noopener noreferrer"
            data-utm-enhanced=""
            aria-label={badge.ariaLabel}
            className=""
          >
            <div
              className={`${isPrimary ? 'store-badge-primary' : 'store-badge-secondary'} ${isPrimary ? badgeHeight : 'h-[36px]'} px-4 flex items-center justify-center gap-2.5`}
              style={{ borderRadius: '0' }}
            >
              {badge.icon}
              <div className="flex flex-col items-start leading-tight" style={{ minWidth: '108px' }}>
                <span style={{
                  fontSize: '8px',
                  color: isPrimary ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                  letterSpacing: '0.5px',
                }}>
                  {badge.preLabel}
                </span>
                <span style={{
                  fontSize: isPrimary ? '14px' : '13px',
                  color: isPrimary ? 'var(--accent-text)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                }}>
                  {badge.label}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
