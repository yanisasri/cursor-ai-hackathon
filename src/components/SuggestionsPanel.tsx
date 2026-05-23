import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { SUGGESTION_CATEGORIES, type SuggestionCategory } from "../types";

type Tab = "board" | "weekly" | "archive";

export function SuggestionsPanel({ roomId }: { roomId: string }) {
  const {
    suggestions,
    user,
    users,
    addSuggestion,
    deleteSuggestion,
    likeSuggestion,
    getWeeklyTopSuggestions,
    getArchivedSuggestions,
  } = useApp();

  const [tab, setTab] = useState<Tab>("board");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState<SuggestionCategory>("restaurant");
  const [imagePreview, setImagePreview] = useState<string | undefined>();

  const active = useMemo(
    () =>
      suggestions
        .filter((s) => s.roomId === roomId && !s.archived)
        .sort((a, b) => b.likes.length - a.likes.length),
    [suggestions, roomId]
  );

  const weekly = getWeeklyTopSuggestions(roomId);
  const archived = getArchivedSuggestions(roomId);

  const byCategory = useMemo(() => {
    const map = new Map<SuggestionCategory, typeof active>();
    for (const cat of SUGGESTION_CATEGORIES) {
      map.set(
        cat.id,
        active.filter((s) => s.category === cat.id)
      );
    }
    return map;
  }, [active]);

  const handleImage = (file: File | null) => {
    if (!file) {
      setImagePreview(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!title.trim()) return;
    const fullTitle = description.trim()
      ? `${title.trim()} — ${description.trim()}`
      : title.trim();
    addSuggestion({
      roomId,
      title: fullTitle,
      category,
      link: link.trim() || undefined,
      imageUrl: imagePreview,
    });
    setTitle("");
    setDescription("");
    setLink("");
    setImagePreview(undefined);
  };

  const renderCard = (s: (typeof active)[0], showDelete = true) => {
    const author = users.find((u) => u.id === s.addedBy);
    const liked = user && s.likes.includes(user.id);
    const isAuthor = user?.id === s.addedBy;

    return (
      <div
        key={s.id}
        className="rounded-xl border border-cozy-200 bg-white p-4 shadow-sm"
      >
        {s.imageUrl && (
          <img
            src={s.imageUrl}
            alt=""
            className="mb-3 h-32 w-full rounded-lg object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase text-plum-600">
              {SUGGESTION_CATEGORIES.find((c) => c.id === s.category)?.emoji}{" "}
              {s.category}
            </span>
            <p className="mt-1 text-base font-semibold leading-snug text-cozy-900">
              {s.title}
            </p>
            <p className="mt-1 text-sm text-cozy-500">by {author?.displayName}</p>
            {s.link && (
              <a
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-plum-600 underline"
              >
                View resource →
              </a>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => likeSuggestion(s.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                liked ? "bg-plum-600 text-white" : "bg-cozy-100"
              }`}
            >
              ♥ {s.likes.length}
            </button>
            {showDelete && isAuthor && (
              <button
                type="button"
                onClick={() => deleteSuggestion(s.id)}
                className="rounded-lg px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Suggestions board</h3>
      <p className="text-sm text-cozy-600">
        Share ideas with photos & links — most liked rise to the top.
      </p>

      <div className="mt-3 flex gap-2">
        {(
          [
            ["board", "Board"],
            ["weekly", "Weekly top"],
            ["archive", "Archive"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === id ? "bg-plum-600 text-white" : "bg-cozy-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "board" && (
        <>
          <div className="card mt-4 space-y-4">
            <input
              className="input-field text-base"
              placeholder="Title — e.g. Ramen spot downtown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input-field min-h-[100px] resize-y text-base leading-relaxed"
              placeholder="Details (optional) — why you want to go, when, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Link (optional) — menu, tickets, map…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="input-field w-full sm:w-40"
                value={category}
                onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
              >
                {SUGGESTION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <label className="cursor-pointer rounded-lg border border-cozy-300 px-4 py-2 text-sm hover:bg-cozy-50">
                📷 Add photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <button type="button" className="btn-primary" onClick={submit}>
                Post suggestion
              </button>
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-24 rounded-lg object-cover"
              />
            )}
          </div>

          {SUGGESTION_CATEGORIES.map((cat) => {
            const items = byCategory.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="mt-6">
                <h4 className="mb-3 font-semibold text-cozy-800">
                  {cat.emoji} {cat.label}
                </h4>
                <div className="space-y-3">{items.map((s) => renderCard(s))}</div>
              </section>
            );
          })}

          {active.length === 0 && (
            <p className="mt-6 text-center text-sm text-cozy-500">
              No suggestions yet — add the first one above!
            </p>
          )}
        </>
      )}

      {tab === "weekly" && (
        <div className="mt-4">
          <div className="rounded-xl bg-gradient-to-r from-plum-600 to-plum-700 p-4 text-white">
            <h4 className="font-bold">This week&apos;s favorites</h4>
            <p className="text-sm opacity-90">
              Top liked suggestions from the past 7 days
            </p>
          </div>
          <ul className="mt-4 space-y-3">
            {weekly.length === 0 ? (
              <li className="text-sm text-cozy-500">No likes this week yet.</li>
            ) : (
              weekly.map((s, i) => (
                <li key={s.id} className="flex items-start gap-3">
                  <span className="shrink-0 text-2xl font-bold text-plum-400">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">{renderCard(s, false)}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {tab === "archive" && (
        <div className="mt-4">
          <p className="text-sm text-cozy-600">
            Suggestions with no likes for 3+ weeks are archived here.
          </p>
          <ul className="mt-4 space-y-3">
            {archived.length === 0 ? (
              <li className="text-sm text-cozy-500">Archive is empty.</li>
            ) : (
              archived.map((s) => renderCard(s, false))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
