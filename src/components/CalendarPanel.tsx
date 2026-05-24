import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { CalendarEvent } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MEMBER_PALETTE = [
  { chip: "bg-violet-200 text-violet-900", dot: "bg-violet-500", label: "Violet" },
  { chip: "bg-amber-200 text-amber-900", dot: "bg-amber-500", label: "Amber" },
  { chip: "bg-emerald-200 text-emerald-900", dot: "bg-emerald-500", label: "Emerald" },
  { chip: "bg-sky-200 text-sky-900", dot: "bg-sky-500", label: "Sky" },
  { chip: "bg-rose-200 text-rose-900", dot: "bg-rose-500", label: "Rose" },
  { chip: "bg-orange-200 text-orange-900", dot: "bg-orange-500", label: "Orange" },
  { chip: "bg-teal-200 text-teal-900", dot: "bg-teal-500", label: "Teal" },
  { chip: "bg-fuchsia-200 text-fuchsia-900", dot: "bg-fuchsia-500", label: "Fuchsia" },
] as const;

const SHARED_STYLE = {
  chip: "bg-plum-300 text-plum-950 ring-1 ring-plum-500",
  dot: "bg-plum-600",
  label: "Shared hangout",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function isSharedEvent(event: CalendarEvent) {
  return (event.rsvpUserIds?.length ?? 0) >= 2;
}

function getEventStyle(event: CalendarEvent, memberIds: string[]) {
  if (isSharedEvent(event)) return SHARED_STYLE;
  const idx = memberIds.indexOf(event.userId);
  const paletteIdx = idx >= 0 ? idx : memberIds.length;
  return MEMBER_PALETTE[paletteIdx % MEMBER_PALETTE.length];
}

function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { date, time: `${startTime} – ${endTime}` };
}

interface EventDetailProps {
  event: CalendarEvent;
  roomId: string;
  memberIds: string[];
  onClose: () => void;
}

function EventDetailModal({ event, roomId, memberIds, onClose }: EventDetailProps) {
  const {
    user,
    users,
    rooms,
    getRoomDisplayName,
    rsvpCalendarEvent,
  } = useApp();

  const creator = users.find((u) => u.id === event.userId);
  const room = rooms.find((r) => r.id === roomId);
  const style = getEventStyle(event, memberIds);
  const { date, time } = formatEventTime(event);
  const joined = Boolean(user && (event.rsvpUserIds ?? []).includes(user.id));
  const rsvpUsers = (event.rsvpUserIds ?? [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cozy-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${style.dot}`} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-cozy-900">{event.title}</h2>
            <p className="mt-1 text-sm text-cozy-600">
              {isSharedEvent(event) ? "Shared hangout" : `${creator?.displayName ?? "Someone"}'s event`}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-cozy-500 hover:bg-cozy-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">When</dt>
            <dd className="text-cozy-800">
              {date} · {time}
            </dd>
          </div>
          {event.location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Where</dt>
              <dd className="text-cozy-800">{event.location}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Created by</dt>
            <dd className="text-cozy-800">
              {getRoomDisplayName(roomId, event.userId)}
              {event.roomId === roomId && room ? ` · ${room.name}` : event.roomId ? "" : " · Personal calendar"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Status</dt>
            <dd className="capitalize text-cozy-800">{event.status ?? "confirmed"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Source</dt>
            <dd className="capitalize text-cozy-800">{event.source}</dd>
          </div>
          {(event.syncedToGoogleUserIds?.length ?? 0) > 0 && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Synced</dt>
              <dd className="text-cozy-800">Google Calendar</dd>
            </div>
          )}
          {(event.syncedToAppleUserIds?.length ?? 0) > 0 && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">Synced</dt>
              <dd className="text-cozy-800">Apple Calendar</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-cozy-500">
              RSVP ({rsvpUsers.length})
            </dt>
            <dd className="text-cozy-800">
              {rsvpUsers.length === 0
                ? "No one yet"
                : rsvpUsers.map((u) => getRoomDisplayName(roomId, u!.id)).join(", ")}
            </dd>
          </div>
        </dl>

        {event.status === "pending" && user && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                joined ? "bg-green-600 text-white" : "btn-primary"
              }`}
              onClick={() => rsvpCalendarEvent(event.id, true)}
            >
              {joined ? "Joined" : "Join hangout"}
            </button>
            {joined && (
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => rsvpCalendarEvent(event.id, false)}
              >
                Cancel RSVP
              </button>
            )}
          </div>
        )}

        <button type="button" className="btn-secondary mt-4 w-full text-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

interface DayEventsProps {
  day: number;
  viewDate: Date;
  events: CalendarEvent[];
  roomId: string;
  memberIds: string[];
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

function DayEventsModal({
  day,
  viewDate,
  events,
  roomId,
  memberIds,
  onClose,
  onSelectEvent,
}: DayEventsProps) {
  const { getRoomDisplayName } = useApp();
  const dateLabel = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border border-cozy-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cozy-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-cozy-900">{dateLabel}</h2>
            <p className="text-sm text-cozy-500">
              {events.length} event{events.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-cozy-500 hover:bg-cozy-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-4">
          {events.length === 0 ? (
            <li className="text-sm text-cozy-500">Nothing scheduled this day.</li>
          ) : (
            events.map((e) => {
              const style = getEventStyle(e, memberIds);
              const { time } = formatEventTime(e);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`mb-2 w-full rounded-xl px-3 py-2 text-left text-sm ${style.chip}`}
                    onClick={() => onSelectEvent(e)}
                  >
                    <p className="font-medium">{e.title}</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {time}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs opacity-70">
                      {isSharedEvent(e)
                        ? "Shared · "
                        : `${getRoomDisplayName(roomId, e.userId)} · `}
                      {(e.rsvpUserIds ?? []).length} RSVP
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export function CalendarPanel({ roomId }: { roomId: string }) {
  const {
    user,
    rooms,
    calendarEvents,
    calendarConnections,
    getRoomDisplayName,
    createCalendarEventRequest,
    rsvpCalendarEvent,
    connectGoogleCalendar,
    connectAppleCalendar,
    pushNotification,
  } = useApp();

  const [viewDate, setViewDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const room = rooms.find((r) => r.id === roomId);
  const memberIds = room?.memberIds ?? [];

  const conn = user
    ? calendarConnections.find((c) => c.userId === user.id)
    : null;

  const roomEvents = useMemo(() => {
    return calendarEvents
      .filter((e) => e.roomId === roomId || e.roomId === "")
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [calendarEvents, roomId]);

  const upcoming = roomEvents.filter((e) => new Date(e.startAt) >= new Date());
  const pendingRequests = upcoming.filter((e) => e.status === "pending");
  const confirmedEvents = upcoming.filter((e) => e.status !== "pending");

  const monthStart = startOfMonth(viewDate);
  const totalDays = daysInMonth(viewDate);
  const startPad = monthStart.getDay();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const eventsOnDay = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return roomEvents.filter((e) => {
      const start = new Date(e.startAt);
      return (
        start.getFullYear() === d.getFullYear() &&
        start.getMonth() === d.getMonth() &&
        start.getDate() === d.getDate()
      );
    });
  };

  const selectedDayEvents =
    selectedDay !== null ? eventsOnDay(selectedDay).sort((a, b) => a.startAt.localeCompare(b.startAt)) : [];

  const addEvent = () => {
    if (!user || !title.trim() || !date) return;
    const startAt = new Date(`${date}T${startTime}`);
    const endAt = new Date(`${date}T${endTime}`);
    createCalendarEventRequest({
      roomId,
      userId: user.id,
      title: title.trim(),
      location: location.trim(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      source: "manual",
      status: "pending",
      rsvpUserIds: [],
      syncedToGoogleUserIds: [],
      syncedToAppleUserIds: [],
    });
    setTitle("");
    setLocation("");
    setShowForm(false);
    pushNotification("hangout", "Event request sent", `${title} on ${date}`);
  };

  const openEventDetail = (event: CalendarEvent) => {
    setSelectedDay(null);
    setSelectedEvent(event);
  };

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Shared calendar</h3>
      <p className="text-sm text-cozy-600">
        Tap a day to see all events, or tap an event for details. Colors show who created it;
        plum highlights shared hangouts.
      </p>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${SHARED_STYLE.dot}`} />
          Shared (2+ RSVP)
        </span>
        {memberIds.slice(0, 6).map((id, i) => {
          const palette = MEMBER_PALETTE[i % MEMBER_PALETTE.length];
          return (
            <span key={id} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
              {getRoomDisplayName(roomId, id)}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            conn?.googleConnected ? "bg-green-100 text-green-800" : "btn-secondary"
          }`}
          onClick={connectGoogleCalendar}
        >
          {conn?.googleConnected ? "✓ Google Calendar" : "Connect Google Calendar"}
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            conn?.appleConnected ? "bg-gray-800 text-white" : "btn-secondary"
          }`}
          onClick={connectAppleCalendar}
        >
          {conn?.appleConnected ? "✓ Apple Calendar" : "Connect Apple Calendar"}
        </button>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm hover:bg-cozy-100"
            onClick={() =>
              setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
            }
          >
            ←
          </button>
          <h4 className="font-semibold">
            {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h4>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm hover:bg-cozy-100"
            onClick={() =>
              setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
            }
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-cozy-500">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayEvents = day ? eventsOnDay(day) : [];
            const visibleEvents = dayEvents.slice(0, 2);
            const overflow = dayEvents.length - visibleEvents.length;
            const isToday =
              day &&
              new Date().toDateString() ===
                new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();

            return (
              <button
                key={i}
                type="button"
                disabled={!day}
                className={`min-h-14 rounded-lg p-1 text-left text-xs transition ${
                  day
                    ? `border border-cozy-100 bg-cozy-50 hover:border-plum-300 hover:bg-plum-50/40 ${
                        isToday ? "ring-2 ring-plum-300" : ""
                      }`
                    : "cursor-default border-transparent bg-transparent"
                }`}
                onClick={() => day && setSelectedDay(day)}
              >
                {day && (
                  <>
                    <span className="font-medium">{day}</span>
                    {visibleEvents.map((e) => {
                      const style = getEventStyle(e, memberIds);
                      return (
                        <div
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          className={`mt-0.5 truncate rounded px-0.5 text-[9px] ${style.chip}`}
                          title={`${e.title} — click for details`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEventDetail(e);
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.stopPropagation();
                              openEventDetail(e);
                            }
                          }}
                        >
                          {e.title}
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="mt-0.5 text-[9px] font-medium text-plum-700">+{overflow} more</div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-cozy-900">Pending event requests</h4>
        {pendingRequests.length === 0 ? (
          <p className="mt-2 text-sm text-cozy-500">No pending requests right now.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pendingRequests.slice(0, 8).map((e) => {
              const start = new Date(e.startAt);
              const joined = !!user && (e.rsvpUserIds ?? []).includes(user.id);
              const style = getEventStyle(e, memberIds);
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => openEventDetail(e)}
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                      {e.title}
                    </p>
                    <p className="text-cozy-600">
                      {start.toLocaleDateString()} ·{" "}
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <p className="text-xs text-cozy-500">
                      Created by {getRoomDisplayName(roomId, e.userId)} · RSVP:{" "}
                      {(e.rsvpUserIds ?? []).length}
                    </p>
                    <p className="mt-1 text-xs font-medium text-plum-600">View details →</p>
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        joined ? "bg-green-600 text-white" : "bg-white"
                      }`}
                      onClick={() => rsvpCalendarEvent(e.id, true)}
                    >
                      {joined ? "Joined" : "Join hangout"}
                    </button>
                    {joined && (
                      <button
                        type="button"
                        className="rounded-lg bg-cozy-200 px-3 py-1 text-xs"
                        onClick={() => rsvpCalendarEvent(e.id, false)}
                      >
                        Cancel RSVP
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-cozy-900">Confirmed hangouts</h4>
          <button
            type="button"
            className="text-sm font-medium text-plum-600"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Request new event"}
          </button>
        </div>
        {confirmedEvents.length === 0 ? (
          <p className="mt-2 text-sm text-cozy-500">No upcoming events yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {confirmedEvents.slice(0, 8).map((e) => {
              const start = new Date(e.startAt);
              const style = getEventStyle(e, memberIds);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-cozy-200 px-3 py-2 text-left text-sm hover:border-plum-300 hover:bg-plum-50/30"
                    onClick={() => openEventDetail(e)}
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                      {e.title}
                    </p>
                    <p className="text-cozy-600">
                      {start.toLocaleDateString()} ·{" "}
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <p className="text-xs text-cozy-500">
                      {getRoomDisplayName(roomId, e.userId)} · {e.source} · RSVP{" "}
                      {(e.rsvpUserIds ?? []).length}
                      {isSharedEvent(e) ? " · Shared" : ""}
                      {(e.syncedToGoogleUserIds?.length ?? 0) > 0 && " · Synced Google"}
                      {(e.syncedToAppleUserIds?.length ?? 0) > 0 && " · Synced Apple"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="card space-y-3">
          <p className="text-sm font-medium">Request hangout event</p>
          <input
            className="input-field"
            placeholder="Event name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              Start
              <input
                type="time"
                className="input-field mt-1"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="text-sm">
              End
              <input
                type="time"
                className="input-field mt-1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          <button type="button" className="btn-primary w-full" onClick={addEvent}>
            Send request
          </button>
        </div>
      )}

      {selectedDay !== null && (
        <DayEventsModal
          day={selectedDay}
          viewDate={viewDate}
          events={selectedDayEvents}
          roomId={roomId}
          memberIds={memberIds}
          onClose={() => setSelectedDay(null)}
          onSelectEvent={openEventDetail}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          roomId={roomId}
          memberIds={memberIds}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
