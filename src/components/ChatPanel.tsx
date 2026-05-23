import { useEffect, useRef, useState } from "react";
import { generateId, getMessages, saveMessages } from "../lib/storage";
import { useApp } from "../context/AppContext";
import type { RoomMessage } from "../types";

interface Props {
  roomId: string;
}

export function ChatPanel({ roomId }: Props) {
  const { user } = useApp();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState("");
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      setMessages(getMessages().filter((m) => m.roomId === roomId));
    };
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, [roomId]);

  useEffect(() => {
    if (stickToBottom) {
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, stickToBottom]);

  const send = () => {
    if (!user || !text.trim()) return;
    const msg: RoomMessage = {
      id: generateId(),
      roomId,
      userId: user.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    saveMessages([...getMessages(), msg]);
    setMessages((m) => [...m, msg]);
    setText("");
  };

  return (
    <div className="flex h-48 flex-col rounded-xl border border-cozy-200 bg-white/95">
      <p className="border-b border-cozy-100 px-3 py-2 text-xs font-semibold text-cozy-600">
        Message chat
      </p>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 text-sm"
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          setStickToBottom(nearBottom);
        }}
      >
        {messages.length === 0 && (
          <p className="text-cozy-400">Say hi to the room…</p>
        )}
        {messages.map((m) => (
          <p key={m.id} className="mb-1">
            <span className="font-medium text-plum-700">
              {m.userId === user?.id ? "You" : "Friend"}:
            </span>{" "}
            {m.text}
          </p>
        ))}
      </div>
      <div className="flex gap-2 border-t border-cozy-100 p-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="btn-primary px-3 text-sm" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
