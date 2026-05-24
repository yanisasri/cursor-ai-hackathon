import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";

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

interface Props {
  roomId: string;
}

export function WheelSpinner({ roomId }: Props) {
  const { user, users, getRoomDecisionOptions, getRoomDecisionTitle, notifyRoomDecision } =
    useApp();
  const roomOptions = getRoomDecisionOptions(roomId);
  const decisionTitle = getRoomDecisionTitle(roomId);
  const [items, setItems] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const isReady = decisionTitle.length > 0 && roomOptions.length >= 2;
  const actorName = users.find((u) => u.id === user?.id)?.displayName ?? "Someone";

  useEffect(() => {
    if (roomOptions.length > 0) {
      setItems(roomOptions.join(", "));
    } else {
      setItems("");
    }
  }, [roomOptions.join("\0")]);

  const options = items.split(",").map((s) => s.trim()).filter(Boolean);

  const spin = () => {
    if (options.length < 2 || spinning || !user) return;
    setSpinning(true);
    setWinner(null);
    notifyRoomDecision(
      roomId,
      "Wheel spinning",
      `${actorName} spun the wheel for "${decisionTitle}"`
    );
    const idx = Math.floor(Math.random() * options.length);
    const segment = 360 / options.length;
    const extra = 360 * 5 + (options.length - idx) * segment + segment / 2;
    setRotation((r) => r + extra);
    const picked = options[idx];
    setTimeout(() => {
      setWinner(picked);
      setSpinning(false);
      notifyRoomDecision(
        roomId,
        "Wheel result",
        `The wheel landed on "${picked}" for "${decisionTitle}"`
      );
    }, 4000);
  };

  if (!isReady) {
    return (
      <div className="rounded-xl border border-cozy-200 bg-cozy-50 p-4 text-sm text-cozy-600">
        Save a decision title and options above to spin the wheel.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold text-cozy-900">Decision wheel</h4>
      <p className="text-sm text-cozy-500">{decisionTitle}</p>
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
        <p className="mt-3 text-center text-lg font-semibold text-plum-700">Winner: {winner}</p>
      )}
    </div>
  );
}
