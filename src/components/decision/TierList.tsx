import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

const TIERS = ["S", "A", "B", "C", "D"] as const;

interface Props {
  roomId: string;
}

export function TierList({ roomId }: Props) {
  const { user, users, getRoomDecisionOptions, getRoomDecisionTitle, notifyRoomDecision } =
    useApp();
  const roomOptions = getRoomDecisionOptions(roomId);
  const decisionTitle = getRoomDecisionTitle(roomId);
  const [pool, setPool] = useState<string[]>([]);
  const [tiers, setTiers] = useState<Record<string, string[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  const [newItem, setNewItem] = useState("");
  const sessionStarted = useRef(false);

  const isReady = decisionTitle.length > 0 && roomOptions.length >= 2;
  const actorName = users.find((u) => u.id === user?.id)?.displayName ?? "Someone";

  useEffect(() => {
    setPool(roomOptions);
    setTiers({ S: [], A: [], B: [], C: [], D: [] });
    sessionStarted.current = false;
  }, [roomOptions.join("\0")]);

  const addItem = () => {
    if (!newItem.trim()) return;
    setPool((p) => [...p, newItem.trim()]);
    setNewItem("");
  };

  const assign = (item: string, tier: string) => {
    if (!user) return;
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      notifyRoomDecision(
        roomId,
        "Tier list started",
        `${actorName} started ranking options for "${decisionTitle}"`
      );
    }
    const nextPool = pool.filter((x) => x !== item);
    const cleaned: Record<string, string[]> = {};
    for (const k of TIERS) {
      cleaned[k] = (tiers[k] ?? []).filter((x) => x !== item);
    }
    cleaned[tier] = [...(cleaned[tier] ?? []), item];
    setPool(nextPool);
    setTiers(cleaned);
    if (nextPool.length === 0) {
      const summary = TIERS.map((tKey) => {
        const items = cleaned[tKey] ?? [];
        return items.length > 0 ? `${tKey}: ${items.join(", ")}` : null;
      })
        .filter(Boolean)
        .join(" · ");
      notifyRoomDecision(
        roomId,
        "Tier list completed",
        `${actorName} finished ranking "${decisionTitle}". ${summary}`
      );
    }
  };

  if (!isReady) {
    return (
      <div className="rounded-xl border border-cozy-200 bg-cozy-50 p-4 text-sm text-cozy-600">
        Save a decision title and options above to build a tier list.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold">Collaborative tier list</h4>
      <p className="text-sm text-cozy-500">{decisionTitle}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="input-field"
          placeholder="Add extra option"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="button" className="btn-secondary" onClick={addItem}>
          Add
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pool.map((item) => (
          <span
            key={item}
            className="rounded-lg bg-cozy-200 px-2 py-1 text-sm"
            title="Click a tier to assign"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-1">
        {TIERS.map((tier) => (
          <div key={tier} className="flex min-h-10 items-center gap-2 rounded-lg bg-cozy-100 p-1">
            <span className="w-8 shrink-0 text-center font-bold text-plum-700">{tier}</span>
            <div className="flex flex-wrap gap-1">
              {(tiers[tier] ?? []).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded bg-white px-2 py-0.5 text-xs shadow-sm"
                  onClick={() => setPool((p) => [...p, item])}
                >
                  {item} ×
                </button>
              ))}
              {pool.map((item) => (
                <button
                  key={`${tier}-${item}`}
                  type="button"
                  className="rounded border border-dashed border-cozy-300 px-2 py-0.5 text-xs opacity-60 hover:opacity-100"
                  onClick={() => assign(item, tier)}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
