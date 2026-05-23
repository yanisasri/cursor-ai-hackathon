import type { AvatarConfig } from "../types";

interface Props {
  avatar: AvatarConfig;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes = { sm: 52, md: 88, lg: 140 };

export function AvatarPreview({ avatar, size = "md", label }: Props) {
  const px = sizes[size];
  const skin = avatar.skinTone ?? "#f5d0b5";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        width={px}
        height={px * 1.25}
        viewBox="0 0 100 125"
        className="drop-shadow-lg"
        aria-hidden
      >
        <defs>
          <linearGradient id={`shirt-${avatar.shirtColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={avatar.shirtColor} />
            <stop offset="100%" stopColor={shade(avatar.shirtColor, -25)} />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="118" rx="28" ry="7" fill="#00000020" />
        <Bottom avatar={avatar} />
        <Shirt avatar={avatar} skin={skin} />
        <circle cx="50" cy="36" r="17" fill={skin} />
        <circle cx="50" cy="34" r="16" fill={skin} stroke={shade(skin, -15)} strokeWidth="0.5" />
        <Hair avatar={avatar} />
        <Face skin={skin} />
        <Accessory avatar={avatar} />
        <Shoes avatar={avatar} />
      </svg>
      {label && (
        <span className="max-w-[80px] truncate text-center text-xs font-semibold text-cozy-800">
          {label}
        </span>
      )}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (n & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Bottom({ avatar }: { avatar: AvatarConfig }) {
  if (avatar.bottomStyle === "dress") {
    return (
      <path
        d="M38 72 L50 108 L62 72 Q62 68 50 68 Q38 68 38 72 Z"
        fill={avatar.bottomColor}
        stroke={shade(avatar.bottomColor, -20)}
        strokeWidth="1"
      />
    );
  }
  if (avatar.bottomStyle === "skirt") {
    return (
      <>
        <rect x="38" y="72" width="24" height="12" rx="2" fill={avatar.bottomColor} />
        <path d="M38 80 L50 98 L62 80 Z" fill={avatar.bottomColor} />
      </>
    );
  }
  if (avatar.bottomStyle === "shorts") {
    return (
      <rect x="36" y="72" width="28" height="14" rx="4" fill={avatar.bottomColor} />
    );
  }
  return (
    <rect x="38" y="72" width="24" height="22" rx="3" fill={avatar.bottomColor} />
  );
}

function Shirt({ avatar, skin }: { avatar: AvatarConfig; skin: string }) {
  const fill = avatar.shirtColor;
  const dark = shade(fill, -30);
  switch (avatar.shirtStyle) {
    case "hoodie":
      return (
        <>
          <path d="M35 48 Q50 40 65 48 L68 78 L32 78 Z" fill={fill} />
          <path d="M35 48 Q50 42 65 48" fill="none" stroke={dark} strokeWidth="1.5" />
          <ellipse cx="50" cy="52" rx="6" ry="8" fill={dark} opacity="0.3" />
        </>
      );
    case "jacket":
      return (
        <>
          <path d="M32 50 L68 50 L70 82 L30 82 Z" fill={fill} />
          <path d="M32 50 L50 58 L68 50" fill={dark} />
          <rect x="48" y="58" width="4" height="20" fill="#c0c0c0" rx="1" />
        </>
      );
    case "blazer":
      return (
        <>
          <path d="M33 51 L67 51 L69 80 L31 80 Z" fill={fill} />
          <path d="M40 51 L50 70 L60 51" fill="#fff" opacity="0.15" />
          <circle cx="50" cy="62" r="2" fill="#ffd700" />
        </>
      );
    case "polo":
      return (
        <>
          <path d="M36 52 L64 52 L66 78 L34 78 Z" fill={fill} />
          <path d="M47 52 L50 58 L53 52" fill={skin} />
          <line x1="50" y1="58" x2="50" y2="68" stroke={dark} strokeWidth="1" />
        </>
      );
    case "tank":
      return (
        <path d="M40 54 L60 54 L62 76 L38 76 Z" fill={fill} />
      );
    case "sweater":
      return (
        <>
          <path d="M34 52 L66 52 L68 80 L32 80 Z" fill={fill} />
          {[56, 62, 68].map((y) => (
            <line key={y} x1="36" y1={y} x2="64" y2={y} stroke="#ffffff22" strokeWidth="2" />
          ))}
        </>
      );
    default:
      return <path d="M36 52 L64 52 L66 78 L34 78 Z" fill={fill} />;
  }
}

function Hair({ avatar }: { avatar: AvatarConfig }) {
  const c = avatar.hairColor;
  switch (avatar.hairstyle) {
    case "short":
      return <path d="M33 28 Q50 14 67 28 Q65 38 50 36 Q35 38 33 28" fill={c} />;
    case "long":
      return (
        <>
          <path d="M33 28 Q50 14 67 28 L64 58 L36 58 Z" fill={c} />
          <rect x="28" y="28" width="10" height="35" rx="5" fill={c} />
          <rect x="62" y="28" width="10" height="35" rx="5" fill={c} />
        </>
      );
    case "curly":
      return (
        <>
          {[38, 50, 62].map((x) => (
            <circle key={x} cx={x} cy={22} r="10" fill={c} />
          ))}
          <ellipse cx="50" cy="30" rx="20" ry="12" fill={c} />
        </>
      );
    case "bun":
      return (
        <>
          <ellipse cx="50" cy="26" rx="18" ry="12" fill={c} />
          <circle cx="50" cy="10" r="10" fill={c} />
        </>
      );
    case "ponytail":
      return (
        <>
          <ellipse cx="50" cy="26" rx="18" ry="12" fill={c} />
          <ellipse cx="72" cy="32" rx="8" ry="14" fill={c} />
        </>
      );
    case "bangs":
      return (
        <>
          <ellipse cx="50" cy="24" rx="19" ry="11" fill={c} />
          <path d="M32 30 Q50 42 68 30 L66 24 Q50 34 34 24 Z" fill={c} />
        </>
      );
    default:
      return <ellipse cx="50" cy="24" rx="20" ry="13" fill={c} />;
  }
}

function Face({ skin }: { skin: string }) {
  return (
    <>
      <ellipse cx="43" cy="36" rx="2.5" ry="3" fill="#2d2d2d" />
      <ellipse cx="57" cy="36" rx="2.5" ry="3" fill="#2d2d2d" />
      <ellipse cx="44" cy="35" rx="1" ry="1.2" fill="#fff" opacity="0.6" />
      <ellipse cx="58" cy="35" rx="1" ry="1.2" fill="#fff" opacity="0.6" />
      <path
        d="M46 44 Q50 47 54 44"
        stroke={shade(skin, -40)}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="40" rx="4" ry="2" fill="#ffb4a2" opacity="0.35" />
      <ellipse cx="60" cy="40" rx="4" ry="2" fill="#ffb4a2" opacity="0.35" />
    </>
  );
}

function Accessory({ avatar }: { avatar: AvatarConfig }) {
  switch (avatar.accessory) {
    case "glasses":
      return (
        <>
          <circle cx="43" cy="36" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
          <circle cx="57" cy="36" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
          <line x1="49" y1="36" x2="51" y2="36" stroke="#333" strokeWidth="1.5" />
        </>
      );
    case "hat":
      return (
        <>
          <ellipse cx="50" cy="18" rx="22" ry="6" fill="#4a3728" />
          <path d="M35 18 L38 8 L62 8 L65 18 Z" fill="#5c4033" />
        </>
      );
    case "headphones":
      return (
        <>
          <path
            d="M30 32 Q30 20 50 18 Q70 20 70 32"
            fill="none"
            stroke="#333"
            strokeWidth="3"
          />
          <rect x="26" y="30" width="8" height="14" rx="3" fill="#333" />
          <rect x="66" y="30" width="8" height="14" rx="3" fill="#333" />
        </>
      );
    default:
      return null;
  }
}

function Shoes({ avatar }: { avatar: AvatarConfig }) {
  const fills: Record<string, string> = {
    boots: "#3d2b1f",
    sandals: "#c49a74",
    heels: "#1a1a1a",
    loafers: "#5c4033",
    sneakers: "#6b7280",
  };
  const fill = fills[avatar.shoes] ?? "#6b7280";
  if (avatar.shoes === "heels") {
    return (
      <>
        <path d="M36 100 L44 100 L42 108 L38 108 Z" fill={fill} />
        <path d="M56 100 L64 100 L62 108 L58 108 Z" fill={fill} />
      </>
    );
  }
  return (
    <>
      <rect x="34" y="100" width="16" height="8" rx="3" fill={fill} />
      <rect x="50" y="100" width="16" height="8" rx="3" fill={fill} />
      {avatar.shoes === "sneakers" && (
        <>
          <rect x="36" y="104" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
          <rect x="52" y="104" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
        </>
      )}
    </>
  );
}
