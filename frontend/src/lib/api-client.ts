import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-only cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to catch unauthorized errors and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect if unauthorized
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
