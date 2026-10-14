import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

// Walks up the DOM to find the nearest scrollable ancestor (e.g. the modal box)
function getScrollParent(el) {
  let node = el?.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY)) {
      return node;
    }
    node = node.parentElement;
  }
  return null; // falls back to viewport if nothing found
}

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;

    const measure = () => {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;

      // Boundary is the modal's box if there is one, otherwise the viewport
      const scrollParent = getScrollParent(buttonRef.current);
      const boundaryBottom = scrollParent
        ? scrollParent.getBoundingClientRect().bottom
        : window.innerHeight;
      const boundaryTop = scrollParent
        ? scrollParent.getBoundingClientRect().top
        : 0;

      const spaceBelow = boundaryBottom - buttonRect.bottom;
      const spaceAbove = buttonRect.top - boundaryTop;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setCoords({
        top: openUpward ? buttonRect.top - 8 : buttonRect.bottom + 8,
        left: buttonRect.left,
        width: buttonRect.width,
        openUpward,
      });
      setReady(true);
    };

    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) setReady(false);
    setOpen((prev) => !prev);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="block mb-2 font-medium text-gray-800">{label}</label>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between rounded-lg border ${error ? "border-red-500" : "border-gray-400"} bg-white px-4 py-3 shadow-sm hover:border-yellow-400 focus:ring-2 focus:ring-yellow-400`}
      >
        <span>
          {options.find((o) => (o.value || o) === value)?.label ||
            value ||
            placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.openUpward ? undefined : coords.top,
              bottom: coords.openUpward
                ? window.innerHeight - coords.top
                : undefined,
              left: coords.left,
              width: coords.width,
              visibility: ready ? "visible" : "hidden",
            }}
            className="z-50 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-y-auto max-h-64"
          >
            {options.map((option) => {
              const optionValue = option.value || option;
              const optionLabel = option.label || option;
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3
                    ${value === optionValue ? "bg-yellow-100 text-black" : "hover:bg-gray-100"}`}
                >
                  {optionLabel}
                  {value === optionValue && (
                    <Check size={18} className="text-black" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
