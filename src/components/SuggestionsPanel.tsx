import { useState } from "react";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["restaurant", "activity", "movie", "game", "other"] as const;

export function SuggestionsPanel({ roomId }: { roomId: string }) {
  const { suggestions, user, users, addSuggestion, likeSuggestion } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("restaurant");

  const roomItems = suggestions.filter((s) => s.roomId === roomId);

  return (
    <div className="max-h-[70vh] overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Suggestions board</h3>
      <p className="text-sm text-cozy-600">
        Add restaurants, activities, movies, and games you want to try together.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="input-field flex-1"
          placeholder="e.g. New ramen spot downtown"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="input-field sm:w-36"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as (typeof CATEGORIES)[number])
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (!title.trim()) return;
            addSuggestion(roomId, title.trim(), category);
            setTitle("");
          }}
        >
          Add
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {roomItems.length === 0 ? (
          <li className="text-sm text-cozy-500">No suggestions yet — be the first!</li>
        ) : (
          roomItems.map((s) => {
            const author = users.find((u) => u.id === s.addedBy);
            const liked = user && s.likes.includes(user.id);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-cozy-200 p-3"
              >
                <div>
                  <span className="text-xs uppercase text-plum-600">{s.category}</span>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-cozy-500">by {author?.displayName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => likeSuggestion(s.id)}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    liked ? "bg-plum-100 text-plum-700" : "bg-cozy-100"
                  }`}
                >
                  ♥ {s.likes.length}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
