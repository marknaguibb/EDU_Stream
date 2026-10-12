import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginHero from "../assets/images/login.jpg";
const demoAccounts = {
  student: {
    role: "student",
    label: "Student Demo Account",
    email: "student@demo.com",
    password: "student123",
    redirect: "/student",
  },
  admin: {
    role: "admin",
    label: "Admin Demo Account",
    email: "admin@demo.com",
    password: "admin123",
    redirect: "/admin",
  },
};
function LoginPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [trialMode, setTrialMode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

 useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    if (panelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [panelOpen]);

  const handleTrialChange = (e) => {
  const selectedMode = e.target.value;
  setTrialMode(selectedMode);

  if (!selectedMode) {
    setEmail("");
    setPassword("");
    return;
  }

  const account = demoAccounts[selectedMode];

  setEmail(account.email);
  setPassword(account.password);

};

    const handleLogin = (e) => {
    e.preventDefault();

    const selectedAccount = Object.values(demoAccounts).find(
      (account) => account.email === email && account.password === password
    );

    if (!selectedAccount) {
      alert("Invalid demo account. Choose Student Demo or Admin Demo.");
      return;
    }

    navigate(selectedAccount.redirect);
  };
  return (
    <div className={`login-page ${panelOpen ? "panel-active" : ""}`}>
      <section
        className="hero-banner"
        style={{
          backgroundImage: `url(${loginHero})`,
        }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="instructor-name">Dr. Elena Sterling</h1>
          <p className="tagline">
            Advanced Theoretical Physics &bull; 15 Years Experience
          </p>

          <button
            className="btn btn-trigger"
            type="button"
            onClick={() => setPanelOpen(true)}
          >
            Student Login
          </button>
        </div>
      </section>

      <div className="panel-overlay" onClick={() => setPanelOpen(false)}></div>

      <div className="slide-panel">
        <button
          className="close-icon"
          type="button"
          onClick={() => setPanelOpen(false)}
          aria-label="Close login panel"
        >
          ×
        </button>

        <div className="panel-container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="login-header text-center text-lg-start">
                <h2>Portal Access</h2>
                <p className="text-muted">Sign in to your EduStream account</p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="trial-box mb-4">
                  <label className="form-label">Trial Mode</label>
                  <select
                    className="form-select"
                    value={trialMode}
                    onChange={handleTrialChange}
                  >
                    <option value="">Choose demo account...</option>
                    <option value="student">Student Demo Account</option>
                    <option value="admin">Admin Demo Account</option>
                  </select>

                  {trialMode && (
                    <div className="trial-hint mt-2">
                      Using: <strong>{demoAccounts[trialMode].label}</strong>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Student Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="yourname@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Security Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-trigger">
                  Sign In
                </button>
              </form>

              <div className="subscription-box" style={{ marginTop: "2rem" }}>
                <p className="sub-text">
                  New student? An active subscription is required to access
                  recorded lectures, live schedules, and course materials.
                </p>

                <Link to="/subscribe" className="btn-subscribe">
                  Explore Subscription Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;