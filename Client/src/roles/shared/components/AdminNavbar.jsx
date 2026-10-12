import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);

  // Close the profile dropdown when clicking anywhere outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    setProfileOpen(false);
    // TODO: clear auth/session state here once real auth is wired up
    navigate("/login");
  }

  return (
    <div className="app-header-wrapper">
      <header className="app-header">
        <div className="app-header-gradient"></div>

        <div className="app-header-content">
          <NavLink className="app-logo" to="/admin" onClick={closeMenu}>
            EDUSTREAM
            <span className="app-logo-badge">Teacher</span>
          </NavLink>

          <button
            className="app-menu-btn"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle admin menu"
          >
            •••
          </button>

          <nav className={`app-nav ${open ? "is-open" : ""}`}>
            <NavLink end className="app-nav-link" to="/admin" onClick={closeMenu}>
              Dashboard
            </NavLink>

            <NavLink className="app-nav-link" to="/admin/videos" onClick={closeMenu}>
              Videos
            </NavLink>

            <NavLink className="app-nav-link" to="/admin/schedule" onClick={closeMenu}>
              Schedule
            </NavLink>

            <NavLink className="app-nav-link" to="/admin/content" onClick={closeMenu}>
              Content
            </NavLink>

            <NavLink className="app-nav-link" to="/admin/grades" onClick={closeMenu}>
              Grades
            </NavLink>

            <NavLink className="app-nav-link" to="/admin/students" onClick={closeMenu}>
              Students
            </NavLink>
          </nav>

          <div className="app-header-actions">
            <NavLink
              className="app-search-btn"
              to="/admin/settings"
              onClick={closeMenu}
              aria-label="Settings"
            >
              <i className="bi bi-gear"></i>
            </NavLink>

            <div className="app-profile" ref={profileRef}>
              <button
                type="button"
                className="app-avatar"
                aria-label="Account menu"
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <i className="bi bi-person"></i>
              </button>

              {profileOpen && (
                <div className="app-profile-menu">
                  <NavLink
                    className="app-profile-menu-item"
                    to="/admin/about-me"
                    onClick={() => {
                      setProfileOpen(false);
                      closeMenu();
                    }}
                  >
                    <i className="bi bi-person-circle"></i>
                    About Me
                  </NavLink>

                  <button
                    type="button"
                    className="app-profile-menu-item app-profile-menu-danger"
                    onClick={handleSignOut}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default AdminNavbar;