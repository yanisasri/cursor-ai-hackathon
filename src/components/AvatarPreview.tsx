import { useMemo } from "react";
import type { AvatarConfig } from "../types";
import { generateAvatarSvg } from "../lib/generateAvatar";

interface Props {
  avatar: AvatarConfig;
  size?: "sm" | "md" | "lg";
  scale?: number;
  label?: string;
}

const sizes = { sm: 44, md: 68, lg: 132 };

export function AvatarPreview({ avatar, size = "md", scale = 1, label }: Props) {
  const px = Math.round(sizes[size] * scale);

  const svg = useMemo(
    () => generateAvatarSvg(avatar, px),
    [avatar, px]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="overflow-hidden drop-shadow-sm [&>svg]:block [&>svg]:h-auto [&>svg]:max-w-full"
        style={{ width: px, height: px, lineHeight: 0 }}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {label && (
        <span className="max-w-[80px] truncate text-center text-xs font-medium text-gray-600">
          {label}
        </span>
      )}
    </div>
  );
}
