import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!employeeId.trim() || !password) {
      setError("Please enter both Employee ID and password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(employeeId.trim(), password);
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === "admin" ? "/admin" : "/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          (err.response.data as { error?: string })?.error ||
            "Invalid Employee ID or password."
        );
      } else {
        setError("Unable to reach the server. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home">
      <div className="login-page">
        <form className="login-card" onSubmit={handleSubmit}>
          <img src="/sail_logo.png" alt="SAIL logo" className="login-logo" />
          <h1 className="login-title">SAIL VRS Portal</h1>
          <p className="login-subtitle">
            Sign in with your Employee ID and password
          </p>

          {error && <div className="error-box" style={{ width: "100%", margin: "12px 0" }}>{error}</div>}

          <label className="field-label" htmlFor="employeeId">
            Employee ID
          </label>
          <input
            id="employeeId"
            name="employeeId"
            placeholder="e.g. EMP001"
            autoComplete="username"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="button" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>

          <p className="login-footnote">
            Forgot your password? Contact the HR department / Employee Help
            Desk. <Link to="/">← Back to Home</Link>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
