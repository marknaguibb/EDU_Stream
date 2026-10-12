import { useEffect, useState } from "react";
import { apiRequest } from "../../shared/api.js";

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiRequest("/summary")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = summary
    ? [
        { label: "Students", value: summary.students, icon: "bi-people", theme: "icon-blue" },
        { label: "Grading Items", value: summary.gradingItems, icon: "bi-journal-check", theme: "icon-green" },
        { label: "Content Records", value: summary.content, icon: "bi-collection-play", theme: "icon-orange" },
        { label: "Pending Grades", value: summary.pendingGrades, icon: "bi-clock-history", theme: "icon-red" },
      ]
    : [];

  return (
    <main className="container page-with-navbar">
      <header className="admin-page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, Instructor. Here's what's happening on the platform.</p>
      </header>

      {loadError && <div className="notice-banner notice-error mb-4">{loadError}</div>}

      <div className="row g-4 mb-5">
        {metrics.map((metric) => (
          <div className="col-12 col-md-6 col-lg-3" key={metric.label}>
            <div className="stat-card">
              <div className={`stat-icon ${metric.theme}`}>
                <i className={`bi ${metric.icon}`}></i>
              </div>
              <div>
                <span className="stat-val">{metric.value}</span>
                <span className="stat-label">{metric.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="dashboard-card">
            <h2>
              <i className="bi bi-broadcast text-primary"></i>
              Upcoming Live Classes
            </h2>
            <p className="text-muted mb-0">
              No schedule table exists in the connected database.
            </p>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="dashboard-card">
            <h2>
              <i className="bi bi-clock-history text-danger"></i>
              Pending Grading
            </h2>
            <p className="text-muted mb-0">
              {summary
                ? `${summary.pendingGrades} students are awaiting grades across the available tasks.`
                : "Loading database summary..."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;