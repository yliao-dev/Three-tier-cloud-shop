import type { User } from "./user";

// Define the shape of the data for login/registration
export interface AuthCredentials {
  email?: string;
  password?: string;
  username?: string;
}

// Define the expected response from the auth endpoints
export interface AuthResponse {
  token: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}
