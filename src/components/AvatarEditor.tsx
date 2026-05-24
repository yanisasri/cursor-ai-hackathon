import { useState } from "react";
import type { AvatarConfig } from "../types";
import { AVATAR_LIMITS, DEFAULT_AVATAR, LORELEI_MOUTHS } from "../types";
import { createAvatarSeed } from "../lib/generateAvatar";
import { AvatarPreview } from "./AvatarPreview";

const SKIN_TONES = [
  "#f5d0b5", "#ffdbac", "#e8c4a8", "#d4a574", "#c68642", "#8d5524",
  "#6b4423", "#f1c27d", "#e0ac69", "#c49a74", "#a67c52", "#5c3d2e",
] as const;
const HAIR_COLORS = [
  "#1a1a1a", "#4a3728", "#8b5a2b", "#c49a74", "#f5d0b5",
  "#c0392b", "#e74c3c", "#e67e22", "#f1c40f", "#27ae60",
  "#2980b9", "#8e44ad", "#d63384", "#ffffff", "#a0a0a0",
] as const;

interface Props {
  initial: AvatarConfig;
  onSave: (avatar: AvatarConfig) => void;
  submitLabel?: string;
}

function clampIndex(value: number, min: number, max: number) {
  if (value < min) return max;
  if (value > max) return min;
  return value;
}

export function AvatarEditor({ initial, onSave, submitLabel = "Save avatar" }: Props) {
  const [avatar, setAvatar] = useState<AvatarConfig>({
    ...DEFAULT_AVATAR,
    ...initial,
  });

  function cycleIndex(
    key: "hairIndex" | "eyesIndex" | "eyebrowsIndex" | "mouthIndex" | "glassesIndex" | "earringsIndex",
    min: number,
    max: number,
    dir: -1 | 1
  ) {
    setAvatar((a) => ({
      ...a,
      [key]: clampIndex(a[key] + dir, min, max),
    }));
  }

  const styleRows: {
    label: string;
    value: string;
    idx: number;
    total: number;
    prev: () => void;
    next: () => void;
  }[] = [
    {
      label: "Hair",
      value: `style ${avatar.hairIndex}`,
      idx: avatar.hairIndex,
      total: AVATAR_LIMITS.hair,
      prev: () => cycleIndex("hairIndex", 1, AVATAR_LIMITS.hair, -1),
      next: () => cycleIndex("hairIndex", 1, AVATAR_LIMITS.hair, 1),
    },
    {
      label: "Eyes",
      value: `style ${avatar.eyesIndex}`,
      idx: avatar.eyesIndex,
      total: AVATAR_LIMITS.eyes,
      prev: () => cycleIndex("eyesIndex", 1, AVATAR_LIMITS.eyes, -1),
      next: () => cycleIndex("eyesIndex", 1, AVATAR_LIMITS.eyes, 1),
    },
    {
      label: "Mouth",
      value: LORELEI_MOUTHS[avatar.mouthIndex] ?? LORELEI_MOUTHS[0],
      idx: avatar.mouthIndex + 1,
      total: LORELEI_MOUTHS.length,
      prev: () => cycleIndex("mouthIndex", 0, LORELEI_MOUTHS.length - 1, -1),
      next: () => cycleIndex("mouthIndex", 0, LORELEI_MOUTHS.length - 1, 1),
    },
    {
      label: "Brows",
      value: `style ${avatar.eyebrowsIndex}`,
      idx: avatar.eyebrowsIndex,
      total: AVATAR_LIMITS.eyebrows,
      prev: () => cycleIndex("eyebrowsIndex", 1, AVATAR_LIMITS.eyebrows, -1),
      next: () => cycleIndex("eyebrowsIndex", 1, AVATAR_LIMITS.eyebrows, 1),
    },
    {
      label: "Glasses",
      value: avatar.glassesIndex === 0 ? "none" : `style ${avatar.glassesIndex}`,
      idx: avatar.glassesIndex,
      total: AVATAR_LIMITS.glasses,
      prev: () => cycleIndex("glassesIndex", 0, AVATAR_LIMITS.glasses, -1),
      next: () => cycleIndex("glassesIndex", 0, AVATAR_LIMITS.glasses, 1),
    },
    {
      label: "Earrings",
      value: avatar.earringsIndex === 0 ? "none" : `style ${avatar.earringsIndex}`,
      idx: avatar.earringsIndex,
      total: AVATAR_LIMITS.earrings,
      prev: () => cycleIndex("earringsIndex", 0, AVATAR_LIMITS.earrings, -1),
      next: () => cycleIndex("earringsIndex", 0, AVATAR_LIMITS.earrings, 1),
    },
    {
      label: "Freckles",
      value: avatar.freckles ? "on" : "off",
      idx: avatar.freckles ? 1 : 0,
      total: 1,
      prev: () => setAvatar((a) => ({ ...a, freckles: !a.freckles })),
      next: () => setAvatar((a) => ({ ...a, freckles: !a.freckles })),
    },
  ];

  return (
    <div
      className="mx-auto w-full max-w-2xl select-none"
      style={{
        background: "linear-gradient(145deg, #5a3f8f 0%, #3d2870 100%)",
        borderRadius: "16px",
        padding: "4px",
        boxShadow:
          "0 8px 40px rgba(90,63,143,0.45), inset 0 0 0 1px rgba(155,130,212,0.4)",
      }}
    >
      <div
        className="rounded-xl p-5"
        style={{
          background: "linear-gradient(160deg, #f5f5fa 0%, #eeecf6 100%)",
        }}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[170px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <div
              style={{
                border: "3px solid #5a3f8f",
                borderRadius: "10px",
                padding: "3px",
                background: "#5a3f8f",
                boxShadow:
                  "inset 0 0 0 2px #9b82d4, 0 4px 14px rgba(90,63,143,0.35)",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(180deg, #dddaf2 0%, #ebe8f8 55%, #d4d0ea 100%)",
                  width: 148,
                  height: 148,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "radial-gradient(circle, rgba(90,63,143,0.12) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <AvatarPreview avatar={avatar} size="lg" scale={0.92} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="space-y-1.5">
                {styleRows.map((r) => (
                  <SdvRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    idx={r.idx}
                    total={r.total}
                    onPrev={r.prev}
                    onNext={r.next}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <ColorSection
                  label="Skin tone"
                  colors={SKIN_TONES}
                  value={avatar.skinTone ?? "#f5d0b5"}
                  onChange={(c) => setAvatar((a) => ({ ...a, skinTone: c }))}
                />
                <ColorSection
                  label="Hair color"
                  colors={HAIR_COLORS}
                  value={avatar.hairColor}
                  onChange={(c) => setAvatar((a) => ({ ...a, hairColor: c }))}
                />
              </div>
            </div>

            <div className="mt-auto flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onSave({
                    ...avatar,
                    seed: avatar.seed ?? createAvatarSeed(),
                  })
                }
                className="btn-primary rounded-xl px-8 py-2.5 text-base font-semibold"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SdvRow({
  label,
  value,
  idx,
  total,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Arrow dir="left" onClick={onPrev} label={`Previous ${label}`} />
      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-lg"
        style={{
          background: "white",
          border: "1.5px solid #c8c4e0",
          padding: "3px 6px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <span
          className="truncate text-center font-semibold uppercase leading-none"
          style={{ fontSize: 8, color: "#8c543e", letterSpacing: "0.08em" }}
        >
          {label}
        </span>
        <span
          className="truncate text-center font-semibold capitalize leading-tight"
          style={{ fontSize: 12, color: "#3d2408" }}
        >
          {value}
        </span>
        <span style={{ fontSize: 8, color: "#b67f5a" }}>
          {idx}/{total}
        </span>
      </div>
      <Arrow dir="right" onClick={onNext} label={`Next ${label}`} />
    </div>
  );
}

function Arrow({
  dir,
  onClick,
  label,
}: {
  dir: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 active:scale-90"
      style={{
        width: 28,
        height: 28,
        background: "linear-gradient(180deg, #7c5cbf 0%, #5a3f8f 100%)",
        border: "1.5px solid #3d2870",
        borderRadius: "7px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 5px rgba(90,63,143,0.4), inset 0 1px 0 rgba(200,180,255,0.3)",
        transition: "transform 0.08s",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        {dir === "left" ? (
          <polygon points="9,1 3,6 9,11" fill="#ede7f6" />
        ) : (
          <polygon points="3,1 9,6 3,11" fill="#ede7f6" />
        )}
      </svg>
    </button>
  );
}

function ColorSection({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: readonly string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p
        className="mb-1 font-semibold uppercase"
        style={{ fontSize: 9, color: "#5a3f8f", letterSpacing: "0.08em" }}
      >
        {label}
      </p>
      <div
        className="rounded-lg p-2"
        style={{
          background: "white",
          border: "1.5px solid #c8c4e0",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="shrink-0"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: c,
                border: value === c ? "2px solid #5a3f8f" : "1.5px solid #c8c4e0",
                outline: value === c ? "2px solid #9b82d4" : "none",
                outlineOffset: "1px",
                cursor: "pointer",
                transform: value === c ? "scale(1.3)" : "scale(1)",
                transition: "transform 0.1s",
                boxShadow: c === "#ffffff" ? "0 0 0 1px #c8c4e0" : undefined,
              }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
