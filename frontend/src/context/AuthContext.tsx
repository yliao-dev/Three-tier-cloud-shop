import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import apiClient from "../api/client";
import { jwtDecode } from "jwt-decode"; // Import the new library
import type { User } from "../types/user";
import type { AuthContextType } from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // The state now holds a User object or null
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // This effect runs only once on initial component mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode<{ email: string; username: string }>(
          token
        );

        // Map the decoded claims to our User object
        setUser({ email: decodedToken.email, username: decodedToken.username });
        // Set the user state
        // Configure axios with the token
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to decode token on initial load", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token: string) => {
    try {
      // Persist the raw token to localStorage
      localStorage.setItem("token", token);
      // Decode the token to get the user object
      const decodedUser: User = jwtDecode(token);
      // Set the user object in our state
      setUser(decodedUser);
      // Set the default Authorization header for all future axios requests
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } catch (error) {
      console.error("Failed to decode token on login", error);
      // Ensure state is clean if decoding fails
      logout();
    }
  };

  const logout = () => {
    // Clear user state
    setUser(null);
    // Clear token from localStorage
    localStorage.removeItem("token");
    // Remove the default Authorization header
    delete apiClient.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// This custom hook remains the same, but it's now more powerful
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
