import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import logoVar1Big from "../../assets/images/logoVar1Big.png";
import "./Login.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Predefined valid users
  const validUsers = {
    admin: {
      email: "kevin@admin.com",
      password: "admin123", // In production, use proper hashing and backend validation
      name: "Kevin",
      role: "admin"
    },
    clerk: {
      email: "cj@clerk.com",
      password: "clerk123",
      name: "Cj Obi",
      role: "clerk"
    }
  };

  const validateCredentials = (email, password, expectedRole) => {
    const user = validUsers[expectedRole];
    if (!user) return false;

    return user.email === email.toLowerCase().trim() && user.password === password;
  };

  const getRoleFromEmail = (inputEmail) => {
    const normalizedEmail = inputEmail.toLowerCase().trim();
    if (normalizedEmail === validUsers.admin.email) return "admin";
    if (normalizedEmail === validUsers.clerk.email) return "clerk";
    return null;
  };

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const role = getRoleFromEmail(email);
      const userEmail = email;
      const userPassword = password;

      if (!role) {
        setError("Email is not recognized");
        setIsLoading(false);
        return;
      }

      // Validate credentials
      if (!validateCredentials(userEmail, userPassword, role)) {
        setError(`Invalid credentials for ${role === "admin" ? "Admin" : "Clerk"} access`);
        setIsLoading(false);
        return;
      }

      // Get user data
      const userData = validUsers[role];

      // Login successful
      login(userData.email, userPassword);

      navigate(role === "admin" ? "/admin/dashboard" : "/clerk/dashboard");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-brand">
            <img src={logoVar1Big} alt="Inventory Assist logo" className="login-logo" />
            <h1 className="login-title">Inventory Assist</h1>
          </div>
          <p className="login-subtitle">Inventory made simple</p>
        </div>

        <div className="login-card-content">
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>

          <button
            className="login-signin-btn"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
