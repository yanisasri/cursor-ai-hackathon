import { useState } from "react";
import type { AvatarConfig } from "../types";
import { AvatarPreview } from "./AvatarPreview";

const HAIRSTYLES = ["short", "medium", "long", "curly", "bun", "ponytail", "bangs"] as const;
const SHIRTS = ["tee", "hoodie", "sweater", "jacket", "polo", "tank", "blazer"] as const;
const BOTTOMS = ["pants", "skirt", "shorts", "dress"] as const;
const SHOES = ["sneakers", "boots", "sandals", "heels", "loafers"] as const;
const ACCESSORIES = ["none", "glasses", "hat", "headphones"] as const;
const SKIN_TONES = ["#f5d0b5", "#e8c4a8", "#d4a574", "#c68642", "#8d5524", "#ffdbac"];
const COLORS = [
  "#7c5cbf",
  "#e07a5f",
  "#81b29a",
  "#f4a261",
  "#3d4f5f",
  "#9b5de5",
  "#ef476f",
  "#ffd166",
  "#118ab2",
  "#1a1a2e",
  "#ffffff",
  "#2d6a4f",
];

interface Props {
  initial: AvatarConfig;
  onSave: (avatar: AvatarConfig) => void;
  submitLabel?: string;
}

export function AvatarEditor({ initial, onSave, submitLabel = "Save Avatar" }: Props) {
  const [avatar, setAvatar] = useState<AvatarConfig>({
    ...initial,
    accessory: initial.accessory ?? "none",
    skinTone: initial.skinTone ?? "#f5d0b5",
  });

  const cycle = <T extends string,>(
    options: readonly T[],
    key: keyof AvatarConfig,
    direction: "prev" | "next"
  ) => {
    setAvatar((a) => {
      const current = String(a[key]) as T;
      const idx = Math.max(0, options.indexOf(current));
      const nextIdx =
        direction === "next"
          ? (idx + 1) % options.length
          : (idx - 1 + options.length) % options.length;
      return { ...a, [key]: options[nextIdx] };
    });
  };

  const setColor = (key: "hairColor" | "shirtColor" | "bottomColor", value: string) =>
    setAvatar((a) => ({ ...a, [key]: value }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card flex flex-col items-center justify-center bg-gradient-to-b from-cozy-100 to-plum-50">
        <div className="flex w-full items-center justify-center gap-3">
          <ArrowButton
            direction="left"
            onClick={() => cycle(HAIRSTYLES, "hairstyle", "prev")}
            label="Previous hairstyle"
          />
          <AvatarPreview avatar={avatar} size="lg" />
          <ArrowButton
            direction="right"
            onClick={() => cycle(HAIRSTYLES, "hairstyle", "next")}
            label="Next hairstyle"
          />
        </div>
        <p className="mt-4 text-sm text-cozy-600">
          Use arrows to switch styles quickly
        </p>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <ArrowRow
          label="Hairstyle"
          value={avatar.hairstyle}
          onPrev={() => cycle(HAIRSTYLES, "hairstyle", "prev")}
          onNext={() => cycle(HAIRSTYLES, "hairstyle", "next")}
        />
        <ArrowRow
          label="Top"
          value={avatar.shirtStyle}
          onPrev={() => cycle(SHIRTS, "shirtStyle", "prev")}
          onNext={() => cycle(SHIRTS, "shirtStyle", "next")}
        />
        <ArrowRow
          label="Bottom"
          value={avatar.bottomStyle}
          onPrev={() => cycle(BOTTOMS, "bottomStyle", "prev")}
          onNext={() => cycle(BOTTOMS, "bottomStyle", "next")}
        />
        <ArrowRow
          label="Shoes"
          value={avatar.shoes}
          onPrev={() => cycle(SHOES, "shoes", "prev")}
          onNext={() => cycle(SHOES, "shoes", "next")}
        />
        <ArrowRow
          label="Accessory"
          value={avatar.accessory}
          onPrev={() => cycle(ACCESSORIES, "accessory", "prev")}
          onNext={() => cycle(ACCESSORIES, "accessory", "next")}
        />

        <Field label="Skin tone">
          <ColorRow
            colors={SKIN_TONES}
            value={avatar.skinTone}
            onChange={(c) => setAvatar((a) => ({ ...a, skinTone: c }))}
          />
        </Field>
        <Field label="Hair color">
          <ColorRow colors={COLORS} value={avatar.hairColor} onChange={(c) => setColor("hairColor", c)} />
        </Field>
        <Field label="Top color">
          <ColorRow colors={COLORS} value={avatar.shirtColor} onChange={(c) => setColor("shirtColor", c)} />
        </Field>
        <Field label="Bottom color">
          <ColorRow colors={COLORS} value={avatar.bottomColor} onChange={(c) => setColor("bottomColor", c)} />
        </Field>

        <button type="button" className="btn-primary w-full" onClick={() => onSave(avatar)}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-cozy-700">{label}</p>
      {children}
    </div>
  );
}

function ArrowRow({
  label,
  value,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="rounded-xl border border-cozy-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-cozy-500">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <ArrowButton direction="left" onClick={onPrev} label={`Previous ${label}`} />
        <span className="rounded-lg bg-cozy-100 px-3 py-1 text-sm font-semibold capitalize text-cozy-800">
          {value}
        </span>
        <ArrowButton direction="right" onClick={onNext} label={`Next ${label}`} />
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-full border border-cozy-300 bg-white px-3 py-2 text-sm font-bold text-cozy-700 hover:bg-cozy-100"
    >
      {direction === "left" ? "◀" : "▶"}
    </button>
  );
}

function ColorRow({
  colors,
  value,
  onChange,
}: {
  colors: readonly string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-8 w-8 rounded-full border-2 transition ${
            value === c ? "border-plum-700 scale-110" : "border-cozy-300"
          }`}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}
