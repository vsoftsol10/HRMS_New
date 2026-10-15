import { Loader2 } from "lucide-react";

/**
 * Centered loading indicator.
 * Fills the available area and centers a spinner + label in it, so loading
 * states no longer sit in the top-left corner of the page.
 */
export default function PageLoader({
  text = "Loading...",
  className = "",
  fullScreen = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-gray-500 w-full ${
        fullScreen ? "min-h-screen bg-gray-50" : "min-h-[60vh]"
      } ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
}