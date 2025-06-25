import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Use the hook to get the login function and loading/error states
  const { login, isLoggingIn, loginError } = useAuth();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // Call the login mutation from the hook
    login({ email, password });
  };

  return (
    <div className="card">
      <h2>User Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="login-email">Email:</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoggingIn} // Disable form while logging in
          />
        </div>
        <div>
          <label htmlFor="login-password">Password:</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoggingIn}
          />
        </div>
        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login"}
        </button>
      </form>
      {loginError && <p style={{ color: "red" }}>{loginError.message}</p>}
    </div>
  );
};

export default LoginPage;
