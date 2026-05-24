import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import type { AvatarConfig } from "../types";
import { LORELEI_MOUTHS } from "../types";

function stripHash(hex: string) {
  return hex.replace(/^#/, "");
}

export function createAvatarSeed(): string {
  return `avatar-${Math.random().toString(36).slice(2, 11)}`;
}

function variant(n: number): string {
  return `variant${String(n).padStart(2, "0")}`;
}

/** Stable seed so editing one trait does not reshuffle face shape or accessories. */
export function avatarSeed(avatar: AvatarConfig): string {
  if (avatar.seed) return avatar.seed;
  return "hangout-hub";
}

/** Generate Lorelei trendy-portrait SVG from avatar config. */
export function generateAvatarSvg(avatar: AvatarConfig, size: number): string {
  const mouth = LORELEI_MOUTHS[avatar.mouthIndex] ?? LORELEI_MOUTHS[0];

  return createAvatar(lorelei, {
    seed: avatarSeed(avatar),
    size,
    backgroundColor: ["transparent"],
    head: ["variant01"],
    hair: [variant(avatar.hairIndex) as "variant01"],
    hairColor: [stripHash(avatar.hairColor)],
    hairAccessoriesProbability: 0,
    skinColor: [stripHash(avatar.skinTone ?? "#f5d0b5")],
    eyes: [variant(avatar.eyesIndex) as "variant01"],
    eyesColor: ["000000"],
    eyebrows: [variant(avatar.eyebrowsIndex) as "variant01"],
    mouth: [mouth],
    mouthColor: ["000000"],
    nose: ["variant01"],
    ...(avatar.glassesIndex > 0
      ? {
          glasses: [variant(avatar.glassesIndex) as "variant01"],
          glassesProbability: 100,
        }
      : { glassesProbability: 0 }),
    ...(avatar.earringsIndex > 0
      ? {
          earrings: [variant(avatar.earringsIndex) as "variant01"],
          earringsProbability: 100,
        }
      : { earringsProbability: 0 }),
    ...(avatar.freckles
      ? { freckles: ["variant01" as const], frecklesProbability: 100 }
      : { frecklesProbability: 0 }),
    beardProbability: 0,
  }).toString();
}
