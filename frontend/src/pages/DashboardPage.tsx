import { useAuthContext } from "../context/AuthContext";

const DashboardPage = () => {
  // We can safely assume 'user' exists here because the ProtectedRoute
  // component would have redirected if it didn't.
  const { user } = useAuthContext();

  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>This is a protected page.</p>
      <p>
        Welcome, <strong>{user?.email}</strong>!
      </p>
    </div>
  );
};

export default DashboardPage;
