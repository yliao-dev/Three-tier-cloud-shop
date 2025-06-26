import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth"; // Import our hook

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Use the hook to get the register function and its state
  const { register, isRegistering, registerError } = useAuth();

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    // Call the mutation from the hook with the form data
    register({ username, email, password });
  };

  return (
    <div className="card">
      <h2>User Registration</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="register-username">Username:</label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isRegistering}
          />
        </div>
        <div>
          <label htmlFor="register-email">Email:</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isRegistering}
          />
        </div>
        <div>
          <label htmlFor="register-password">Password:</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isRegistering}
          />
        </div>
        <button type="submit" disabled={isRegistering}>
          {isRegistering ? "Registering..." : "Register"}
        </button>
      </form>
      {registerError && <p style={{ color: "red" }}>{registerError.message}</p>}
    </div>
  );
};

export default RegisterPage;
