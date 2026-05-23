import { useState } from "react";
import { useApp } from "../../context/AppContext";

interface Props {
  roomId: string;
}

export function PollTool({ roomId }: Props) {
  const { polls, user, createPoll, votePoll } = useApp();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("Pizza, Sushi, Tacos");

  const roomPolls = polls.filter((p) => p.roomId === roomId);

  const handleCreate = () => {
    if (!question.trim()) return;
    const opts = options.split(",").map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return;
    createPoll(roomId, question, opts);
    setQuestion("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-plum-200 bg-plum-50/50 p-4">
        <h4 className="font-semibold text-plum-800">Real-time poll</h4>
        <input
          className="input-field mt-2"
          placeholder="What should we eat?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <input
          className="input-field mt-2"
          placeholder="Options (comma separated)"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
        />
        <button type="button" className="btn-primary mt-2" onClick={handleCreate}>
          Start poll
        </button>
      </div>

      {roomPolls.map((poll) => (
        <div key={poll.id} className="rounded-xl border border-cozy-200 p-4">
          <p className="font-medium">{poll.question}</p>
          <ul className="mt-2 space-y-2">
            {poll.options.map((opt) => {
              const voted = user && opt.votes.includes(user.id);
              const total = poll.options.reduce((s, o) => s + o.votes.length, 0);
              const pct = total ? Math.round((opt.votes.length / total) * 100) : 0;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => votePoll(poll.id, opt.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      voted ? "border-plum-500 bg-plum-50" : "border-cozy-200 hover:bg-cozy-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{opt.text}</span>
                      <span>{opt.votes.length} votes ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cozy-200">
                      <div
                        className="h-full bg-plum-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
