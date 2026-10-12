import { useEffect, useState } from "react";
import { apiRequest } from "../api";

function ManageVideos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/videos")
      .then((rows) => {
        if (cancelled) return;
        setVideos(
          rows.map((row) => ({
            id: row.PlaylistID,
            title: row.PlaylistTitle,
            link: row.YouTubePlaylistLink || "",
            category: row.Class || row.Subject || row.PlaylistCategory || "Uncategorized",
            visibility: "—",
            date: row.CreatedAt ? new Date(row.CreatedAt).toLocaleDateString() : "—",
            views: "—",
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

  const emptyForm = { id: null, title: "", link: "", visibility: "public", category: "" };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter ? video.category === classFilter : true;
    return matchesSearch && matchesClass;
  });

  // Build the filter list from whatever categories actually exist in the data,
  // so it always matches real videos even if CLASSES gets out of sync.
  const availableClasses = Array.from(new Set(videos.map((v) => v.category))).sort();

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const deleteVideo = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this video?");
    if (confirmed) {
      setVideos((prev) => prev.filter((video) => video.id !== id));
      flash("Video removed from this page only; the database was not changed.");
    }
  };

  function openAddModal() {
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(video) {
    setForm({
      id: video.id,
      title: video.title,
      link: video.link || "",
      visibility: video.visibility.toLowerCase(),
      category: video.category,
    });
    setFormError("");
    setShowModal(true);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setFormError("Video title is required.");
      return;
    }
    if (!form.link.trim()) {
      setFormError("Video link is required.");
      return;
    }
    if (!form.category) {
      setFormError("Please select a class.");
      return;
    }

    const visibilityLabel = form.visibility === "public" ? "Public" : "Private";

    if (form.id) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === form.id
            ? { ...v, title: form.title, link: form.link, visibility: visibilityLabel, category: form.category }
            : v
        )
      );
      flash("Video updated in this page only; it was not saved to the database.");
    } else {
      const newVideo = {
        id: Date.now(),
        title: form.title,
        link: form.link,
        category: form.category,
        visibility: visibilityLabel,
        date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        views: "0",
      };
      setVideos((prev) => [newVideo, ...prev]);
      flash("Video added in this page only; it was not saved to the database.");
    }

    setShowModal(false);
    setFormError("");
  };

  return (
    <main className="container page-with-navbar">
      {loadError && <div className="notice-banner notice-error">{loadError}</div>}
      <div className="notice-banner notice-error">
        Playlist records load from the database. Add, edit, and delete actions are not connected to database writes.
      </div>
      {notice && <div className="notice-banner notice-success">{notice}</div>}

      <div className="action-bar">
        <h1 className="action-bar-title">Manage Videos</h1>

        <div className="search-box">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0">
              <i className="bi bi-search"></i>
            </span>

            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by title..."
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
          <option value="">All Classes</option>
          {availableClasses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button className="btn btn-primary fw-semibold px-4" type="button" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-2"></i>
          Add New Video
        </button>
      </div>

      <div className="video-card-container">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Video Details</th>
                <th>Visibility</th>
                <th>Date Added</th>
                <th>Views</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <tr key={video.id}>
                    <td>
                      <div className="video-thumbnail d-flex align-items-center justify-content-center text-muted">
                        <i className="bi bi-play-fill fs-4"></i>
                      </div>
                    </td>

                    <td>
                      <div className="fw-bold text-dark">{video.title}</div>
                      <div className="text-muted small">{video.category}</div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          video.visibility === "Public" ? "bg-public" : "bg-private"
                        }`}
                      >
                        {video.visibility}
                      </span>
                    </td>

                    <td>{video.date}</td>

                    <td>
                      <i className="bi bi-eye me-1"></i>
                      {video.views}
                    </td>

                    <td className="text-end">
                      <button
                        className="btn-icon btn-edit"
                        type="button"
                        title="Edit"
                        onClick={() => openEditModal(video)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        className="btn-icon btn-delete"
                        type="button"
                        title="Delete"
                        onClick={() => deleteVideo(video.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {loadError ? "Could not load playlists." : "No playlists found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {form.id ? "Edit Video Lesson" : "Upload Video Lesson"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  {formError && <div className="modal-error">{formError}</div>}

                  <form onSubmit={handleUploadSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Video Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Intro to Calculus"
                        value={form.title}
                        onChange={(e) => handleFormChange("title", e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Video Link &#40;Vimeo/YouTube/S3&#41;
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://..."
                        value={form.link}
                        onChange={(e) => handleFormChange("link", e.target.value)}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Visibility</label>
                        <select
                          className="form-select"
                          value={form.visibility}
                          onChange={(e) => handleFormChange("visibility", e.target.value)}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Class</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter class name"
                          value={form.category}
                          onChange={(e) => handleFormChange("category", e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mt-2 py-2 fw-bold">
                      {form.id ? "Save Changes" : "Create Lesson"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default ManageVideos;