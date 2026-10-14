// authmiddleware.js

import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

// Same set the login endpoint accepts (see authController.js).
export const ACTIVE_STATUSES = ["Active", "On Leave"];

// A JWT stays cryptographically valid for 1 day, so on its own it cannot
// notice that someone was deactivated or had their role changed. After the
// signature check we therefore confirm against the database that the
// account is still active and take the CURRENT role from the users table.
//
// To avoid 2 extra queries on every single request, the result is kept
// for 30 seconds, and requests that arrive while the lookup is still running
// (a page fires several API calls at once) share that one lookup. updateEmployee/deleteEmployee call
// invalidateAuthCache() so their changes take effect immediately.
const CACHE_TTL_MS = 30 * 1000;
const authCache = new Map(); // employee_id -> { expires, value }
const inflight = new Map(); // employee_id -> Promise (lookup in progress)

export const invalidateAuthCache = (employeeId) => {
  if (employeeId === undefined || employeeId === null) {
    authCache.clear();
    inflight.clear();
    return;
  }

  authCache.delete(Number(employeeId));
  inflight.delete(Number(employeeId));
};

const fetchAccount = async (employeeId) => {
  const [userResult, employeeResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, employee_id, employee_code, role")
      .eq("employee_id", employeeId)
      .maybeSingle(),
    supabase
      .from("employees")
      .select("id, status")
      .eq("id", employeeId)
      .maybeSingle(),
  ]);

  if (userResult.error) throw userResult.error;
  if (employeeResult.error) throw employeeResult.error;

  return {
    user: userResult.data,
    employee: employeeResult.data,
  };
};

const loadAccount = (decoded) => {
  const key = decoded.employee_id;
  const cached = authCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.value);
  }

  // Several requests for the same user at once -> one lookup, not one each.
  const running = inflight.get(key);

  if (running) {
    return running;
  }

  const lookup = fetchAccount(key)
    .then((value) => {
      // Skip caching if invalidateAuthCache() ran while we were fetching.
      if (inflight.get(key) === lookup) {
        authCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
      }

      return value;
    })
    .finally(() => {
      if (inflight.get(key) === lookup) {
        inflight.delete(key);
      }
    });

  inflight.set(key, lookup);

  return lookup;
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (!decoded?.id || !decoded?.employee_id) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  try {
    const { user, employee } = await loadAccount(decoded);

    if (!user || user.id !== decoded.id || !employee) {
      return res.status(401).json({
        message: "Account no longer exists",
      });
    }

    if (!ACTIVE_STATUSES.includes(employee.status)) {
      return res.status(401).json({
        message: "Your account is inactive. Please contact HR.",
      });
    }

    // Role and code come from the database, not from the (possibly
    // outdated) token, so a role change applies without waiting for the
    // token to expire.
    req.user = {
      ...decoded,
      role: user.role,
      employee_code: user.employee_code,
    };

    next();
  } catch (error) {
    console.error("[authMiddleware] could not verify account:", error?.message || error);

    return res.status(503).json({
      message: "Unable to verify your session right now. Please try again.",
    });
  }
};

export default authMiddleware;