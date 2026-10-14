import { useLocation } from "react-router-dom";
import "./index.css";
import AppRoutes from "./routes/AppsRoutes.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

function App() {
  const location = useLocation();

  return (
    // resetKey: navigating to another page clears a previous crash
    <ErrorBoundary resetKey={location.pathname}>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;