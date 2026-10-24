/** Original path-drawn wordmark: no font or external asset dependency. */
export const wordmarkPath =
  'M8 8H39V45Q39 65 18 65Q9 65 2 61L6 49Q12 52 17 52Q25 52 25 44V21H8Z M47 43Q47 20 68 20Q88 20 88 42V48H61Q63 56 73 56Q79 56 85 53V63Q78 67 70 67Q47 67 47 43Z M61 38H75Q74 30 68 30Q62 30 61 38Z M98 11H112V22H124V33H112V49Q112 55 119 55H124V65Q120 67 114 67Q98 67 98 51V33H92V22H98Z M133 22H147V49Q147 56 154 56Q161 56 161 49V22H175V50Q175 67 154 67Q133 67 133 50Z';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return compact ? (
    <svg
      className="brand-mark"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <path
        d="M20 14H46V38Q46 53 30 53Q21 53 15 47L22 39Q26 43 30 43Q35 43 35 37V24H20Z"
        fill="var(--accent)"
      />
    </svg>
  ) : (
    <svg
      className="brand-logo"
      viewBox="0 0 180 76"
      aria-hidden="true"
      focusable="false"
    >
      <path d={wordmarkPath} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
