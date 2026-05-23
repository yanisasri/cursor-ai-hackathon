import { PollTool } from "./PollTool";
import { SwipeCards } from "./SwipeCards";
import { TierList } from "./TierList";
import { WheelSpinner } from "./WheelSpinner";

interface Props {
  roomId: string;
}

export function DecisionRoomPanel({ roomId }: Props) {
  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto p-2">
      <div className="rounded-xl bg-gradient-to-r from-plum-600 to-plum-700 p-4 text-white">
        <h3 className="text-lg font-bold">Decision-making tools</h3>
        <p className="text-sm opacity-90">
          Our standout features: polls, wheel spinner, tier lists & swipe cards — built to end
          group chat paralysis.
        </p>
      </div>
      <PollTool roomId={roomId} />
      <WheelSpinner />
      <TierList />
      <SwipeCards />
    </div>
  );
}
