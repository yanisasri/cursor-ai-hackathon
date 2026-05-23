import type { AvatarConfig } from "../types";

interface Props {
  avatar: AvatarConfig;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizes = { sm: 48, md: 80, lg: 120 };

export function AvatarPreview({ avatar, size = "md", label }: Props) {
  const px = sizes[size];
  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={px}
        height={px * 1.2}
        viewBox="0 0 80 96"
        className="drop-shadow-md"
        aria-hidden
      >
        <ellipse cx="40" cy="88" rx="22" ry="6" fill="#00000018" />
        <rect x="28" y="62" width="24" height="22" rx="4" fill={avatar.bottomColor} />
        {avatar.bottomStyle === "skirt" && (
          <path d="M28 72 L40 88 L52 72 Z" fill={avatar.bottomColor} opacity="0.9" />
        )}
        <rect x="30" y="38" width="20" height="26" rx="3" fill={avatar.shirtColor} />
        {avatar.shirtStyle === "hoodie" && (
          <path d="M30 42 Q40 36 50 42 L50 48 Q40 44 30 48 Z" fill={avatar.shirtColor} opacity="0.85" />
        )}
        {avatar.shirtStyle === "sweater" && (
          <line x1="32" y1="48" x2="48" y2="48" stroke="#ffffff33" strokeWidth="2" />
        )}
        <circle cx="40" cy="28" r="14" fill="#f5d0b5" />
        <Hair avatar={avatar} />
        <ellipse cx="34" cy="28" rx="2" ry="2.5" fill="#333" />
        <ellipse cx="46" cy="28" rx="2" ry="2.5" fill="#333" />
        <path d="M36 34 Q40 37 44 34" stroke="#c49a74" strokeWidth="1.5" fill="none" />
        <Shoes avatar={avatar} />
      </svg>
      {label && <span className="text-xs font-medium text-cozy-700">{label}</span>}
    </div>
  );
}

function Hair({ avatar }: { avatar: AvatarConfig }) {
  const c = avatar.hairColor;
  switch (avatar.hairstyle) {
    case "short":
      return <ellipse cx="40" cy="18" rx="16" ry="10" fill={c} />;
    case "long":
      return (
        <>
          <ellipse cx="40" cy="18" rx="16" ry="10" fill={c} />
          <rect x="22" y="18" width="8" height="28" rx="4" fill={c} />
          <rect x="50" y="18" width="8" height="28" rx="4" fill={c} />
        </>
      );
    case "curly":
      return (
        <>
          {[32, 40, 48].map((x) => (
            <circle key={x} cx={x} cy={16} r="8" fill={c} />
          ))}
        </>
      );
    case "bun":
      return (
        <>
          <ellipse cx="40" cy="18" rx="14" ry="9" fill={c} />
          <circle cx="40" cy="6" r="8" fill={c} />
        </>
      );
    default:
      return <ellipse cx="40" cy="17" rx="17" ry="11" fill={c} />;
  }
}

function Shoes({ avatar }: { avatar: AvatarConfig }) {
  const fill =
    avatar.shoes === "boots" ? "#4a3728" : avatar.shoes === "sandals" ? "#c49a74" : "#6b7280";
  return (
    <>
      <rect x="28" y="82" width="12" height="6" rx="2" fill={fill} />
      <rect x="40" y="82" width="12" height="6" rx="2" fill={fill} />
    </>
  );
}
