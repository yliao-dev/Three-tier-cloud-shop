import axios from "axios";

// Create an axios instance
const apiClient = axios.create({
  // The base URL will be prefixed to all requests.
  // The Vite proxy will handle forwarding this to the correct service.
  baseURL: "/api",
});

// We can add an interceptor to automatically add the Authorization header
// to every outgoing request if a token exists.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Assuming you store the token in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
