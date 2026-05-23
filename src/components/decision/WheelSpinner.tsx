import { useState } from "react";

const SEGMENT_COLORS = [
  "#7c5cbf",
  "#e07a5f",
  "#81b29a",
  "#f4a261",
  "#3d4f5f",
  "#9b5de5",
  "#ef476f",
  "#ffd166",
];

export function WheelSpinner() {
  const [items, setItems] = useState("Movie A, Movie B, Movie C, Board games");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const options = items.split(",").map((s) => s.trim()).filter(Boolean);

  const spin = () => {
    if (options.length < 2 || spinning) return;
    setSpinning(true);
    setWinner(null);
    const idx = Math.floor(Math.random() * options.length);
    const segment = 360 / options.length;
    const extra = 360 * 5 + (options.length - idx) * segment + segment / 2;
    setRotation((r) => r + extra);
    setTimeout(() => {
      setWinner(options[idx]);
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold text-cozy-900">Decision wheel</h4>
      <p className="text-sm text-cozy-500">When the group can&apos;t decide — spin it!</p>
      <input
        className="input-field mt-2"
        value={items}
        onChange={(e) => setItems(e.target.value)}
        placeholder="Comma-separated options"
      />
      <div className="relative mx-auto my-6 flex h-48 w-48 items-center justify-center">
        <div
          className="h-full w-full rounded-full border-4 border-cozy-800 transition-transform duration-[4000ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${options
              .map(
                (_, i) =>
                  `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${(i / options.length) * 360}deg ${((i + 1) / options.length) * 360}deg`
              )
              .join(", ")})`,
          }}
        />
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-[16px] border-l-transparent border-r-transparent border-b-red-500" />
      </div>
      <button type="button" className="btn-primary w-full" onClick={spin} disabled={spinning}>
        {spinning ? "Spinning…" : "Spin the wheel"}
      </button>
      {winner && (
        <p className="mt-3 text-center text-lg font-semibold text-plum-700">
          Winner: {winner}
        </p>
      )}
    </div>
  );
}
