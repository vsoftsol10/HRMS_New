import { Loader2 } from "lucide-react";

/**
 * Reusable button with a built-in loading state.
 *
 * Usage:
 *   <Button type="submit" loading={loading} loadingText="Creating...">
 *     Create
 *   </Button>
 *
 * - Shows a spinner + `loadingText` while `loading` is true.
 * - Auto-disables itself while loading (and respects an explicit `disabled` prop too),
 *   so the same request can't be fired twice by double-clicking.
 */
export default function Button({
  children,
  loading = false,
  loadingText,
  disabled = false,
  className = "",
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-yellow-500 hover:bg-yellow-400",
    secondary: "bg-gray-100 border border-gray-300 hover:bg-red-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || ""} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? loadingText || children : children}
    </button>
  );
}