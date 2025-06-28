import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isRegistering, registerError } = useAuth();

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    register({ username, email, password });
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Create an Account</h2>
        <p className="register-subtext">
          Start your journey with AuraLens today.
        </p>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isRegistering}
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isRegistering}
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isRegistering}
            />
          </div>

          {registerError && (
            <p className="error-message">{registerError.message}</p>
          )}

          <button
            type="submit"
            className="form-button"
            disabled={isRegistering}
          >
            {isRegistering ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
