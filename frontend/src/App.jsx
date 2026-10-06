import { useEffect, useState } from "react";

const Icon = ({ name, size = 20, ...props }) => {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.1-.8" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 8.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" />,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    x: <><path d="m18 6-12 12M6 6l12 12" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
};

const initialForm = { full_name: "", phone: "", email: "", password: "" };

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [patient, setPatient] = useState(null);
  const isRegister = mode === "register";

  useEffect(() => {
    const token = localStorage.getItem("harbor_token");
    if (!token) return;

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("session");
        setPatient(await response.json());
      })
      .catch(() => localStorage.removeItem("harbor_token"));
  }, []);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setForm(initialForm);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
      if (!response.ok) throw new Error(detail || "We couldn't complete your request. Please try again.");
      localStorage.setItem("harbor_token", data.access_token);
      setPatient(data.patient);
    } catch (requestError) {
      setError(
        requestError.message === "Failed to fetch"
          ? "We couldn't reach the sign-in service. Please try again in a moment."
          : requestError.message,
      );
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("harbor_token");
    setPatient(null);
    switchMode("login");
  }

  if (patient) {
    return (
      <main className="portal-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Harbor Health home">
            <span className="brand-mark"><span>+</span></span>
            <span className="brand-name">harbor<span>health</span></span>
          </a>
          <button className="text-button" onClick={signOut}>Sign out</button>
        </header>
        <section className="welcome-card">
          <span className="welcome-icon"><Icon name="check" size={25} /></span>
          <p className="eyebrow">YOUR PATIENT PORTAL</p>
          <h1>Good to have you here, {patient.full_name.split(" ")[0]}.</h1>
          <p className="welcome-copy">You’re signed in and ready to take the next step in your care.</p>
          <div className="account-details">
            <div><span>Email</span><strong>{patient.email}</strong></div>
            <div><span>Phone</span><strong>{patient.phone}</strong></div>
          </div>
          <div className="portal-note">
            <Icon name="calendar" size={20} />
            <span>Your patient profile is ready for your care journey.</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Harbor Health home">
          <span className="brand-mark"><span>+</span></span>
          <span className="brand-name">harbor<span>health</span></span>
        </a>
        <div className="topbar-help">Need help? <a href="mailto:care@harborhealth.example">Contact us</a></div>
      </header>

      <div className="content-grid">
        <section className="story-panel" aria-label="About Harbor Health">
          <div className="story-content">
            <div className="availability"><span className="availability-dot" /> HERE FOR YOUR HEALTH</div>
            <h1>Care that fits<br />your <span>life.</span></h1>
            <p className="story-description">
              A simpler way to manage your health. Connect with trusted care and make time for what matters.
            </p>

            <div className="care-illustration" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="illustration-sun" />
              <div className="illustration-cross">+</div>
              <div className="illustration-leaf leaf-one" />
              <div className="illustration-leaf leaf-two" />
              <div className="illustration-ground" />
              <div className="illustration-card">
                <span className="mini-calendar"><Icon name="calendar" size={17} /></span>
                <span><strong>Care, on your time</strong><small>Appointments made easy</small></span>
                <span className="mini-arrow"><Icon name="arrow" size={16} /></span>
              </div>
            </div>

            <div className="trust-row">
              <div className="avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span><span>+</span></div>
              <span>Care that puts <strong>you first</strong></span>
            </div>
          </div>
          <div className="story-footer"><span>Thoughtful care. Every step.</span><span>© 2026 Harbor Health</span></div>
        </section>

        <section className="form-panel" aria-label={isRegister ? "Create your account" : "Sign in"}>
          <div className="form-wrap">
            <div className="mobile-mark"><span className="brand-mark"><span>+</span></span></div>
            <div className="form-heading">
              <div className="eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</div>
              <h2>{isRegister ? "Create your account" : "Sign in to your account"}</h2>
              <p>{isRegister ? "Set up your patient account to get started." : "Your care journey continues right here."}</p>
            </div>

            <div className="mode-switch" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
              <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? "active" : ""} onClick={() => switchMode("register")}>Create account</button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {isRegister && (
                <>
                  <label htmlFor="full_name">Full name</label>
                  <div className="input-wrap">
                    <Icon name="user" size={19} />
                    <input id="full_name" name="full_name" autoComplete="name" placeholder="Your full name" value={form.full_name} onChange={updateForm} minLength="2" maxLength="120" required />
                  </div>
                  <label htmlFor="phone">Phone number</label>
                  <div className="input-wrap">
                    <Icon name="phone" size={19} />
                    <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={updateForm} minLength="7" maxLength="30" required />
                  </div>
                </>
              )}

              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Icon name="mail" size={19} />
                <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateForm} required />
              </div>

              <div className="password-label">
                <label htmlFor="password">Password</label>
                {!isRegister && <button type="button" className="forgot-link" onClick={() => setError("Please contact our care team to reset your password.")}>Forgot password?</button>}
              </div>
              <div className="input-wrap">
                <Icon name="lock" size={19} />
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} value={form.password} onChange={updateForm} minLength={isRegister ? "8" : "1"} maxLength="128" required />
                <button className="visibility-button" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}><Icon name={showPassword ? "eyeOff" : "eye"} size={19} /></button>
              </div>

              {isRegister && <p className="password-hint"><Icon name="shield" size={15} /> Use at least 8 characters to keep your account secure.</p>}
              {error && <div className="form-error" role="alert"><Icon name="x" size={17} /> <span>{error}</span></div>}

              <button className="submit-button" type="submit" disabled={busy}>
                {busy ? "Please wait…" : isRegister ? "Create patient account" : "Sign in securely"}
                {!busy && <Icon name="arrow" size={18} />}
              </button>
            </form>

            <div className="secure-note"><Icon name="shield" size={16} /><span>Your password is securely hashed, never stored as plain text.</span></div>
            <div className="form-bottom">
              <span>{isRegister ? "Already have an account?" : "New to Harbor Health?"}</span>
              <button type="button" onClick={() => switchMode(isRegister ? "login" : "register")}>{isRegister ? "Sign in" : "Create an account"} <Icon name="chevron" size={14} /></button>
            </div>
          </div>
          <div className="mobile-legal">© 2026 Harbor Health · Your health, in good hands.</div>
        </section>
      </div>
    </main>
  );
}

export default App;
