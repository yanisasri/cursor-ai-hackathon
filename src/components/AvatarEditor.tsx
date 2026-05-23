import { useState } from "react";
import type { AvatarConfig } from "../types";
import { AvatarPreview } from "./AvatarPreview";

const HAIRSTYLES = ["short", "medium", "long", "curly", "bun"] as const;
const SHIRTS = ["tee", "hoodie", "sweater"] as const;
const BOTTOMS = ["pants", "skirt"] as const;
const SHOES = ["sneakers", "boots", "sandals"] as const;
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
];

interface Props {
  initial: AvatarConfig;
  onSave: (avatar: AvatarConfig) => void;
  submitLabel?: string;
}

export function AvatarEditor({ initial, onSave, submitLabel = "Save Avatar" }: Props) {
  const [avatar, setAvatar] = useState<AvatarConfig>(initial);

  const patch = (partial: Partial<AvatarConfig>) =>
    setAvatar((a) => ({ ...a, ...partial }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card flex flex-col items-center justify-center bg-cozy-100">
        <AvatarPreview avatar={avatar} size="lg" />
        <p className="mt-4 text-sm text-cozy-600">Live preview</p>
      </div>

      <div className="space-y-5">
        <Field label="Hairstyle">
          <div className="flex flex-wrap gap-2">
            {HAIRSTYLES.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => patch({ hairstyle: h })}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                  avatar.hairstyle === h
                    ? "bg-plum-600 text-white"
                    : "bg-cozy-200 text-cozy-800 hover:bg-cozy-300"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Hair color">
          <ColorRow value={avatar.hairColor} onChange={(hairColor) => patch({ hairColor })} />
        </Field>

        <Field label="Shirt style">
          <div className="flex flex-wrap gap-2">
            {SHIRTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ shirtStyle: s })}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                  avatar.shirtStyle === s
                    ? "bg-plum-600 text-white"
                    : "bg-cozy-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Shirt color">
          <ColorRow value={avatar.shirtColor} onChange={(shirtColor) => patch({ shirtColor })} />
        </Field>

        <Field label="Bottom">
          <div className="flex gap-2">
            {BOTTOMS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => patch({ bottomStyle: b })}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                  avatar.bottomStyle === b ? "bg-plum-600 text-white" : "bg-cozy-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <ColorRow
            value={avatar.bottomColor}
            onChange={(bottomColor) => patch({ bottomColor })}
          />
        </Field>

        <Field label="Shoes">
          <div className="flex flex-wrap gap-2">
            {SHOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ shoes: s })}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                  avatar.shoes === s ? "bg-plum-600 text-white" : "bg-cozy-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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
            value === c ? "border-plum-700 scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}
