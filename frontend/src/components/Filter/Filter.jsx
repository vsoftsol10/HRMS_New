import { Search, X } from "lucide-react";
import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import DateRangePicker from "./DateRangePicker";
import MonthRangePicker from "./MonthRangePicker";

export default function Filters({
  filters,
  setFilters,
  searchPlaceholder = "Search...",
  selects = [],
  showDateRange = false,
  showMonthRange = false,
}) {
  const clearFilters = () => {
    const cleared = {};

    Object.keys(filters).forEach((key) => {
      cleared[key] = "";
    });

    setFilters(cleared);
  };

  const hasFilters = Object.values(filters).some(
    (value) => value !== "" && value !== null && value !== undefined,
  );

  return (
    <div className="p-4 sm:p-5 flex flex-col items-stretch gap-4 border-b border-gray-200 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="w-full flex-1">
        <FormInput
          name="search"
          placeholder={searchPlaceholder}
          value={filters.search}
          required={false}
          icon={Search}
          onChange={(e) =>
            setFilters({
              ...filters,
              search: e.target.value,
            })
          }
        />
      </div>

      {selects.map((select) => (
        <div className="w-full sm:w-64" key={select.key}>
          <CustomSelect
            value={filters[select.key]}
            placeholder={select.placeholder}
            options={select.options}
            onChange={(value) =>
              setFilters({
                ...filters,
                [select.key]: value,
              })
            }
          />
        </div>
      ))}

      {/* Attendance */}
      {showDateRange && (
        <DateRangePicker
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onChange={({ fromDate, toDate }) =>
            setFilters({
              ...filters,
              fromDate,
              toDate,
            })
          }
        />
      )}

      {/* Payroll */}
      {showMonthRange && (
        <MonthRangePicker
          fromMonth={filters.fromMonth}
          toMonth={filters.toMonth}
          onChange={({ fromMonth, toMonth }) =>
            setFilters({
              ...filters,
              fromMonth,
              toMonth,
            })
          }
        />
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-red-500 hover:bg-red-600"
        >
          <X size={23} />
        </button>
      )}
    </div>
  );
}
