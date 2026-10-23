'use client';

import * as React from 'react';

interface BotiGestIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  hasShadow?: boolean;
}

export function BotiGestIcon({
  size = 36,
  className = '',
  hasShadow = true,
  ...props
}: BotiGestIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 transition-transform duration-200 select-none ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="bgGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A84FF" />
          <stop offset="50%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#004399" />
        </linearGradient>

        <radialGradient id="specularGlowIcon" cx="25%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="vitalityGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#30D158" />
          <stop offset="100%" stopColor="#34C759" />
        </linearGradient>

        <linearGradient id="cyanAccentIcon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64D2FF" />
          <stop offset="100%" stopColor="#0A84FF" />
        </linearGradient>

        {hasShadow && (
          <filter id="softShadowIcon" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#001844" floodOpacity="0.35" />
          </filter>
        )}
      </defs>

      {/* Superellipse Squircle */}
      <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bgGradIcon)" />
      <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#specularGlowIcon)" />
      <rect
        x="25"
        y="25"
        width="462"
        height="462"
        rx="111"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />

      {/* Center Emblem: Pharmaceutical 'B' + Medical Cross Fusion */}
      <g filter={hasShadow ? 'url(#softShadowIcon)' : undefined}>
        {/* Vertical Medical Column */}
        <rect x="148" y="128" width="60" height="256" rx="30" fill="#FFFFFF" />

        {/* Top Loop 'B' */}
        <path
          d="M178 128 H284 C330 128 360 156 360 196 C360 236 330 256 284 256 H178"
          stroke="#FFFFFF"
          strokeWidth="56"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom Loop 'B' */}
        <path
          d="M178 256 H304 C352 256 384 286 384 328 C384 370 352 384 304 384 H178"
          stroke="#FFFFFF"
          strokeWidth="56"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Horizontal Cross Bar */}
        <rect x="100" y="228" width="156" height="56" rx="28" fill="#FFFFFF" />

        {/* Vitality Core (Green / Cyan Core Beacon) */}
        <circle cx="282" cy="256" r="22" fill="url(#vitalityGradIcon)" />
        <circle cx="282" cy="256" r="14" fill="#FFFFFF" opacity="0.9" />

        {/* Upper & Lower Capsule Inner Accents */}
        <circle cx="280" cy="196" r="10" fill="url(#cyanAccentIcon)" opacity="0.85" />
        <circle cx="294" cy="328" r="12" fill="url(#cyanAccentIcon)" opacity="0.85" />
      </g>
    </svg>
  );
}

interface BotiGestLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function BotiGestLogo({
  size = 'md',
  showBadge = true,
  showTagline = false,
  className = '',
}: BotiGestLogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 38 : 46;
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-[16px]' : 'text-xl';
  const badgeSize = size === 'sm' ? 'text-[9px] px-1.5' : 'text-[10px] px-2';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative group">
        <BotiGestIcon
          size={iconSize}
          className="group-hover:scale-105 active:scale-95 transition-transform duration-200"
        />
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-bold ${textSize} tracking-[-0.03em] text-[#f5f5f7] leading-none`}
          >
            Boti<span className="text-[#2997ff]">Gest</span>
          </span>

          {showBadge && (
            <span
              className={`font-semibold uppercase tracking-wider py-0.5 rounded-full bg-white/[0.08] text-[#a1a1a6] border border-white/[0.08] ${badgeSize}`}
            >
              Botica
            </span>
          )}
        </div>

        {showTagline && (
          <span className="text-[11px] text-[#86868b] tracking-normal mt-1 leading-tight">
            Control Sanitario & Gestión Operativa
          </span>
        )}
      </div>
    </div>
  );
}
