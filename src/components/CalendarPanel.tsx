import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function CalendarPanel({ roomId }: { roomId: string }) {
  const {
    user,
    users,
    calendarEvents,
    calendarConnections,
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

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Shared calendar</h3>
      <p className="text-sm text-cozy-600">
        Connect calendars or add hangouts manually — see what&apos;s coming up at a glance.
      </p>

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
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-12 rounded-lg p-1 text-xs ${
                day ? "border border-cozy-100 bg-cozy-50" : ""
              }`}
            >
              {day && (
                <>
                  <span className="font-medium">{day}</span>
                  {eventsOnDay(day).map((e) => (
                    <div
                      key={e.id}
                      className="mt-0.5 truncate rounded bg-plum-100 px-0.5 text-[9px] text-plum-800"
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-cozy-900">Pending event requests</h4>
        {pendingRequests.length === 0 ? (
          <p className="mt-2 text-sm text-cozy-500">No pending requests right now.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pendingRequests.slice(0, 8).map((e) => {
              const u = users.find((x) => x.id === e.userId);
              const start = new Date(e.startAt);
              const joined = !!user && (e.rsvpUserIds ?? []).includes(user.id);
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{e.title}</p>
                  <p className="text-cozy-600">
                    {start.toLocaleDateString()} ·{" "}
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  <p className="text-xs text-cozy-500">
                    Created by {u?.displayName} · RSVP: {(e.rsvpUserIds ?? []).length}
                  </p>
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
              const u = users.find((x) => x.id === e.userId);
              const start = new Date(e.startAt);
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-cozy-200 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{e.title}</p>
                  <p className="text-cozy-600">
                    {start.toLocaleDateString()} ·{" "}
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  <p className="text-xs text-cozy-500">
                    {u?.displayName} · {e.source} · RSVP {(e.rsvpUserIds ?? []).length}
                    {(e.syncedToGoogleUserIds?.length ?? 0) > 0 && " · Synced Google"}
                    {(e.syncedToAppleUserIds?.length ?? 0) > 0 && " · Synced Apple"}
                  </p>
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
    </div>
  );
}
