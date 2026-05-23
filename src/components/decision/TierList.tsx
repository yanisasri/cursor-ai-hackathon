import { useState } from "react";

const TIERS = ["S", "A", "B", "C", "D"] as const;

export function TierList() {
  const [pool, setPool] = useState(["Sushi", "Tacos", "Pizza", "Burgers", "Ramen"]);
  const [tiers, setTiers] = useState<Record<string, string[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    setPool((p) => [...p, newItem.trim()]);
    setNewItem("");
  };

  const assign = (item: string, tier: string) => {
    setPool((p) => p.filter((x) => x !== item));
    setTiers((t) => {
      const cleaned: Record<string, string[]> = {};
      for (const k of TIERS) {
        cleaned[k] = (t[k] ?? []).filter((x) => x !== item);
      }
      cleaned[tier] = [...(cleaned[tier] ?? []), item];
      return cleaned;
    });
  };

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold">Collaborative tier list</h4>
      <div className="mt-2 flex gap-2">
        <input
          className="input-field"
          placeholder="Add option"
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
