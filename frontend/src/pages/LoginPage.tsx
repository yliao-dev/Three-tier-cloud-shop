import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, loginError } = useAuth();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Welcome Back</h2>
        <p className="login-subtext">Please enter your details to sign in.</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoggingIn}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoggingIn}
            />
          </div>

          {loginError && <p className="error-message">{loginError.message}</p>}

          <button type="submit" className="form-button" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
