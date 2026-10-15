// import { useLocation } from "react-router-dom";
// import "./index.css";
// import AppRoutes from "./routes/AppsRoutes.jsx";
// import ErrorBoundary from "./components/ErrorBoundary.jsx";

// function App() {
//   const location = useLocation();

//   return (
//     // resetKey: navigating to another page clears a previous crash
//     <ErrorBoundary resetKey={location.pathname}>
//       <AppRoutes />
//     </ErrorBoundary>
//   );
// }

// export default App;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./index.css";
import AppRoutes from "./routes/AppsRoutes.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Browser tab title per portal: HRMS | Admin / HRMS | Employee / HRMS | Intern.
// Login, forgot/reset password and other public pages are just "HRMS".
const PUBLIC_PATHS = ["/", "/login", "/admin/login", "/employee/login", "/forgot-password", "/reset-password"];

const getTitle = (pathname) => {
  if (PUBLIC_PATHS.includes(pathname.replace(/(.)\/+$/, "$1"))) return "HRMS";
  if (pathname.startsWith("/admin")) return "HRMS | Admin";
  if (pathname.startsWith("/employee")) return "HRMS | Employee";
  if (pathname.startsWith("/intern")) return "HRMS | Intern";
  return "HRMS";
};

function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = getTitle(location.pathname);
  }, [location.pathname]);

  return (
    // resetKey: navigating to another page clears a previous crash
    <ErrorBoundary resetKey={location.pathname}>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;