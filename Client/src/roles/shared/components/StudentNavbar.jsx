import { NavLink } from "react-router-dom";

function StudentNavbar() {
  return (
    <div className="app-header-wrapper">
      <header className="app-header">
        <div className="app-header-gradient"></div>

        <div className="app-header-content">
          <NavLink className="app-logo" to="/student">
            EDUSTREAM
            <span className="app-logo-badge">Student</span>
          </NavLink>

          <nav className="app-nav">
            <NavLink className="app-nav-link" to="/student">
              Home
            </NavLink>

          </nav>

          <div className="app-header-actions">
            <button className="app-search-btn" type="button" aria-label="Search">
              <i className="bi bi-search"></i>
            </button>

            <NavLink className="app-avatar" to="/">
              <i className="bi bi-person-fill"></i>
            </NavLink>
          </div>
        </div>
      </header>
    </div>
  );
}

export default StudentNavbar;