import { useEffect, useState } from "react";
import { PollTool } from "./PollTool";
import { SwipeCards } from "./SwipeCards";
import { TierList } from "./TierList";
import { WheelSpinner } from "./WheelSpinner";
import { useApp } from "../../context/AppContext";
import { formatDecisionOptionsForInput, parseDecisionOptionsInput } from "../../types";

interface Props {
  roomId: string;
}

export function DecisionRoomPanel({ roomId }: Props) {
  const {
    user,
    users,
    rooms,
    decisionOptionsByRoom,
    getRoomDecisionOptions,
    setRoomDecisionOptions,
  } = useApp();

  const [decisionTitle, setDecisionTitle] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [optionsMsg, setOptionsMsg] = useState("");
  const [savingOptions, setSavingOptions] = useState(false);

  const saved = decisionOptionsByRoom[roomId];
  const savedOptions = saved?.options ?? [];
  const optionsEditor = users.find((u) => u.id === saved?.updatedBy);
  const isRoomMember = Boolean(
    user && rooms.find((r) => r.id === roomId)?.memberIds.includes(user.id)
  );
  const hasOptions = getRoomDecisionOptions(roomId).length >= 2;
  const hasTitle = decisionTitle.trim().length > 0;
  const isReady = hasTitle && hasOptions;

  useEffect(() => {
    setDecisionTitle(saved?.title ?? "");
    setOptionsText(formatDecisionOptionsForInput(savedOptions));
  }, [roomId, saved?.title, savedOptions.join("\0")]);

  const handleSaveSetup = async () => {
    setOptionsMsg("");
    const parsed = parseDecisionOptionsInput(optionsText);
    setSavingOptions(true);
    const result = await setRoomDecisionOptions(roomId, {
      title: decisionTitle,
      options: parsed,
    });
    setSavingOptions(false);
    if (result.ok) {
      setOptionsMsg("Decision setup saved — tools below are ready.");
    } else {
      setOptionsMsg(result.error ?? "Could not save setup.");
    }
    setTimeout(() => setOptionsMsg(""), 4000);
  };

  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto p-2">
      <div className="rounded-xl bg-gradient-to-r from-plum-600 to-plum-700 p-4 text-white">
        <h3 className="text-lg font-bold">Decision-making tools</h3>
        <p className="text-sm opacity-90">
          Set a title and options, then use polls, the wheel, tier list, or swipe cards to decide.
        </p>
      </div>

      <section className="card border-plum-100">
        <h4 className="font-semibold text-plum-800">Decision setup</h4>
        <p className="mt-1 text-sm text-cozy-600">
          The title describes what you&apos;re deciding. Options fill every tool below.
        </p>
        <label className="mt-3 block text-sm font-medium text-cozy-700">
          What are we deciding?
          <input
            className="input-field mt-1"
            placeholder="e.g. Where should we eat tonight?"
            value={decisionTitle}
            onChange={(e) => setDecisionTitle(e.target.value)}
            disabled={!isRoomMember}
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-cozy-700">
          Options (one per line)
          <textarea
            className="input-field mt-1 min-h-[120px] resize-y font-mono text-sm"
            placeholder={"Ramen House\nTaco Truck\nItalian Bistro\nBoard games night"}
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            disabled={!isRoomMember}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => void handleSaveSetup()}
            disabled={
              !isRoomMember || savingOptions || !decisionTitle.trim() || !optionsText.trim()
            }
          >
            {savingOptions ? "Saving…" : "Save setup"}
          </button>
          {isReady && saved && (
            <span className="text-xs text-cozy-500">
              {savedOptions.length} options
              {optionsEditor ? ` · last updated by ${optionsEditor.displayName}` : ""}
            </span>
          )}
        </div>
        {optionsMsg && <p className="mt-2 text-sm text-plum-700">{optionsMsg}</p>}
        {!isRoomMember && (
          <p className="mt-2 text-sm text-cozy-500">Only room members can edit the decision setup.</p>
        )}
        {isRoomMember && !isReady && (
          <p className="mt-2 text-sm text-amber-800">
            Add a title and at least two options, then save to unlock the tools below.
          </p>
        )}
      </section>

      {isReady && (
        <div className="rounded-xl border border-plum-200 bg-plum-50/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-600">Deciding</p>
          <p className="font-display text-lg font-semibold text-plum-900">{decisionTitle.trim()}</p>
        </div>
      )}

      <PollTool roomId={roomId} />
      <WheelSpinner roomId={roomId} />
      <TierList roomId={roomId} />
      <SwipeCards roomId={roomId} />
    </div>
  );
}
