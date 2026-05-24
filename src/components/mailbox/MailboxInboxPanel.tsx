import { useState } from "react";
import { useApp } from "../../context/AppContext";
import type { MailboxNote } from "../../types";
import { MailboxNoteCard } from "./MailboxNoteCard";
import { MailboxNoteComposer, type MailboxComposePayload } from "./MailboxNoteComposer";

interface Props {
  roomId: string;
  ownerId: string;
}

export function MailboxInboxPanel({ roomId, ownerId }: Props) {
  const {
    user,
    users,
    mailboxNotes,
    getRoomDisplayName,
    markMailboxNoteRead,
    sendMailboxNote,
  } = useApp();
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MailboxNote | null>(null);

  if (!user) return null;

  const notes = mailboxNotes
    .filter((n) => n.roomId === roomId && n.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unread = notes.filter((n) => !n.read);
  const history = notes.filter((n) => n.read);

  const nameFor = (userId: string) =>
    getRoomDisplayName(roomId, userId) ||
    users.find((u) => u.id === userId)?.displayName ||
    "Friend";

  const openNote = (note: MailboxNote) => {
    setOpenNoteId(note.id);
    if (!note.read) markMailboxNoteRead(note.id);
  };

  const handleSend = async (payload: MailboxComposePayload) => {
    if (!replyTo) return { ok: false, error: "No reply target." };
    return sendMailboxNote({
      roomId,
      ownerId: replyTo.fromUserId,
      body: payload.body,
      paperColor: payload.paperColor,
      envelopeColor: payload.envelopeColor,
      stickers: payload.stickers,
      inReplyToId: replyTo.id,
    });
  };

  return (
    <div className="space-y-3 border-t border-cozy-100 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-cozy-900">Your mailbox (inbox)</h4>
        {unread.length > 0 && (
          <span className="rounded-full bg-plum-600 px-2 py-0.5 text-[10px] font-medium text-white">
            {unread.length} new
          </span>
        )}
      </div>

      {replyTo && (
        <MailboxNoteComposer
          recipientName={nameFor(replyTo.fromUserId)}
          replyToNoteId={replyTo.id}
          onSend={handleSend}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {openNoteId && !replyTo && (
        <div className="space-y-2">
          {(() => {
            const note = notes.find((n) => n.id === openNoteId);
            if (!note) return null;
            return (
              <>
                <MailboxNoteCard note={note} fromName={nameFor(note.fromUserId)} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setOpenNoteId(null)}
                  >
                    Close
                  </button>
                  {note.fromUserId !== user.id && (
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() => {
                        setReplyTo(note);
                        setOpenNoteId(null);
                      }}
                    >
                      Reply with note
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!openNoteId && !replyTo && (
        <>
          {unread.length === 0 && history.length === 0 && (
            <p className="text-xs text-cozy-500">No notes yet. Friends can leave mail when you&apos;re away.</p>
          )}

          {unread.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-plum-700">New</p>
              {unread.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note)}
                  className="w-full rounded-lg border border-plum-200 bg-plum-50 p-2 text-left hover:bg-plum-100"
                >
                  <p className="text-xs font-medium text-cozy-900">{nameFor(note.fromUserId)}</p>
                  <p className="line-clamp-2 text-[11px] text-cozy-600">{note.body}</p>
                </button>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-cozy-500">History</p>
              {history.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note)}
                  className="w-full rounded-lg border border-cozy-200 bg-cozy-50 p-2 text-left hover:bg-cozy-100"
                >
                  <p className="text-xs font-medium text-cozy-800">{nameFor(note.fromUserId)}</p>
                  <p className="line-clamp-1 text-[11px] text-cozy-500">{note.body}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
