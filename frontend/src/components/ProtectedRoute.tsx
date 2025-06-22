import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user } = useAuth();

  // If there is no user, redirect to the /login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the child route component
  // The <Outlet /> is a placeholder for the actual page component
  return <Outlet />;
};

export default ProtectedRoute;
