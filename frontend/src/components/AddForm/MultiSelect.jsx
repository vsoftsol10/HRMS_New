// import { useState, useRef, useEffect } from "react";
// import { ChevronDown } from "lucide-react";

// export default function MultiSelect({ label, options, value, onChange, error }) {
//   // `value` should always be an array, but callers may pass whatever an
//   // announcement's `department` field actually holds in the DB (null, a
//   // single id, or an array) - normalize here so this component can never
//   // crash on `.join`/`.includes`/`.filter` regardless of what's passed in.
//   const safeValue = Array.isArray(value) ? value : value != null ? [value] : [];

//   const [open, setOpen] = useState(false);
//   const [openUpward, setOpenUpward] = useState(false);

//   const buttonRef = useRef(null);
//   const multiSelectRef = useRef(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         multiSelectRef.current &&
//         !multiSelectRef.current.contains(e.target)
//       ) {
//         setOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const handleSelect = (selectedValue) => {
//     if (selectedValue === "All") {
//       onChange(["All"]);
//       return;
//     }

//     const filteredValues = safeValue.filter((item) => item !== "All");

//     if (filteredValues.includes(selectedValue)) {
//       onChange(filteredValues.filter((item) => item !== selectedValue));
//     } else {
//       onChange([...filteredValues, selectedValue]);
//     }
//   };
  
//   const handleOpen = () => {
//     if (!open && buttonRef.current) {
//       const rect = buttonRef.current.getBoundingClientRect();

//       const dropdownHeight = 220;
//       const spaceBelow = window.innerHeight - rect.bottom;

//       setOpenUpward(spaceBelow < dropdownHeight);
//     }

//     setOpen(!open);
//   };

//   return (
//     <div className="relative" ref={multiSelectRef}>
//       <label className="block text-xl font-medium mb-2">{label}</label>

//       <button
//         ref={buttonRef}
//         type="button"
//         onClick={handleOpen}
//         className={`w-full border ${error ? "border-red-500" : "border-gray-400"} rounded-xl px-4 py-3 flex justify-between items-center`}
//       >
//         <span>{safeValue.length ? safeValue.join(", ") : "Select Departments"}</span>
//         <ChevronDown size={18} />
//       </button>

//       {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

//       {open && (
//         <div
//           className={`
//             absolute w-full bg-white border border-gray-400
//             rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto
//             ${openUpward ? "bottom-full mb-2" : "top-full mt-2"}
//           `}
//         >
//           {options.map((option) => (
//             <label
//               key={option.value}
//               className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100"
//             >
//               <input
//                 type="checkbox"
//                 checked={safeValue.includes(option.value)}
//                 onChange={() => handleSelect(option.value)}
//               />

//               {option.label}
//             </label>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// independentValues: options that can be ticked together with "All" (e.g. the
// announcement form's "Interns"). Picking "All" or a single department still
// works exactly as before.
export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  error,
  independentValues = [],
}) {
  // `value` should always be an array, but callers may pass whatever an
  // announcement's `department` field actually holds in the DB (null, a
  // single id, or an array) - normalize here so this component can never
  // crash on `.join`/`.includes`/`.filter` regardless of what's passed in.
  const safeValue = Array.isArray(value) ? value : value != null ? [value] : [];

  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const buttonRef = useRef(null);
  const multiSelectRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        multiSelectRef.current &&
        !multiSelectRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (selectedValue) => {
    const keptIndependent = safeValue.filter((item) =>
      independentValues.includes(item),
    );

    if (selectedValue === "All") {
      onChange(["All", ...keptIndependent]);
      return;
    }

    // An independent option toggles on its own and leaves "All" alone.
    if (independentValues.includes(selectedValue)) {
      onChange(
        safeValue.includes(selectedValue)
          ? safeValue.filter((item) => item !== selectedValue)
          : [...safeValue, selectedValue],
      );
      return;
    }

    const filteredValues = safeValue.filter((item) => item !== "All");

    if (filteredValues.includes(selectedValue)) {
      onChange(filteredValues.filter((item) => item !== selectedValue));
    } else {
      onChange([...filteredValues, selectedValue]);
    }
  };
  
  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      const dropdownHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;

      setOpenUpward(spaceBelow < dropdownHeight);
    }

    setOpen(!open);
  };

  return (
    <div className="relative" ref={multiSelectRef}>
      <label className="block text-xl font-medium mb-2">{label}</label>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`w-full border ${error ? "border-red-500" : "border-gray-400"} rounded-xl px-4 py-3 flex justify-between items-center`}
      >
        <span>
          {safeValue.length
            ? safeValue
                .map(
                  (item) =>
                    options.find((option) => option.value === item)?.label ??
                    item,
                )
                .join(", ")
            : "Select Departments"}
        </span>
        <ChevronDown size={18} />
      </button>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {open && (
        <div
          className={`
            absolute w-full bg-white border border-gray-400
            rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto
            ${openUpward ? "bottom-full mb-2" : "top-full mt-2"}
          `}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={safeValue.includes(option.value)}
                onChange={() => handleSelect(option.value)}
              />

              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}