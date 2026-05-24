import type { MailboxNote } from "../../types";

interface Props {
  note: MailboxNote;
  fromName: string;
  compact?: boolean;
}

export function MailboxNoteCard({ note, fromName, compact }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 shadow-sm ${
        compact ? "p-3" : "p-4"
      }`}
      style={{
        backgroundColor: note.paperColor,
        borderColor: note.envelopeColor,
      }}
    >
      <div
        className="absolute right-3 top-0 h-8 w-12 rounded-b-md shadow-sm"
        style={{ backgroundColor: note.envelopeColor }}
      />
      {note.stickers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 text-lg">
          {note.stickers.map((sticker, i) => (
            <span key={`${sticker}-${i}`}>{sticker}</span>
          ))}
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wide text-cozy-600">
        From {fromName}
      </p>
      <p className={`mt-2 whitespace-pre-wrap text-cozy-900 ${compact ? "text-sm" : "text-base"}`}>
        {note.body}
      </p>
      <p className="mt-2 text-[10px] text-cozy-500">
        {new Date(note.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
