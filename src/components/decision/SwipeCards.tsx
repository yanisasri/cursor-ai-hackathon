import { useState } from "react";

export function SwipeCards() {
  const [deck, setDeck] = useState([
    "Italian Bistro",
    "Ramen House",
    "Taco Truck",
    "Vegan Café",
    "BBQ Joint",
  ]);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const current = deck[index];

  const swipe = (yes: boolean) => {
    if (!current) return;
    if (yes) setLiked((l) => [...l, current]);
    else setPassed((p) => [...p, current]);
    setIndex((i) => i + 1);
  };

  const reset = () => {
    setDeck([...liked, ...passed, ...deck.slice(index)]);
    setLiked([]);
    setPassed([]);
    setIndex(0);
  };

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold">Swipe to choose</h4>
      <p className="text-sm text-cozy-500">Tinder-style picks for restaurants & activities</p>

      {current ? (
        <div className="relative mx-auto mt-4 flex h-48 w-full max-w-xs flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-plum-100 to-cozy-200 p-6 shadow-lg">
          <p className="text-center text-xl font-semibold">{current}</p>
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => swipe(false)}
              className="rounded-full bg-white px-6 py-2 text-red-500 shadow"
            >
              Pass
            </button>
            <button
              type="button"
              onClick={() => swipe(true)}
              className="rounded-full bg-plum-600 px-6 py-2 text-white shadow"
            >
              Like
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="font-medium">Done swiping!</p>
          {liked.length > 0 && (
            <p className="mt-2 text-sm text-plum-700">
              Group favorites: {liked.join(", ")}
            </p>
          )}
          <button type="button" className="btn-secondary mt-3" onClick={reset}>
            Reset deck
          </button>
        </div>
      )}

      {liked.length > 0 && current && (
        <p className="mt-2 text-xs text-cozy-500">Liked so far: {liked.join(", ")}</p>
      )}
    </div>
  );
}
