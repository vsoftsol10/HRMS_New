// // auth.js
// //
// // Single place that knows how a login session is stored in the browser.
// // Before this, the emp_* / hr_* / intern_* keys were written in LoginPage,
// // removed in Header and Sidebar, read in api.js and Protectedroutes - and
// // each copy had to be kept in sync by hand.

// import { jwtDecode } from "jwt-decode";

// export const PORTALS = {
//   hr: { token: "hr_token", role: "hr_role", user: "hr_user" },
//   employee: { token: "emp_token", role: "emp_role", user: "employee_user" },
//   intern: { token: "intern_token", role: "intern_role", user: "intern_user" },
// };

// // Older builds wrote the JWT to a generic "token" key that nothing read and
// // that logout never cleared. It is removed on every sign-out / new login.
// const LEGACY_KEYS = ["token"];

// // Which portal a URL belongs to - the same rule the app has always used.
// export const getPortalFromPath = (pathname = window.location.pathname) => {
//   if (pathname.startsWith("/intern")) return "intern";
//   if (pathname.startsWith("/employee")) return "employee";
//   return "hr";
// };

// export const getToken = (portal) =>
//   localStorage.getItem(PORTALS[portal].token);

// export const setSession = (portal, { token, role, employee_code }) => {
//   const keys = PORTALS[portal];

//   localStorage.setItem(keys.token, token);
//   localStorage.setItem(keys.role, role);
//   localStorage.setItem(keys.user, employee_code);
// };

// export const clearSession = (portal) => {
//   const keys = PORTALS[portal];

//   localStorage.removeItem(keys.token);
//   localStorage.removeItem(keys.role);
//   localStorage.removeItem(keys.user);
// };

// export const clearAllSessions = () => {
//   Object.keys(PORTALS).forEach(clearSession);
//   LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
// };

// // Returns the decoded JWT payload for a portal, or null when there is no
// // token, it can't be decoded, or it has expired. A bad/expired token is
// // removed so the user is sent to the login page instead of getting a
// // string of failing requests.
// export const getValidSession = (portal) => {
//   const token = getToken(portal);

//   if (!token) return null;

//   try {
//     const payload = jwtDecode(token);

//     if (payload.exp && payload.exp * 1000 <= Date.now()) {
//       clearSession(portal);
//       return null;
//     }

//     return payload;
//   } catch {
//     clearSession(portal);
//     return null;
//   }
// };

// auth.js
//
// Single place that knows how a login session is stored in the browser.
// Before this, the emp_* / hr_* / intern_* keys were written in LoginPage,
// removed in Header and Sidebar, read in api.js and Protectedroutes - and
// each copy had to be kept in sync by hand.

import { jwtDecode } from "jwt-decode";

export const PORTALS = {
  hr: { token: "hr_token", role: "hr_role", user: "hr_user" },
  employee: { token: "emp_token", role: "emp_role", user: "employee_user" },
  intern: { token: "intern_token", role: "intern_role", user: "intern_user" },
};

// Older builds wrote the JWT to a generic "token" key that nothing read and
// that logout never cleared. It is removed on every sign-out / new login.
const LEGACY_KEYS = ["token"];

// Which portal a URL belongs to - the same rule the app has always used.
export const getPortalFromPath = (pathname = window.location.pathname) => {
  if (pathname.startsWith("/intern")) return "intern";
  if (pathname.startsWith("/employee")) return "employee";
  return "hr";
};

export const getToken = (portal) =>
  localStorage.getItem(PORTALS[portal].token);

export const setSession = (portal, { token, role, employee_code }) => {
  const keys = PORTALS[portal];

  localStorage.setItem(keys.token, token);
  localStorage.setItem(keys.role, role);
  localStorage.setItem(keys.user, employee_code);

  // Drop the old generic "token" key that older builds left behind.
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearSession = (portal) => {
  const keys = PORTALS[portal];

  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.role);
  localStorage.removeItem(keys.user);
};

export const clearAllSessions = () => {
  Object.keys(PORTALS).forEach(clearSession);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

// Returns the decoded JWT payload for a portal, or null when there is no
// token, it can't be decoded, or it has expired. A bad/expired token is
// removed so the user is sent to the login page instead of getting a
// string of failing requests.
export const getValidSession = (portal) => {
  const token = getToken(portal);

  if (!token) return null;

  try {
    const payload = jwtDecode(token);

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearSession(portal);
      return null;
    }

    return payload;
  } catch {
    clearSession(portal);
    return null;
  }
};