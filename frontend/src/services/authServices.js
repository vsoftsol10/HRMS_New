// authservices.js
import api from "./api";

// FIX: this used to console.log the full login response and the stored JWT
// (anyone with devtools / a shared console could read the token), and it
// also saved the token under a generic "token" key that nothing reads and
// that logout never removed. The token is stored per portal by the login
// page (utils/auth.js setSession) - nothing is stored or logged here.
export const LoginUser = async (employee_code, password) => {
  const response = await api.post("/auth/login", {
    employee_code,
    password,
  });

  return response.data;
};

export const ForgotPassword = async (employee_code) => {
  const response = await api.post("/auth/forgot-password", {
    employee_code,
  });

  return response.data;
};

export const ResetPassword = async (token, newPassword, confirmPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });

  return response.data;
};