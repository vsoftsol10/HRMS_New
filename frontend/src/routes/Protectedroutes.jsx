import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getPortalFromPath, getValidSession } from "../utils/auth";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();

  // Picks the token by portal, exactly like every API request does (see
  // services/api.js). getValidSession() also rejects an EXPIRED token - it
  // used to be only decoded, so a dead session still opened the page and
  // then failed on every request.
  const user = getValidSession(getPortalFromPath(location.pathname));

  // There's a single unified login page (see AppsRoutes.jsx), so any
  // unauthenticated visitor just goes to "/" whichever portal they wanted.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}