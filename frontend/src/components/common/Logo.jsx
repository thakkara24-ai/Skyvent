import React from 'react';

export const SkyventLogo = ({ size = 36, className = "", withText = false, light = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
      >
        <defs>
          {/* Main S Ribbon Gradient - Dynamic theme CSS variables */}
          <linearGradient id="skyventRibbonGrad" x1="50" y1="50" x2="450" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--clay-brown)" />
            <stop offset="50%" stopColor="var(--coffee-brown)" />
            <stop offset="100%" stopColor="var(--coffee-hover)" />
          </linearGradient>

          {/* S Upper Curve Gradient */}
          <linearGradient id="skyventTopLoop" x1="120" y1="80" x2="380" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--clay-brown)" />
            <stop offset="50%" stopColor="var(--coffee-brown)" />
            <stop offset="100%" stopColor="var(--ink-brown)" />
          </linearGradient>

          {/* S Bottom Loop Gradient */}
          <linearGradient id="skyventBottomLoop" x1="120" y1="260" x2="420" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--coffee-brown)" />
            <stop offset="60%" stopColor="var(--coffee-hover)" />
            <stop offset="100%" stopColor="var(--ink-brown)" />
          </linearGradient>

          {/* Arrow / Airplane Gradient */}
          <linearGradient id="skyventArrowGrad" x1="360" y1="180" x2="480" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--clay-brown)" />
            <stop offset="50%" stopColor="var(--coffee-brown)" />
            <stop offset="100%" stopColor="var(--coffee-hover)" />
          </linearGradient>

          {/* Orbit Loop Gradient */}
          <linearGradient id="skyventOrbitGrad" x1="50" y1="360" x2="440" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--clay-brown)" />
            <stop offset="50%" stopColor="var(--coffee-brown)" />
            <stop offset="100%" stopColor="var(--ink-brown)" />
          </linearGradient>
        </defs>

        {/* Orbit Ring Behind S */}
        <path
          d="M 60 340 C 40 310, 80 250, 180 200 C 260 160, 360 120, 420 90"
          stroke="url(#skyventOrbitGrad)"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Bottom S Loop */}
        <path
          d="M 170 300 C 230 350, 310 400, 380 400 C 440 400, 440 330, 380 280 C 320 230, 240 200, 160 160 C 100 130, 90 60, 170 60 C 250 60, 330 110, 370 160"
          stroke="url(#skyventBottomLoop)"
          strokeWidth="68"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Top S Ribbon Loop */}
        <path
          d="M 370 150 C 340 100, 270 60, 180 60 C 110 60, 90 120, 130 170 C 170 220, 250 250, 330 290 C 410 330, 430 410, 360 450 C 290 490, 190 460, 130 400"
          stroke="url(#skyventTopLoop)"
          strokeWidth="64"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Orbit Ring in Foreground Passing Over S */}
        <path
          d="M 70 330 C 120 370, 240 340, 340 250 C 390 200, 430 140, 460 90"
          stroke="url(#skyventOrbitGrad)"
          strokeWidth="28"
          strokeLinecap="round"
          fill="none"
        />

        {/* Upward Flying Airplane / Arrow */}
        <g transform="translate(365, 55) rotate(-15)">
          <polygon
            points="75,0 0,65 35,45"
            fill="url(#skyventArrowGrad)"
          />
          <polygon
            points="75,0 35,45 25,85"
            fill="var(--ink-brown)"
          />
          <polygon
            points="75,0 25,85 50,45"
            fill="var(--coffee-brown)"
          />
          <polygon
            points="75,0 50,45 85,55"
            fill="var(--clay-brown)"
          />
        </g>
      </svg>

      {withText && (
        <div className="flex flex-col">
          <span className={`text-xl font-extrabold tracking-tight leading-none transition-colors duration-200 ${light ? 'text-white' : 'text-[var(--ink-brown)]'}`}>
            SKYVENT
          </span>
          <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 transition-colors duration-200 ${light ? 'text-[var(--sand)]' : 'text-[var(--coffee-brown)]'}`}>
            Student Org Hub
          </span>
        </div>
      )}
    </div>
  );
};

export default SkyventLogo;
