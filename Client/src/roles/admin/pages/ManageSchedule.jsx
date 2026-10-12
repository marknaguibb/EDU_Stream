import { useState } from "react";
// Ai made the whole schedule page 
const DAY_LABELS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const DAY_START = 8;
const DAY_END = 18;
const HOUR_HEIGHT = 56;

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const diff = (jsDay + 1) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 5);
  const opts = { month: "short", day: "numeric" };
  const startStr = weekStart.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, { ...opts, year: "numeric" });
  return `${startStr} - ${endStr}`;
}

function formatFullDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function ManageSchedule() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  const [schedule, setSchedule] = useState([]);

  const emptyForm = {
    id: null,
    date: toISODate(new Date()),
    start: "",
    end: "",
    className: "",
    type: "offline",
    location: "",
    link: "",
  };

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function flashSuccess(msg) {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(""), 3000);
  }

  function goToPrevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function goToNextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function goToToday() {
    setWeekStart(getWeekStart(new Date()));
  }

  function dateForDay(dayIndex) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    return d;
  }

  function openAddModal(dateIso) {
    setForm({ ...emptyForm, date: dateIso || toISODate(new Date()) });
    setError("");
    setShowModal(true);
  }

  function openEditModal(session) {
    setForm(session);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError("");
  }

  function handleDelete(id) {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
    closeModal();
    flashSuccess("Session removed from this page only; the database was not changed.");
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.className) return setError("Please select a class.");
    if (!form.date) return setError("Please select a date.");
    if (!form.start || !form.end) return setError("Start and end time are required.");
    if (form.start >= form.end) return setError("End time must be after start time.");
    if (form.type === "online" && !form.link.trim()) return setError("Please add a meeting link for an online session.");
    if (form.type === "offline" && !form.location.trim()) return setError("Please add a location for an offline session.");

    const conflict = schedule.find(
      (s) => s.id !== form.id && s.date === form.date && timesOverlap(form.start, form.end, s.start, s.end)
    );

    if (conflict) {
      setError(
        `Invalid: this overlaps with "${conflict.className}" on ${formatFullDate(conflict.date)} (${formatTime(conflict.start)} - ${formatTime(conflict.end)}). Booking refused.`
      );
      return;
    }

    const isEdit = Boolean(form.id);
    if (isEdit) {
      setSchedule((prev) => prev.map((s) => (s.id === form.id ? form : s)));
    } else {
      setSchedule((prev) => [...prev, { ...form, id: Date.now() }]);
    }

    setShowModal(false);
    setError("");
    flashSuccess(
      isEdit
        ? "Session updated in this page only; it was not saved to the database."
        : "Session added in this page only; it was not saved to the database."
    );
  }

  const hours = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);
  const gridHeight = (DAY_END - DAY_START) * HOUR_HEIGHT;

  function blockStyle(session) {
    const startMin = toMinutes(session.start) - DAY_START * 60;
    const endMin = toMinutes(session.end) - DAY_START * 60;
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 28);
    return { top, height };
  }

  const todayStr = new Date().toDateString();

  return (
    <>
      <div className="container page-with-navbar">
        <div className="notice-banner notice-error">
          This screen is not connected to the server. Changes made here are temporary and will not be saved.
        </div>

        {successMessage && (
          <div className="notice-banner notice-success">{successMessage}</div>
        )}

        <div className="dashboard-card">
          <div className="card-title-row">
            <div>
              <h2>Manage Weekly Schedule</h2>
              <p>{formatWeekRange(weekStart)}</p>
            </div>
            <button className="btn btn-primary" onClick={() => openAddModal()}>
              Add Session
            </button>
          </div>

          {schedule.length === 0 && (
            <p className="text-muted">
              No schedule records are loaded. This screen is not connected to a database endpoint yet.
            </p>
          )}

          <div className="schedule-nav">
            <button className="btn btn-sm btn-light" onClick={goToPrevWeek}>
              <i className="bi bi-chevron-left"></i> Prev
            </button>
            <button className="btn btn-sm btn-light" onClick={goToToday}>
              Today
            </button>
            <button className="btn btn-sm btn-light" onClick={goToNextWeek}>
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="schedule-scroll">
            <div className="schedule-grid">
              <div className="schedule-header-row">
                <div className="schedule-time-gutter" />
                {DAY_LABELS.map((label, i) => {
                  const d = dateForDay(i);
                  const isToday = d.toDateString() === todayStr;
                  return (
                    <div key={label} className={`schedule-day-header ${isToday ? "is-today" : ""}`}>
                      <div className="day-label">{label}</div>
                      <div className="day-date">
                        {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="schedule-body-row">
                <div className="schedule-time-col">
                  {hours.map((h) => (
                    <div key={h} className="schedule-time-slot" style={{ height: `${HOUR_HEIGHT}px` }}>
                      {h % 12 === 0 ? 12 : h % 12}
                      {h >= 12 ? "PM" : "AM"}
                    </div>
                  ))}
                </div>

                {DAY_LABELS.map((label, i) => {
                  const d = dateForDay(i);
                  const iso = toISODate(d);
                  const isToday = d.toDateString() === todayStr;
                  return (
                    <div
                      key={label}
                      onClick={() => openAddModal(iso)}
                      className={`schedule-day-col ${isToday ? "is-today" : ""}`}
                      style={{ height: `${gridHeight}px` }}
                    >
                      {hours.map((h, hi) => (
                        <div
                          key={h}
                          className="schedule-hour-line"
                          style={{ top: `${hi * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {schedule
                        .filter((s) => s.date === iso)
                        .map((session) => {
                          const { top, height } = blockStyle(session);
                          const isOnline = session.type === "online";
                          return (
                            <div
                              key={session.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(session);
                              }}
                              className={`schedule-block ${isOnline ? "schedule-block-online" : "schedule-block-offline"}`}
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="schedule-block-title">{session.className}</div>
                              <div className="schedule-block-meta">
                                {formatTime(session.start)} - {formatTime(session.end)}
                              </div>
                              {height > 44 && (
                                <div className="schedule-block-meta">
                                  {isOnline ? "Online" : session.location}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="schedule-legend">
            <div className="schedule-legend-item">
              <span className="schedule-legend-dot offline" />
              Offline
            </div>
            <div className="schedule-legend-item">
              <span className="schedule-legend-dot online" />
              Online
            </div>
            <div>Tap empty space to add. Tap a session to edit.</div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="custom-modal-title">{form.id ? "Edit Session" : "Add Session"}</h2>

            {error && <div className="modal-error">{error}</div>}

            <div className="mb-2">
              <label className="form-label">Class</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter class name"
                value={form.className}
                onChange={(e) => handleChange("className", e.target.value)}
              />
            </div>

            <div className="row g-2 mb-2">
              <div className="col-4">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Start</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.start}
                  onChange={(e) => handleChange("start", e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">End</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.end}
                  onChange={(e) => handleChange("end", e.target.value)}
                />
              </div>
            </div>

            {form.date && <div className="modal-hint">{formatFullDate(form.date)}</div>}

            <div className="row g-2 mb-2">
              <div className="col-4">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="col-8">
                {form.type === "online" ? (
                  <>
                    <label className="form-label">Meeting Link</label>
                    <input
                      className="form-control"
                      placeholder="https://zoom.us/j/..."
                      value={form.link}
                      onChange={(e) => handleChange("link", e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="form-label">Location</label>
                    <input
                      className="form-control"
                      placeholder="Room 204"
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="modal-actions modal-actions-split">
              {form.id ? (
                <button className="btn btn-light btn-delete-text" onClick={() => handleDelete(form.id)}>
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="modal-actions-right">
                <button className="btn btn-light" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}