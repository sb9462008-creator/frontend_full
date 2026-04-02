type SiteLogoProps = {
  size?: "sm" | "lg";
  showText?: boolean;
  animated?: boolean;
  subtitle?: string;
  className?: string;
};

export function SiteLogo({
  size = "sm",
  showText = true,
  animated = false,
  subtitle = "Performance Hardware",
  className = "",
}: SiteLogoProps) {
  const markSizeClass = size === "lg" ? "h-28 w-28 rounded-[2rem]" : "h-12 w-12 rounded-2xl";
  const titleClass = size === "lg" ? "text-[2.4rem]" : "text-[1.3rem]";
  const subtitleClass = size === "lg" ? "text-[0.7rem]" : "text-[11px]";

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className={`site-logo-mark ${animated ? "site-logo-mark-animated" : ""} ${markSizeClass}`}>
        <div className="site-logo-glow" />
        <div className="site-logo-grid" />
        <svg viewBox="0 0 100 100" aria-hidden="true" className="site-logo-svg">
          <defs>
            <linearGradient id="site-logo-red" x1="22" y1="18" x2="80" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ff676f" />
              <stop offset="1" stopColor="#cf232d" />
            </linearGradient>
            <linearGradient id="site-logo-steel" x1="20" y1="16" x2="82" y2="86" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f7f7f5" />
              <stop offset="1" stopColor="#c7c7c0" />
            </linearGradient>
            <radialGradient id="site-logo-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(18)">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#ff676f" />
              <stop offset="1" stopColor="#cf232d" />
            </radialGradient>
          </defs>

          <rect x="10" y="10" width="80" height="80" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
          <path className="site-logo-frame-line" d="M24 30h16" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
          <path className="site-logo-frame-line" d="M60 70h16" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
          <path className="site-logo-x-stroke site-logo-x-left" d="M31 27L50 50L31 73" stroke="url(#site-logo-steel)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path className="site-logo-x-stroke site-logo-x-right" d="M69 27L50 50L69 73" stroke="url(#site-logo-red)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="site-logo-core" cx="50" cy="50" r="5.5" fill="url(#site-logo-core)" />
          <circle className="site-logo-node site-logo-node-left" cx="31" cy="27" r="3.2" fill="#f7f7f5" />
          <circle className="site-logo-node site-logo-node-right" cx="69" cy="73" r="3.2" fill="#ff676f" />
        </svg>
      </div>

      {showText ? (
        <div>
          <div className={`site-logo-wordmark ${titleClass} ${animated ? "site-logo-wordmark-animated" : ""} font-extrabold text-[#f5f5f3]`}>
            <span className="site-logo-letter site-logo-letter-x">X</span>
            <span className="site-logo-letter site-logo-letter-a">A</span>
            <span className="site-logo-letter site-logo-letter-d">D</span>
            <span className="site-logo-letter site-logo-letter-e">E</span>
            <span className="site-logo-letter site-logo-letter-dot text-[var(--accent)]">.</span>
          </div>
          <div className={`${subtitleClass} font-semibold uppercase tracking-[0.18em] text-[var(--muted)]`}>
            {subtitle}
          </div>
        </div>
      ) : null}
    </div>
  );
}
