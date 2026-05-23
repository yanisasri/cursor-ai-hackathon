import { useState } from "react";
import { useApp } from "../context/AppContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPanel({ roomId }: { roomId: string }) {
  const { user, users, calendarSlots, addCalendarSlot, pushNotification } = useApp();
  const [day, setDay] = useState("Fri");
  const [startHour, setStartHour] = useState(18);
  const [endHour, setEndHour] = useState(21);
  const [label, setLabel] = useState("Free for hangout");

  const memberSlots = calendarSlots.filter((s) =>
    users.some((u) => u.id === s.userId)
  );

  const addSlot = () => {
    if (!user) return;
    addCalendarSlot({
      userId: user.id,
      label,
      day,
      startHour,
      endHour,
      free: true,
    });
    pushNotification(
      "calendar",
      "Availability updated",
      `${user.displayName} is free ${day} ${startHour}:00–${endHour}:00`
    );
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Shared availability</h3>
      <p className="text-sm text-cozy-600">
        See when friends are free — no more endless &quot;when works for you?&quot; texts.
      </p>

      <div className="card mt-4 space-y-3">
        <p className="text-sm font-medium">Add your availability</p>
        <input
          className="input-field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`rounded-lg px-2 py-1 text-sm ${
                day === d ? "bg-plum-600 text-white" : "bg-cozy-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <label>
            From
            <input
              type="number"
              min={0}
              max={23}
              className="input-field ml-1 w-16"
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
            />
          </label>
          <label>
            To
            <input
              type="number"
              min={0}
              max={23}
              className="input-field ml-1 w-16"
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
            />
          </label>
        </div>
        <button type="button" className="btn-primary" onClick={addSlot}>
          Share availability
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {memberSlots.length === 0 ? (
          <p className="text-sm text-cozy-500">No availability posted yet.</p>
        ) : (
          memberSlots.map((slot) => {
            const u = users.find((x) => x.id === slot.userId);
            return (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-xl border border-cozy-200 px-3 py-2 text-sm"
              >
                <span className="font-medium">{u?.displayName ?? "Friend"}</span>
                <span className="text-cozy-600">
                  {slot.day} {slot.startHour}:00–{slot.endHour}:00 — {slot.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="btn-secondary mt-4 w-full text-sm"
        onClick={() =>
          pushNotification(
            "hangout",
            "Hangout reminder",
            `Your hangout in ${roomId.slice(0, 6)}… starts in 1 hour!`
          )
        }
      >
        Demo: Send hangout reminder
      </button>
    </div>
  );
}
