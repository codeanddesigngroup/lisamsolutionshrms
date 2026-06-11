// 1. IMPORTING LIBRARIES
// axios: The tool we use to send HTTP requests (GET, POST, etc.) to the backend.
import axios from "axios";
// js-cookie: A helper to read and write browser cookies (where we store the login token).
import Cookies from "js-cookie";
import { normalizeApiPath } from "./api-contract";
// mock-api: Our fake local backend used for testing before the real PHP backend is ready.
import { isMockApiEnabled, mockApiAdapter } from "./mock-api";

// 2. SETTING THE BACKEND URL
// We check if there's a URL set in our environment variables (.env file).
// If not, we default to "http://localhost:8080/api". When your PHP backend is live, you'll change the .env file.
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api";

// 3. CREATING THE API CLIENT
// We create a central "api" object. Instead of writing the URL and headers every time 
// we make a request in our components, we just use this pre-configured object.
const api = axios.create({
  baseURL: API_URL, // All requests will start with this URL
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 5000), // Cancel request if it takes longer than 5 seconds
  adapter: isMockApiEnabled() ? mockApiAdapter : undefined, // Route to fake backend if mock is enabled
  headers: {
    "Content-Type": "application/json", // Tell backend we are sending JSON data
    Accept: "application/json", // Tell backend we expect JSON data back
    "X-Frontend-Client": "nextjs-ui", // Custom header just to identify who is making the request
    "X-Api-Mode": isMockApiEnabled() ? "mock" : "live", // Custom header for debugging
  },
});

// 4. REQUEST INTERCEPTOR (The "Before it leaves" filter)
// This code runs AUTOMATICALLY every single time before a request is sent to the backend.
api.interceptors.request.use((config) => {
  // Cleans up the URL so there are no double slashes (e.g. //api//users becomes /api/users)
  config.url = normalizeApiPath(config.url);

  // Grab the user's login token from their browser cookies
  const token = Cookies.get("token");
  
  // If they are logged in, automatically attach the "Bearer Token" to the request.
  // This proves to the PHP backend that this user is authenticated.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 5. RESPONSE INTERCEPTOR (The "When it comes back" filter)
// This code runs AUTOMATICALLY every time the backend sends a response back to us.
api.interceptors.response.use(
  (response) => response, // If the response is successful (200 OK), just pass it through untouched.
  (error) => {
    // If the backend is completely down or unreachable...
    if (error.message === "Network Error") {
      console.warn(`API Network Error: The PHP backend at ${API_URL} is not reachable.`);
    }

    // IMPORTANT SECURITY RULE:
    // If the backend replies with '401 Unauthorized' (meaning the token expired or is invalid)...
    if (error.response?.status === 401) {
      // 1. Delete all their saved login data
      Cookies.remove("token");
      Cookies.remove("user_role");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("user");
      }
      
      // 2. Kick them out to the login page immediately
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
