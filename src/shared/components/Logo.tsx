import { useId } from 'react';

interface LogoProps {
  size?: number;
  /** Anima los destellos (se desactiva solo si el sistema pide menos movimiento). */
  animated?: boolean;
}

/** Destello de cuatro puntas. */
const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;

/**
 * Logo de BurnScope: una lupa en llamas con brillo y destellos ("glimmering").
 * La ilustración es la misma de public/icons/icon.svg (ver scripts/make-icons.py):
 * si cambias una, actualiza la otra.
 */
export function Logo({ size = 40, animated = true }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;

  return (
    <svg
      className={`logo ${animated ? 'logo--animated' : ''}`.trim()}
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="BurnScope"
    >
      <defs>
        <linearGradient id={id('flame')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.45" stopColor="#ff9a3c" />
          <stop offset="1" stopColor="#e0362c" />
        </linearGradient>
        <linearGradient id={id('core')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset="1" stopColor="#ffc94a" />
        </linearGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffc247" />
          <stop offset="1" stopColor="#c47a16" />
        </linearGradient>
        <radialGradient id={id('halo')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <filter id={id('glow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="232" cy="232" r="205" fill={`url(#${id('halo')})`} />
      <path d="M322 322L428 428" stroke="#7a4a12" strokeWidth="46" strokeLinecap="round" />
      <path
        d="M322 322L428 428"
        stroke={`url(#${id('rim')})`}
        strokeWidth="34"
        strokeLinecap="round"
      />
      <path
        d="M336 312L420 396"
        stroke="#fff6d6"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="222" cy="222" r="128" fill="#bfe3ff" fillOpacity="0.12" />

      <g filter={`url(#${id('glow')})`}>
        <path
          d="M222 112C238 156 286 182 286 246C286 285 258 314 222 314C186 314 158 285 158 246C158 210 182 196 194 164C204 182 211 187 215 176C219 160 218 136 222 112Z"
          fill={`url(#${id('flame')})`}
        />
        <path
          d="M222 204C232 230 256 244 256 274C256 294 241 308 222 308C203 308 188 294 188 274C188 254 200 248 207 231C213 241 218 240 222 204Z"
          fill={`url(#${id('core')})`}
        />
      </g>
      <g filter={`url(#${id('glow')})`}>
        <path
          d="M338 58C352 92 396 106 388 156C383 188 354 196 342 178C331 162 344 148 332 128C323 113 337 90 338 58Z"
          fill={`url(#${id('flame')})`}
        />
        <path
          d="M342 126C350 142 370 150 366 172C363 184 350 188 344 180C339 172 346 166 341 156C338 150 343 140 342 126Z"
          fill={`url(#${id('core')})`}
        />
      </g>

      <circle cx="222" cy="222" r="128" fill="none" stroke="#7a4a12" strokeWidth="38" />
      <circle
        cx="222"
        cy="222"
        r="128"
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeWidth="28"
      />
      <path
        d="M130 170A108 108 0 0 1 200 112"
        fill="none"
        stroke="#ffffff"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.75"
      />

      <path className="logo__spark logo__spark--a" d={sparkle(414, 92, 30)} fill="#fff7d6" />
      <path className="logo__spark logo__spark--b" d={sparkle(92, 332, 20)} fill="#ffe9a0" />
      <path className="logo__spark logo__spark--c" d={sparkle(452, 262, 15)} fill="#ffffff" />
      <path className="logo__spark logo__spark--a" d={sparkle(120, 62, 13)} fill="#ffffff" />
      <path className="logo__spark logo__spark--b" d={sparkle(402, 186, 10)} fill="#ffe9a0" />
    </svg>
  );
}
