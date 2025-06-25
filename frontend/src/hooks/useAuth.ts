import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuthContext } from "../context/AuthContext"; // We will create this next

// Define the shape of the data for login/registration
interface AuthCredentials {
  email?: string;
  password?: string;
  username?: string;
}

// Define the expected response from the auth endpoints
interface AuthResponse {
  token: string;
}

export const useAuth = () => {
  const { login: setTokenInContext } = useAuthContext();
  const navigate = useNavigate();

  // --- Mutation for Login ---
  const loginMutation = useMutation<AuthResponse, Error, AuthCredentials>({
    mutationFn: (credentials: AuthCredentials) => {
      // Use our central apiClient to make the POST request
      return apiClient
        .post("/users/login", credentials)
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      // On success, call the login function from our context to update global state
      setTokenInContext(data.token);
      navigate("/"); // Navigate to the homepage
    },
    // onError will be handled by the component
  });

  // --- Mutation for Registration (Optional but good to have) ---
  const registerMutation = useMutation<AuthResponse, Error, AuthCredentials>({
    mutationFn: (credentials: AuthCredentials) => {
      return apiClient
        .post("/users/register", credentials)
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      setTokenInContext(data.token);
      alert("Registration successful! You are now logged in.");
      navigate("/");
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
  };
};
