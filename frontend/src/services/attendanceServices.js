import * as crud from "./crudServices";
import axios from "axios";
import api, { API_BASE_URL } from "./api";

const RESOURCE = "attendance";

// FIX (round 2): the first fix (checking emp_token, then intern_token, then
// hr_token) still broke for interns whenever a stale/expired token from an
// earlier HR or Employee session was left in localStorage - emp_token was
// checked first, so that stale token won and the backend rejected it as
// invalid, same symptom as before. Two changes:
// 1. getAuthToken() now mirrors the pathname-based role detection already
//    used in api.js's interceptor, so it picks the token matching whatever
//    portal the user is actually in, not just "whichever key exists first".
// 2. signIn/signOut accept an optional explicit token. They're called
//    immediately after login, before the redirect to /employee or /intern -
//    at that moment the pathname is still /login, so pathname detection
//    can't help. The login page now passes the just-issued token directly,
//    removing the ambiguity entirely for that call.
const getAuthToken = () => {
  const pathname = window.location.pathname;
  const isIntern = pathname.startsWith("/intern");
  const isEmployee = !isIntern && pathname.startsWith("/employee");

  if (isIntern) return localStorage.getItem("intern_token");
  if (isEmployee) return localStorage.getItem("emp_token");
  if (pathname.startsWith("/admin")) return localStorage.getItem("hr_token");

  // Pathname doesn't identify the role (e.g. still on /login) - fall back
  // to whichever token exists. Callers in that situation should prefer
  // passing the token explicitly instead of relying on this branch.
  return (
    localStorage.getItem("emp_token") ||
    localStorage.getItem("intern_token") ||
    localStorage.getItem("hr_token")
  );
};

const attendanceServices = {
  getAll: () => crud.getAll(RESOURCE),

  getFiltered: (params) => crud.getAll(RESOURCE, params),

  getById: (id) => crud.getById(RESOURCE, id),

  create: (data) => crud.create(RESOURCE, data),

  update: (id, data) => crud.update(RESOURCE, id, data),

  remove: (id) => crud.remove(RESOURCE, id),

  // Employee check-in
  signIn: async (explicitToken) => {
    const token = explicitToken || getAuthToken();

    const response = await axios.post(
      `${API_BASE_URL}/attendance/sign-in`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  // Employee check-out
  signOut: async (explicitToken) => {
    const token = explicitToken || getAuthToken();

    const response = await axios.post(
      `${API_BASE_URL}/attendance/sign-out`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  // HR / Admin: enter the real check-out for an auto-closed / missing day.
  fixCheckOut: async (id, checkOut) => {
    const response = await api.put(`/attendance/${id}/check-out`, {
      check_out: checkOut,
    });

    return response.data;
  },
};

export default attendanceServices;