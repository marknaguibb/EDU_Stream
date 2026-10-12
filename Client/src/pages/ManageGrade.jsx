import { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import { apiRequest } from "../api";
const SUBJECTS = ["Computer Science", "Mathematics", "Physics", "English"];

export default function ManageGrades() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classItems, setClassItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradesLoadError, setGradesLoadError] = useState(false);

  // Grades are keyed by grading-item id, then by student id, so each
  // grading item keeps its own independent set of grades:
  // { [itemId]: { [studentId]: gradeValue } }
  const [grades, setGrades] = useState({});

  const [notice, setNotice] = useState(null);

  function flash(type, text) {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 3500);
  }

  async function loadCategories() {
    const data = await apiRequest("/categories");
    setCategories(data);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiRequest("/categories"), apiRequest("/classes")])
      .then(([categoryData, classData]) => {
        if (cancelled) return;
        setCategories(categoryData);
        setClasses(classData);
      })
      .catch((error) => {
        if (!cancelled) flash("error", error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedClass) return undefined;

    let cancelled = false;
    Promise.all([
      apiRequest(`/students?classId=${encodeURIComponent(selectedClass)}`),
      apiRequest(`/items?classId=${encodeURIComponent(selectedClass)}`),
    ])
      .then(([studentRows, itemRows]) => {
        if (cancelled) return;
        setStudents(
          studentRows.map((student) => ({
            id: student.StudentID,
            name: `${student.FirstName} ${student.LastName}`,
          }))
        );
        setClassItems(
          itemRows.map((item) => ({
            id: item.TaskID,
            categoryId: item.CategoryID,
            title: item.TaskName,
            type: item.TaskType,
            max: item.MaxGrade,
          }))
        );
      })
      .catch((error) => {
        if (!cancelled) flash("error", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedItemId) return undefined;

    let cancelled = false;
    apiRequest(
      `/grades?taskId=${encodeURIComponent(selectedItemId)}&classId=${encodeURIComponent(selectedClass)}`
    )
      .then((rows) => {
        if (cancelled) return;
        const itemGrades = Object.fromEntries(
          rows.map((row) => [row.StudentID, row.GradeObtained ?? ""])
        );
        setGrades((previous) => ({ ...previous, [selectedItemId]: itemGrades }));
      })
      .catch((error) => {
        if (!cancelled) {
          setGradesLoadError(true);
          flash("error", error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGrades(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedItemId]);

  function handleClassChange(className) {
    setSelectedClass(className);
    setSelectedItemId("");
    setClassItems([]);
    setStudents([]);
    setLoadingGrades(false);
    setGradesLoadError(false);
  }

  function handleItemChange(itemId) {
    setSelectedItemId(itemId);
    setLoadingGrades(Boolean(itemId));
    setGradesLoadError(false);
  }

  const emptyCategory = { id: null, title: "", subject: SUBJECTS[0] };
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categoryError, setCategoryError] = useState("");

  function openAddCategory() {
    setCategoryForm(emptyCategory);
    setCategoryError("");
    setShowCategoryModal(true);
  }

  function openEditCategory(cat) {
    setCategoryForm({ id: cat.id, title: cat.title, subject: cat.subject });
    setCategoryError("");
    setShowCategoryModal(true);
  }

  async function saveCategory() {
    if (!categoryForm.title.trim()) {
      setCategoryError("Category name is required.");
      return;
    }
    try {
      const isEdit = Boolean(categoryForm.id);
      await apiRequest(
        isEdit ? `/categories/${categoryForm.id}` : "/categories",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: categoryForm.title.trim(),
            subject: categoryForm.subject,
          }),
        }
      );
      await loadCategories();
      flash("success", isEdit ? "Category updated." : "Category added.");
      setShowCategoryModal(false);
    } catch (error) {
      setCategoryError(error.message);
    }
  }

  const emptyItem = { id: null, categoryId: null, title: "", type: "Quiz", max: 20 };
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [itemError, setItemError] = useState("");

  function openAddItem(categoryId) {
    setItemForm({ ...emptyItem, categoryId });
    setItemError("");
    setShowItemModal(true);
  }

  function openEditItem(categoryId, item) {
    setItemForm({ ...item, categoryId });
    setItemError("");
    setShowItemModal(true);
  }

  async function saveItem() {
    if (!itemForm.title.trim()) {
      setItemError("Item name is required.");
      return;
    }
    const max = Number(itemForm.max);
    if (!max || max <= 0) {
      setItemError("Max score must be a number greater than 0.");
      return;
    }

    try {
      const isEdit = Boolean(itemForm.id);
      const itemSubject = categories.find((category) => category.id === itemForm.categoryId)?.subject;
      const itemClassName = classes.find((className) =>
        className.toLowerCase().startsWith(String(itemSubject || "").toLowerCase())
      );
      await apiRequest(
        isEdit ? `/items/${itemForm.id}` : "/items",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? { taskName: itemForm.title.trim(), taskType: itemForm.type, maxGrade: max }
              : {
                  categoryId: itemForm.categoryId,
                  taskName: itemForm.title.trim(),
                  taskType: itemForm.type,
                  maxGrade: max,
                  subject: itemSubject,
                  classId: itemClassName,
                }
          ),
        }
      );
      await loadCategories();
      const updatedClass = isEdit ? selectedClass : itemClassName;
      if (updatedClass) {
        const itemRows = await apiRequest(`/items?classId=${encodeURIComponent(updatedClass)}`);
        setClassItems(
          itemRows.map((item) => ({
            id: item.TaskID,
            categoryId: item.CategoryID,
            title: item.TaskName,
            type: item.TaskType,
            max: item.MaxGrade,
          }))
        );
      }
      flash("success", isEdit ? "Grading item updated." : "Grading item added.");
      setShowItemModal(false);
    } catch (error) {
      setItemError(error.message);
    }
  }

  const availableItems = classItems;

  const activeItem = availableItems.find((ch) => String(ch.id) === String(selectedItemId));

  function handleGradeChange(studentId, rawValue) {
    if (!activeItem) return;

    if (rawValue === "") {
      setGrades((prev) => ({
        ...prev,
        [activeItem.id]: { ...prev[activeItem.id], [studentId]: "" },
      }));
      return;
    }

    const value = Number(rawValue);

    if (Number.isNaN(value)) {
      flash("error", "Grade must be a number.");
      return;
    }

    if (value > activeItem.max) {
      flash(
        "error",
        `Invalid: ${value} exceeds the max score of ${activeItem.max} for "${activeItem.title}". Grade refused.`
      );
      return;
    }

    if (value < 0) {
      flash("error", "Grade cannot be negative.");
      return;
    }

    setGrades((prev) => ({
      ...prev,
      [activeItem.id]: { ...prev[activeItem.id], [studentId]: value },
    }));
  }

  async function handleSaveGrades() {
    if (!selectedClass || !activeItem) {
      flash("error", "Please select a class and grading item before saving.");
      return;
    }
    if (loadingGrades || gradesLoadError) {
      flash("error", "Wait for the grades to finish loading before saving.");
      return;
    }
    if (students.length === 0) {
      flash("error", "There are no students in this class to save grades for.");
      return;
    }
    try {
      await Promise.all(
        students.map((student) =>
          apiRequest("/grades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: student.id,
              taskId: activeItem.id,
              grade: grades[activeItem.id]?.[student.id] === "" ? null : grades[activeItem.id]?.[student.id] ?? null,
            }),
          })
        )
      );
      flash("success", "Grades saved successfully.");
    } catch (error) {
      flash("error", error.message);
    }
  }

  return (
    <>
      <AdminNavbar />

      <div className="container page-with-navbar">
        <div className="admin-page-header">
          <h1>Manage Grades</h1>
          <p>Organize grading structures and assign student grades.</p>
        </div>

        {notice && (
          <div className={`notice-banner ${notice.type === "success" ? "notice-success" : "notice-error"}`}>
            {notice.text}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="dashboard-card">
              <div className="card-title-row">
                <div>
                  <h2>Grade Structure</h2>
                  <p>Categories and grading items</p>
                </div>
                <button className="btn btn-primary" onClick={openAddCategory}>
                  Add Category
                </button>
              </div>

              {categories.map((cat) => (
                <div key={cat.id} className="mb-4">
                  <div className="list-item">
                    <div>
                      <div className="item-title">{cat.title}</div>
                      <div className="item-meta">{cat.subject}</div>
                    </div>

                    <div>
                      <button
                        className="btn btn-sm btn-light me-2"
                        onClick={() => openAddItem(cat.id)}
                        title="Add item"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => openEditCategory(cat)}
                        title="Edit category"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                    </div>
                  </div>

                  {cat.children.map((child) => (
                    <div key={child.id} className="list-item" style={{ paddingLeft: "25px" }}>
                      <div>
                        <div className="item-title">{child.title}</div>
                        <div className="item-meta">
                          {child.type} • Max {child.max}
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => openEditItem(cat.id, child)}
                        title="Edit item"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                    </div>
                  ))}

                  {cat.children.length === 0 && (
                    <div className="item-meta" style={{ paddingLeft: "25px" }}>
                      No items yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-7">
            <div className="dashboard-card">
              <div className="card-title-row">
                <div>
                  <h2>Student Grades</h2>
                  <p>Assign and update grades</p>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Class</label>
                  <select
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                  >
                    <option value="">Choose Class...</option>
                    {classes.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label">Grading Item</label>
                  <select
                    className="form-select"
                    value={selectedItemId}
                    onChange={(e) => handleItemChange(e.target.value)}
                    disabled={!selectedClass}
                  >
                    <option value="">
                      {selectedClass ? "Select Item..." : "Choose a class first"}
                    </option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeItem && (
                <div className="modal-hint">
                  Max score for <strong>{activeItem.title}</strong>: {activeItem.max}
                </div>
              )}

              <div className="video-card-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => {
                      const gradeValue = activeItem
                        ? grades[activeItem.id]?.[student.id] ?? ""
                        : "";
                      const status = gradeValue !== "" ? "Graded" : "Pending";

                      return (
                        <tr key={student.id}>
                          <td>{student.id}</td>
                          <td>
                            <strong>{student.name}</strong>
                          </td>

                          <td style={{ width: "160px" }}>
                            <input
                              type="number"
                              className="form-control"
                              value={gradeValue}
                              max={activeItem ? activeItem.max : undefined}
                              min={0}
                              disabled={!activeItem}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            />
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                status === "Graded" ? "bg-public" : "bg-private"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-end">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveGrades}
                  disabled={loadingGrades || gradesLoadError || students.length === 0}
                >
                  Save Grades
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="custom-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="custom-modal-box modal-narrow" onClick={(e) => e.stopPropagation()}>
            <h2 className="custom-modal-title">{categoryForm.id ? "Edit Category" : "Add Category"}</h2>

            {categoryError && <div className="modal-error">{categoryError}</div>}

            <div className="mb-2">
              <label className="form-label">Category Name</label>
              <input
                className="form-control"
                placeholder="e.g. Quizzes"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Subject</label>
              <select
                className="form-select"
                value={categoryForm.subject}
                onChange={(e) => setCategoryForm((f) => ({ ...f, subject: e.target.value }))}
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-light" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveCategory}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="custom-modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="custom-modal-box modal-narrow" onClick={(e) => e.stopPropagation()}>
            <h2 className="custom-modal-title">
              {itemForm.id ? "Edit Grading Item" : "Add Grading Item"}
            </h2>

            {itemError && <div className="modal-error">{itemError}</div>}

            <div className="mb-2">
              <label className="form-label">Item Name</label>
              <input
                className="form-control"
                placeholder="e.g. Quiz 3"
                value={itemForm.title}
                onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={itemForm.type}
                  onChange={(e) => setItemForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option>Quiz</option>
                  <option>Assignment</option>
                  <option>Exam</option>
                  <option>Project</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Max Score</label>
                <input
                  type="number"
                  className="form-control"
                  value={itemForm.max}
                  onChange={(e) => setItemForm((f) => ({ ...f, max: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-light" onClick={() => setShowItemModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveItem}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}