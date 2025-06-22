import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  token: string | null;
  user: { email: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: { sub: string } = jwtDecode(token);
        setUser({ email: decoded.sub });
        localStorage.setItem("authToken", token);
      } catch (error) {
        // Handle cases where token is invalid or expired on load
        setToken(null);
        setUser(null);
        localStorage.removeItem("authToken");
      }
    } else {
      setUser(null);
      localStorage.removeItem("authToken");
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Default export for the AuthProvider component
export default AuthProvider;
