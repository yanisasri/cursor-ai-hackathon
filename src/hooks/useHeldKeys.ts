import { useEffect, useRef } from "react";

const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

export function useHeldKeys(enabled = true) {
  const held = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(key)) return;
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        !!target?.closest("[contenteditable='true']");
      if (isTypingTarget) return;
      e.preventDefault();
      held.current.add(key);
    };

    const onUp = (e: KeyboardEvent) => {
      held.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => held.current.clear();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  return held;
}

export function getVelocityFromHeldKeys(
  held: Set<string>,
  speed: number
): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (held.has("w") || held.has("arrowup")) dy -= speed;
  if (held.has("s") || held.has("arrowdown")) dy += speed;
  if (held.has("a") || held.has("arrowleft")) dx -= speed;
  if (held.has("d") || held.has("arrowright")) dx += speed;
  const len = Math.hypot(dx, dy);
  if (len > speed && len > 0) {
    dx = (dx / len) * speed;
    dy = (dy / len) * speed;
  }
  return { dx, dy };
}
