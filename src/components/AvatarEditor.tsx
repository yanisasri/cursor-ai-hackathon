import { useState } from "react";
import type { AvatarConfig } from "../types";
import { AvatarPreview } from "./AvatarPreview";

const HAIRSTYLES = [
  "short",
  "medium",
  "long",
  "curly",
  "bun",
  "ponytail",
  "bangs",
] as const;
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

  const patch = (partial: Partial<AvatarConfig>) =>
    setAvatar((a) => ({ ...a, ...partial }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card flex flex-col items-center justify-center bg-gradient-to-b from-cozy-100 to-plum-50">
        <AvatarPreview avatar={avatar} size="lg" />
        <p className="mt-4 text-sm text-cozy-600">Live preview</p>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <Field label="Skin tone">
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ skinTone: c })}
                className={`h-9 w-9 rounded-full border-2 ${
                  avatar.skinTone === c ? "border-plum-700 scale-110" : "border-cozy-300"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>

        <Field label="Hairstyle">
          <OptionRow
            options={HAIRSTYLES}
            value={avatar.hairstyle}
            onChange={(hairstyle) => patch({ hairstyle })}
          />
        </Field>

        <Field label="Hair color">
          <ColorRow value={avatar.hairColor} onChange={(hairColor) => patch({ hairColor })} />
        </Field>

        <Field label="Top">
          <OptionRow
            options={SHIRTS}
            value={avatar.shirtStyle}
            onChange={(shirtStyle) => patch({ shirtStyle })}
          />
          <ColorRow value={avatar.shirtColor} onChange={(shirtColor) => patch({ shirtColor })} />
        </Field>

        <Field label="Bottom">
          <OptionRow
            options={BOTTOMS}
            value={avatar.bottomStyle}
            onChange={(bottomStyle) => patch({ bottomStyle })}
          />
          <ColorRow
            value={avatar.bottomColor}
            onChange={(bottomColor) => patch({ bottomColor })}
          />
        </Field>

        <Field label="Shoes">
          <OptionRow
            options={SHOES}
            value={avatar.shoes}
            onChange={(shoes) => patch({ shoes })}
          />
        </Field>

        <Field label="Accessory">
          <OptionRow
            options={ACCESSORIES}
            value={avatar.accessory}
            onChange={(accessory) => patch({ accessory })}
          />
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

function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
            value === o ? "bg-plum-600 text-white" : "bg-cozy-200 text-cozy-800 hover:bg-cozy-300"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ColorRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {COLORS.map((c) => (
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
