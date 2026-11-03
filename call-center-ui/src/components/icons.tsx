import type { ReactNode } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<string, ReactNode> = {
  phone: <path {...stroke} d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  hangup: (
    <path
      fill="currentColor"
      transform="rotate(135 12 12)"
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
    />
  ),
  mic: (<><rect {...stroke} x="9" y="3" width="6" height="11" rx="3" /><path {...stroke} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>),
  micOff: (<><rect {...stroke} x="9" y="3" width="6" height="11" rx="3" /><path {...stroke} d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" /></>),
  chat: <path {...stroke} d="M4 5h16v11H8l-4 4z" />,
  search: (<><circle {...stroke} cx="11" cy="11" r="7" /><path {...stroke} d="m20 20-3.5-3.5" /></>),
  back: <path {...stroke} d="m9 6 6 6-6 6" />,
  shield: <path {...stroke} d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />,
  undo: (<><path {...stroke} d="M3 12a9 9 0 1 0 3-6.7" /><path {...stroke} d="M3 4v5h5" /></>),
  send: <path {...stroke} d="M20 4 3 11l7 2 2 7z" />,
  palm: (
    <>
      <path {...stroke} d="M12 21c0-5 .3-8.5 1-11" />
      <path {...stroke} d="M13 10c-1.5-3-4.5-3.8-7.5-2.3 2.6.2 4.6 1 7.5 2.3zM13 10c.8-3.4 3.8-4.9 6.8-4.1-2.6.8-4.6 2-6.8 4.1zM13 10c-3.2-.1-5.6 1.5-6.4 4.5 1.8-2 3.8-3.2 6.4-4.5zM13 10c3 .2 5.1 2.2 5.3 5.2-1.5-2.1-3.3-3.6-5.3-5.2z" />
    </>
  ),
};

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
