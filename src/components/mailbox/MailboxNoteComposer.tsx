import { useMemo, useState } from "react";
import {
  countMailboxWords,
  MAILBOX_ENVELOPE_COLORS,
  MAILBOX_MAX_WORDS,
  MAILBOX_PAPER_COLORS,
  MAILBOX_STICKERS,
} from "../../types";

export interface MailboxComposePayload {
  body: string;
  paperColor: string;
  envelopeColor: string;
  stickers: string[];
}

interface Props {
  recipientName: string;
  onSend: (payload: MailboxComposePayload) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
  replyToNoteId?: string | null;
}

export function MailboxNoteComposer({
  recipientName,
  onSend,
  onCancel,
  replyToNoteId,
}: Props) {
  const [body, setBody] = useState("");
  const [paperColor, setPaperColor] = useState<string>(MAILBOX_PAPER_COLORS[0].value);
  const [envelopeColor, setEnvelopeColor] = useState<string>(MAILBOX_ENVELOPE_COLORS[0].value);
  const [stickers, setStickers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = useMemo(() => countMailboxWords(body), [body]);
  const overLimit = words > MAILBOX_MAX_WORDS;

  const toggleSticker = (sticker: string) => {
    setStickers((prev) =>
      prev.includes(sticker) ? prev.filter((s) => s !== sticker) : [...prev, sticker].slice(0, 5)
    );
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    const result = await onSend({ body, paperColor, envelopeColor, stickers });
    setSending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send note.");
      return;
    }
    onCancel();
  };

  return (
    <div className="rounded-xl border-2 border-plum-200 bg-white p-4 shadow-sm">
      <h4 className="font-semibold text-cozy-900">
        {replyToNoteId
          ? `Reply to ${recipientName}`
          : `Leave a note in ${recipientName}'s mailbox`}
      </h4>
      <p className="mt-1 text-xs text-cozy-500">Max {MAILBOX_MAX_WORDS} words · decorate your letter</p>

      <div
        className="mt-3 rounded-lg border-2 p-3"
        style={{ backgroundColor: paperColor, borderColor: envelopeColor }}
      >
        {stickers.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 text-xl">
            {stickers.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Write your note…"
          className="w-full resize-none bg-transparent text-sm text-cozy-900 outline-none placeholder:text-cozy-400"
        />
      </div>

      <p className={`mt-1 text-xs ${overLimit ? "text-red-600" : "text-cozy-500"}`}>
        {words}/{MAILBOX_MAX_WORDS} words
      </p>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase text-cozy-500">Paper</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {MAILBOX_PAPER_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              onClick={() => setPaperColor(c.value)}
              className={`h-7 w-7 rounded-full border-2 ${
                paperColor === c.value ? "border-plum-600 ring-2 ring-plum-300" : "border-cozy-300"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase text-cozy-500">Envelope</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {MAILBOX_ENVELOPE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.label}
              onClick={() => setEnvelopeColor(c.value)}
              className={`h-7 w-7 rounded-md border-2 ${
                envelopeColor === c.value ? "border-plum-600 ring-2 ring-plum-300" : "border-cozy-300"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase text-cozy-500">Stickers</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {MAILBOX_STICKERS.map((sticker) => (
            <button
              key={sticker}
              type="button"
              onClick={() => toggleSticker(sticker)}
              className={`rounded-lg px-2 py-1 text-lg ${
                stickers.includes(sticker) ? "bg-plum-100 ring-2 ring-plum-400" : "bg-cozy-100"
              }`}
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={onCancel} disabled={sending}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary text-sm"
          disabled={sending || overLimit || words === 0}
          onClick={() => void handleSend()}
        >
          {sending ? "Sending…" : "Send to mailbox"}
        </button>
      </div>
    </div>
  );
}
