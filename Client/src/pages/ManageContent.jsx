import { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import { apiRequest } from "../api";

const DEFAULT_TYPES = ["Assignment", "Lecture"];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ManageContent() {
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [classFilter, setClassFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiRequest("/content")
      .then((rows) => {
        if (cancelled) return;
        const loadedItems = rows.map((row) => ({
          id: row.ContentID,
          classId: row.Class || "",
          type: row.ContentType || "Content",
          title: row.Title,
          subject: row.Subject || "",
          uploadedAt: row.UploadDate,
          description: "",
          dueDate: "",
        }));
        setItems(loadedItems);
        setTypes((previous) => [
          ...new Set([...previous, ...loadedItems.map((item) => item.type)]),
        ]);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const filteredItems = items.filter((item) => {
    const matchesClass = classFilter ? item.classId === classFilter : true;
    const matchesType = typeFilter ? item.type === typeFilter : true;
    return matchesClass && matchesType;
  });

  // ---------- Modal / form state ----------
  const emptyForm = {
    id: null,
    classId: "",
    type: "Assignment",
    title: "",
    description: "",
    dueDate: todayISO(),
  };

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  function handleAddType() {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (types.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setFormError("That type already exists.");
      return;
    }
    setTypes((prev) => [...prev, trimmed]);
    setForm((prev) => ({ ...prev, type: trimmed }));
    setNewTypeName("");
    setShowNewTypeInput(false);
    setFormError("");
  }

  function openAddModal() {
    setForm(emptyForm);
    setFormError("");
    setShowNewTypeInput(false);
    setNewTypeName("");
    setShowModal(true);
  }

  function openEditModal(item) {
    setForm(item);
    setFormError("");
    setShowNewTypeInput(false);
    setNewTypeName("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
    setShowNewTypeInput(false);
    setNewTypeName("");
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.classId) return setFormError("Please select a class.");
    if (!form.title.trim()) return setFormError("Please enter a title.");
    if (!form.description.trim()) return setFormError("Please add a description.");
    if (form.type !== "Lecture" && !form.dueDate) {
      return setFormError("Please set a due date.");
    }

    if (form.id) {
      setItems((prev) => prev.map((it) => (it.id === form.id ? form : it)));
      flash(`${form.type} updated in this page only; it was not saved to the database.`);
    } else {
      setItems((prev) => [...prev, { ...form, id: Date.now() }]);
      flash(`${form.type} added in this page only; it was not saved to the database.`);
    }

    setShowModal(false);
    setFormError("");
  }

  function handleDelete(id) {
    const target = items.find((it) => it.id === id);
    const confirmed = window.confirm(`Delete "${target.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    closeModal();
    flash(`${target.type} removed from this page only; the database was not changed.`);
  }

  return (
    <>
      <AdminNavbar />
      <div className="container page-with-navbar">
        {loadError && <div className="notice-banner notice-error">{loadError}</div>}
        <div className="notice-banner notice-error">
          Content rows load from the database. Add, edit, and delete actions are not connected to database writes.
        </div>
        {notice && <div className="notice-banner notice-success">{notice}</div>}

        <div className="action-bar action-bar-inline">
          <h1 className="action-bar-title">Manage Content</h1>

          <div className="action-bar-controls">
            <select
              className="form-select class-filter-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Select Class</option>
              {[...new Set(items.map((item) => item.classId).filter(Boolean))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-select class-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button className="btn btn-primary fw-semibold px-4" type="button" onClick={openAddModal}>
              <i className="bi bi-plus-lg me-2"></i>
              Add Content
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          {filteredItems.length === 0 && (
            <div className="text-center text-muted py-4">
              {loadError ? "Could not load content." : "No content records found."}
            </div>
          )}

          {filteredItems.map((item) => (
            <div key={item.id} className="list-item">
              <div>
                <div className="item-title">
                  {item.title}{" "}
                  <span
                    className={`status-badge ${
                      item.type === "Assignment" ? "bg-private" : "bg-public"
                    }`}
                    style={{ marginLeft: "8px" }}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="item-meta">{item.classId}</div>

                {item.subject && (
                  <div className="item-meta" style={{ marginTop: "6px" }}>
                    Subject: {item.subject}
                  </div>
                )}
                {item.uploadedAt && (
                  <div className="text-time" style={{ marginTop: "6px" }}>
                    Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                  </div>
                )}

                {item.type !== "Lecture" && item.dueDate && (
                  <div className="text-time" style={{ marginTop: "6px" }}>
                    Due {formatDate(item.dueDate)}
                  </div>
                )}
              </div>

              <div>
                <button
                  className="btn-icon btn-edit"
                  type="button"
                  title="Edit"
                  onClick={() => openEditModal(item)}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>

                <button
                  className="btn-icon btn-delete"
                  type="button"
                  title="Delete"
                  onClick={() => handleDelete(item.id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="custom-modal-title">
              {form.id ? "Edit" : "Add"} {form.type}
            </h2>

            {formError && <div className="modal-error">{formError}</div>}

            <div className="mb-2">
              <label className="form-label">Class</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter class name"
                value={form.classId}
                onChange={(e) => handleFormChange("classId", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Type</label>

              {!showNewTypeInput ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) => handleFormChange("type", e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    title="Add new type"
                    onClick={() => setShowNewTypeInput(true)}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Quiz, Project, Reading..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddType();
                      }
                    }}
                    autoFocus
                  />
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddType}>
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => {
                      setShowNewTypeInput(false);
                      setNewTypeName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                placeholder={
                  form.type === "Lecture"
                    ? "e.g. Week 3 - Recursion Basics"
                    : "e.g. Recursion Practice Set"
                }
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe what this covers or what students need to do..."
                value={form.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
              />
            </div>

            {form.type !== "Lecture" && (
              <div className="mb-2">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) => handleFormChange("dueDate", e.target.value)}
                />
              </div>
            )}

            <div className="modal-actions modal-actions-split">
              {form.id ? (
                <button
                  className="btn btn-light btn-delete-text"
                  onClick={() => handleDelete(form.id)}
                >
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