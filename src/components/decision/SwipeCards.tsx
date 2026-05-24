import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

interface Props {
  roomId: string;
}

export function SwipeCards({ roomId }: Props) {
  const { user, users, getRoomDecisionOptions, getRoomDecisionTitle, notifyRoomDecision } =
    useApp();
  const roomOptions = getRoomDecisionOptions(roomId);
  const decisionTitle = getRoomDecisionTitle(roomId);
  const [deck, setDeck] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const sessionStarted = useRef(false);

  const isReady = decisionTitle.length > 0 && roomOptions.length >= 2;
  const actorName = users.find((u) => u.id === user?.id)?.displayName ?? "Someone";

  useEffect(() => {
    setDeck(roomOptions);
    setLiked([]);
    setPassed([]);
    setIndex(0);
    sessionStarted.current = false;
  }, [roomOptions.join("\0")]);

  const current = deck[index];

  const swipe = (yes: boolean) => {
    if (!current || !user) return;
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      notifyRoomDecision(
        roomId,
        "Swipe started",
        `${actorName} started swiping on "${decisionTitle}"`
      );
    }
    const nextLiked = yes ? [...liked, current] : liked;
    const nextPassed = yes ? passed : [...passed, current];
    const nextIndex = index + 1;
    if (yes) setLiked(nextLiked);
    else setPassed(nextPassed);
    setIndex(nextIndex);
    if (nextIndex >= deck.length) {
      notifyRoomDecision(
        roomId,
        "Swipe completed",
        `${actorName} finished swiping on "${decisionTitle}". Favorites: ${
          nextLiked.length > 0 ? nextLiked.join(", ") : "none"
        }`
      );
    }
  };

  const reset = () => {
    setDeck([...liked, ...passed, ...deck.slice(index)]);
    setLiked([]);
    setPassed([]);
    setIndex(0);
    sessionStarted.current = false;
  };

  if (!isReady) {
    return (
      <div className="rounded-xl border border-cozy-200 bg-cozy-50 p-4 text-sm text-cozy-600">
        Save a decision title and options above to start swiping.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cozy-200 p-4">
      <h4 className="font-semibold">Swipe to choose</h4>
      <p className="text-sm text-cozy-500">{decisionTitle}</p>

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
            <p className="mt-2 text-sm text-plum-700">Group favorites: {liked.join(", ")}</p>
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
