import axios from "axios";
import {
  getPortalFromPath,
  getToken,
  clearSession,
} from "../utils/auth";

// FIX: the base URL was hard-coded to localhost, so the app could not be
// pointed at a deployed backend. VITE_API_BASE_URL (already defined in the
// project's .env) is used when present; localhost stays as the fallback.
// The localhost fallback is for `npm run dev` only: a production build without
// VITE_API_BASE_URL is refused by vite.config.js, so a deployed app can never
// silently talk to localhost.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken(getPortalFromPath());

  // an explicitly supplied Authorization header wins over the stored one
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// FIX: when the token expired (1 day) - or the account was deactivated -
// every request kept failing with 401 and the user stayed on a broken
// page. A 401 now ends the session and returns to the login page once.
//
// Login / forgot / reset legitimately answer 401 or 400 for bad input, so
// they are excluded, and nothing happens while already on a public page.
const AUTH_ENDPOINTS = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/admin/login",
  "/employee/login",
  "/forgot-password",
  "/reset-password",
];

let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

    if (
      error.response?.status === 401 &&
      !isAuthCall &&
      !redirectingToLogin &&
      !PUBLIC_PATHS.includes(window.location.pathname)
    ) {
      redirectingToLogin = true;
      // Only the portal that made this request is signed out. Wiping every
      // portal made a 401 in one tab log out the other roles too.
      clearSession(getPortalFromPath());
      window.location.replace("/");
    }

    return Promise.reject(error);
  },
);

export default api;