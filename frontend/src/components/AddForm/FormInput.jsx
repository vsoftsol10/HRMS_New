export default function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  pattern,
  required = true,
  minLength,
  maxLength,
  min,
  max,
  icon: Icon,
  disabled = false,
  error,
}) {
  return (
    <div>
      {label && <label className="block mb-2 font-medium">{label}</label>}

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}

        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          pattern={pattern}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          disabled = {disabled}
          readOnly = {disabled}
          onClick={(e) => {
            if (type === "date") {
              e.target.showPicker?.();
            }
          }}
          onKeyDown={(e) => {
            if (type === "date") {
              e.preventDefault();
            }
          }}
          className={`w-full border rounded-lg ${error ? "border-red-500" : "border-gray-400"} py-3 outline-none shadow-sm focus:ring-2 focus:ring-yellow-400 hover:border-yellow-300 ${
            Icon ? "pl-10 pr-3" : "px-3"
          }
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-yellow-400"}`}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
