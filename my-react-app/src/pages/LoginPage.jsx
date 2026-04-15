import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import logoVar1Big from "@/assets/images/logoVar1Big.png";
import gradientBg from "@/assets/images/gradientbg.jpg";
import "./Login.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const me = await login(email, password);
      navigate(me.role === "admin" ? "/admin/dashboard" : "/clerk/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-shell" style={{ backgroundImage: `url(${gradientBg})` }}>
      <div className="login-overlay">

        {/* ── Left branding panel ── */}
        <div className="login-left">
          <div className="login-left-brand">
            <img src={logoVar1Big} alt="Inventory Assist" className="login-left-logo" />
            <span className="login-left-name">Inventory Assist</span>
          </div>
          <h2 className="login-left-headline">Smart, Simple Inventory Management</h2>
          <p className="login-left-sub">
            Track stock, manage suppliers, and stay on top of every order, all in one place.
          </p>
        </div>

        {/* ── Right form card ── */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <h1 className="login-title">Sign In</h1>
              <p className="login-subtitle">Welcome back, enter your credentials to continue</p>
            </div>

            <div className="login-card-body">
              {error && (
                <div className="login-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-message">{error}</span>
                </div>
              )}

              <div className="login-input-group">
                <label className="login-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="login-input"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  disabled={isLoading}
                />
              </div>

              <div className="login-input-group">
                <label className="login-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="login-input"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
              </div>

              <button className="login-signin-btn" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Signing in…" : "Sign In"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
