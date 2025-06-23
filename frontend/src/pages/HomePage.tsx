import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  // 1. Get the current user and logout function from the global AuthContext
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome to the Cloud Shop</h1>

      {/* Main navigation available to everyone */}
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Link to="/products">View Products</Link>
      </nav>

      <hr />

      {/* 2. Use a ternary operator to render content conditionally */}
      {user ? (
        // This view is shown IF a user is logged in
        <div>
          <p>
            You are logged in as: <strong>{user.email}</strong>
          </p>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/cart">View Cart</Link> {/* Add this link */}
            <button onClick={logout}>Logout</button>
          </nav>
        </div>
      ) : (
        // This view is shown IF there is no user
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </nav>
      )}
    </div>
  );
};

export default HomePage;
