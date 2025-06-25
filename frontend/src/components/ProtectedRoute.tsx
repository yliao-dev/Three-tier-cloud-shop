import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();

  // 1. If the auth state is still loading, render a loading indicator
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // 2. If loading is finished and there is no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished and there is a user, render the page
  return <Outlet />;
};

export default ProtectedRoute;
