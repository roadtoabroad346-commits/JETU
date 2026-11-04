/** Original JETU travelling bird. Vector parts support finite CSS gesture animation. */
export function JetuMascot({
  mood = 'welcome',
  className = '',
}: {
  mood?: 'welcome' | 'thinking' | 'celebrate';
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 300"
      className={`jetu-mascot jetu-mascot--${mood} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="160"
        cy="274"
        rx="75"
        ry="9"
        fill="var(--ink)"
        opacity=".08"
      />
      <g className="mascot-orbit" fill="var(--accent)">
        <path d="m270 62 5 13 14 5-14 5-5 14-5-14-14-5 14-5Z" />
        <path d="m55 117 3 9 10 3-10 4-3 10-4-10-9-4 9-3Z" />
        <circle cx="242" cy="192" r="5" />
      </g>
      <g className="mascot-body">
        <path
          d="M206 124c34-5 46 18 39 55l-13 50-29-10Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="5"
        />
        <path
          d="m228 160 15 5m-20 16 17 5"
          stroke="var(--accent-hover)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="m132 239-11 25c-7 9-25 5-26 0 0-6 13-10 13-10l5-24m68 9 8 20s17 3 18 9c-7 8-26 5-31-1l-13-26"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M86 102c-4-27 6-40 20-45l-2 31c31-37 65-28 88-11 35 24 46 69 39 106-8 49-37 69-78 68-47-1-78-31-81-73-2-24 4-51 14-76Z"
          fill="var(--brand)"
          stroke="var(--ink)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M89 140c13-42 80-56 117-13 25 29 18 92-23 108-50 19-99-14-94-59Z"
          fill="var(--surface)"
        />
        <path
          d="M103 105c9-16 21-24 35-28"
          fill="none"
          stroke="var(--surface)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity=".35"
        />
        <g className="mascot-eyes" fill="var(--ink)">
          <ellipse cx="124" cy="149" rx="10" ry="15" />
          <ellipse cx="181" cy="145" rx="10" ry="15" />
          <circle cx="127" cy="144" r="3" fill="var(--surface)" />
          <circle cx="184" cy="140" r="3" fill="var(--surface)" />
        </g>
        <ellipse
          cx="105"
          cy="171"
          rx="11"
          ry="6"
          fill="var(--accent)"
          opacity=".45"
        />
        <ellipse
          cx="203"
          cy="165"
          rx="11"
          ry="6"
          fill="var(--accent)"
          opacity=".45"
        />
        <path
          d="m142 166 24-3-10 17Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M143 191q15 12 29-3"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M88 209q58 24 118-12l9 13q-61 41-128 15Z"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="4"
        />
        <path
          d="m106 229-6 31 20-7 11 11 8-29"
          fill="var(--accent)"
          stroke="var(--ink)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          className="mascot-wing"
          d="M81 168c-31-13-40-3-28 16 9 15 27 25 40 19"
          fill="var(--primary)"
          stroke="var(--ink)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          className="mascot-wave"
          d="M212 172c29-19 42-47 53-40 16 11-6 59-38 70"
          fill="var(--brand)"
          stroke="var(--ink)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="m237 89 31-20-8 30-8-8-8 5 1-12Z"
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
