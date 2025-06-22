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
  isLoading: boolean; // Add isLoading state
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize isLoading to true

  useEffect(() => {
    setIsLoading(true); // Start loading when token changes
    if (token) {
      try {
        const decoded: { sub: string } = jwtDecode(token);
        setUser({ email: decoded.sub });
        localStorage.setItem("authToken", token);
      } catch (error) {
        setToken(null);
        setUser(null);
        localStorage.removeItem("authToken");
      }
    } else {
      setUser(null);
      localStorage.removeItem("authToken");
    }
    setIsLoading(false); // Finish loading after checking token
  }, [token]);

  // ... (login and logout functions remain the same)
  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
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

export default AuthProvider;
