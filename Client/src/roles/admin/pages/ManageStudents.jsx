import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/api.js";

const PAYMENT_STATUSES = ["Paid", "Pending", "Scholarship"];

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [notice, setNotice] = useState("");

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  }

  useEffect(() => {
    let cancelled = false;
    apiRequest("/students")
      .then((rows) => {
        if (cancelled) return;
        setStudents(
          rows.map((row) => ({
            id: row.StudentID,
            name: `${row.FirstName} ${row.LastName}`,
            email: row.Email || "",
            classId: row.Class || "",
            subject: row.Subject || "",
            enrollmentDate: row.EnrollmentDate,
            active: true,
          }))
        );
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter ? s.classId === classFilter : true;
    return matchesSearch && matchesClass;
  });

  // ---------- Modal / form state ----------
  const emptyForm = {
    id: null,
    name: "",
    email: "",
    classId: "",
    paymentStatus: "Pending",
    active: true,
  };

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  function openAddModal() {
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(student) {
    setForm(student);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return setFormError("Student name is required.");
    if (!form.email.trim()) return setFormError("Email is required.");
    if (!form.classId) return setFormError("Please select a class.");

    if (form.id) {
      setStudents((prev) => prev.map((s) => (s.id === form.id ? form : s)));
      flash("Student updated in this page only; it was not saved to the database.");
    } else {
      setStudents((prev) => [...prev, { ...form, id: Date.now() }]);
      flash("Student added in this page only; it was not saved to the database.");
    }

    setShowModal(false);
    setFormError("");
  }

  function toggleActive(id) {
    const target = students.find((s) => s.id === id);
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    flash(`${target.name}'s status changed in this page only; it was not saved to the database.`);
  }

  function handleRemove(id) {
    const target = students.find((s) => s.id === id);
    const confirmed = window.confirm(
      `Remove ${target.name} from the platform? This cannot be undone.`
    );
    if (!confirmed) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    closeModal();
    flash(`${target.name} removed from this page only; the database was not changed.`);
  }

  return (
    <>
      <div className="container page-with-navbar">
        {loadError && <div className="notice-banner notice-error">{loadError}</div>}
        <div className="notice-banner notice-error">
          Student rows load from the database. Add, edit, status, and remove actions are not connected to database writes.
        </div>
        {notice && <div className="notice-banner notice-success">{notice}</div>}

        <div className="action-bar">
          <h1 className="action-bar-title">Manage Students</h1>

          <div className="search-box">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="form-select class-filter-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Select Class</option>
            {[...new Set(students.map((student) => student.classId).filter(Boolean))].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button className="btn btn-primary fw-semibold px-4" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Student
          </button>
        </div>

        <div className="video-card-container">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Enrolled</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="fw-bold text-dark">{student.name}</div>
                        <div className="text-muted small">{student.email}</div>
                      </td>

                      <td>{student.classId}</td>

                      <td>{student.subject || "—"}</td>

                      <td>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "—"}</td>

                      <td className="text-end">
                        <button
                          className="btn-icon"
                          type="button"
                          title={student.active ? "Deactivate" : "Activate"}
                          onClick={() => toggleActive(student.id)}
                          style={{
                            color: student.active ? "var(--danger)" : "var(--success)",
                          }}
                        >
                          <i className={`bi ${student.active ? "bi-pause-fill" : "bi-play-fill"}`}></i>
                        </button>

                        <button
                          className="btn-icon btn-edit"
                          type="button"
                          title="Edit"
                          onClick={() => openEditModal(student)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="btn-icon btn-delete"
                          type="button"
                          title="Remove"
                          onClick={() => handleRemove(student.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      {loadError ? "Could not load students." : "No student records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="custom-modal-title">{form.id ? "Edit Student" : "Add Student"}</h2>

            {formError && <div className="modal-error">{formError}</div>}

            <div className="mb-2">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alice Johnson"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="student@demo.com"
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
              />
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label">Class</label>
                <input
                  type="text"
                  className="form-select"
                  placeholder="Enter class name"
                  value={form.classId}
                  onChange={(e) => handleFormChange("classId", e.target.value)}
                />
              </div>

              <div className="col-6">
                <label className="form-label">Payment Status</label>
                <select
                  className="form-select"
                  value={form.paymentStatus}
                  onChange={(e) => handleFormChange("paymentStatus", e.target.value)}
                >
                  {PAYMENT_STATUSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={form.active ? "active" : "inactive"}
                onChange={(e) => handleFormChange("active", e.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="modal-actions modal-actions-split">
              {form.id ? (
                <button
                  className="btn btn-light btn-delete-text"
                  onClick={() => handleRemove(form.id)}
                >
                  Remove Student
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