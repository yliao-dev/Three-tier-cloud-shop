import { useAuthContext } from "../context/AuthContext";

const DashboardPage = () => {
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
