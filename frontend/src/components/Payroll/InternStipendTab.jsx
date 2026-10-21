// import { useCallback, useEffect, useMemo, useState } from "react";
// import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

// import internStipendServices from "../../services/internStipendServices";
// import InternStipendSlipModal from "./InternStipendSlipModal";
// import { formatLocalDate } from "../../utils/dateUtils";

// const PAGE_SIZE = 10;

// const STATUS_OPTIONS = ["Paid", "Pending"];

// const STATUS_STYLE = {
//   Paid: "bg-green-100 text-green-700",
//   Pending: "bg-yellow-100 text-yellow-700",
// };

// const currentYearMonth = () => formatLocalDate(new Date()).slice(0, 7);

// const shiftMonth = (yearMonth, step) => {
//   const [year, month] = yearMonth.split("-").map(Number);
//   return formatLocalDate(new Date(year, month - 1 + step, 1)).slice(0, 7);
// };

// const monthLabel = (yearMonth) => {
//   const [year, month] = yearMonth.split("-").map(Number);
//   return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
//     month: "long",
//     year: "numeric",
//   });
// };

// const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

// const controlClass =
//   "h-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-yellow-400";

// export default function InternStipendTab({ departmentOptions = [] }) {
//   const maxMonth = currentYearMonth();

//   const [month, setMonth] = useState(maxMonth);
//   const [filters, setFilters] = useState({
//     search: "",
//     department: "",
//     status: "",
//   });
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState(null);

//   const loadRows = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const data = await internStipendServices.getMonthly(month);
//       setRows(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.log(err);
//       setRows([]);
//       setError(
//         err?.response?.data?.message || "Unable to load intern stipends.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [month]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     loadRows();
//   }, [loadRows]);

//   const filteredRows = useMemo(() => {
//     const search = filters.search.trim().toLowerCase();

//     return rows.filter((row) => {
//       const matchesSearch =
//         !search ||
//         (row.intern_name || "").toLowerCase().includes(search) ||
//         (row.intern_code || "").toLowerCase().includes(search);

//       const matchesDepartment =
//         !filters.department || row.department_name === filters.department;

//       const matchesStatus = !filters.status || row.status === filters.status;

//       return matchesSearch && matchesDepartment && matchesStatus;
//     });
//   }, [rows, filters]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
//   const safePage = Math.min(page, totalPages);
//   const pageRows = filteredRows.slice(
//     (safePage - 1) * PAGE_SIZE,
//     safePage * PAGE_SIZE,
//   );

//   const updateFilter = (key, value) => {
//     setFilters((previous) => ({ ...previous, [key]: value }));
//     setPage(1);
//   };

//   const changeMonth = (value) => {
//     if (!value || value > maxMonth) return;
//     setMonth(value);
//     setPage(1);
//   };

//   const handlePaid = async () => {
//     setSelected(null);
//     await loadRows();
//   };

//   return (
//     <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//       {/* Filters */}
//       <div className="flex flex-wrap items-center gap-3 p-5 border-b border-gray-200">
//         <div className="relative flex-1 min-w-[220px]">
//           <Search
//             size={16}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//           />
//           <input
//             type="text"
//             value={filters.search}
//             onChange={(e) => updateFilter("search", e.target.value)}
//             placeholder="Search interns..."
//             className={`${controlClass} w-full pl-9 pr-3`}
//           />
//         </div>

//         <div className="relative w-52">
//           <select
//             value={filters.department}
//             onChange={(e) => updateFilter("department", e.target.value)}
//             className={`${controlClass} w-full appearance-none pl-3 pr-9 cursor-pointer`}
//           >
//             <option value="">All Departments</option>
//             {departmentOptions.map((name) => (
//               <option key={name} value={name}>
//                 {name}
//               </option>
//             ))}
//           </select>
//           <ChevronDown
//             size={16}
//             className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//           />
//         </div>

//         {/* Month stepper */}
//         <div className={`${controlClass} flex items-center px-1`}>
//           <button
//             type="button"
//             onClick={() => changeMonth(shiftMonth(month, -1))}
//             aria-label="Previous month"
//             className="p-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer"
//           >
//             <ChevronLeft size={16} />
//           </button>

//           <label className="relative flex items-center gap-1.5 px-2 text-sm font-medium cursor-pointer">
//             {monthLabel(month)}
//             <ChevronDown size={14} className="text-gray-500" />
//             <input
//               type="month"
//               value={month}
//               max={maxMonth}
//               onChange={(e) => changeMonth(e.target.value)}
//               onClick={(e) => e.currentTarget.showPicker?.()}
//               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//             />
//           </label>

//           <button
//             type="button"
//             onClick={() => changeMonth(shiftMonth(month, 1))}
//             disabled={month >= maxMonth}
//             aria-label="Next month"
//             className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
//           >
//             <ChevronRight size={16} />
//           </button>
//         </div>

//         <div className="relative w-40">
//           <select
//             value={filters.status}
//             onChange={(e) => updateFilter("status", e.target.value)}
//             className={`${controlClass} w-full appearance-none pl-3 pr-9 cursor-pointer`}
//           >
//             <option value="">All Status</option>
//             {STATUS_OPTIONS.map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <ChevronDown
//             size={16}
//             className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[760px] text-left">
//           <thead className="bg-gray-50">
//             <tr className="text-xs font-medium text-gray-500">
//               <th className="px-5 py-3 whitespace-nowrap">Intern Name</th>
//               <th className="px-5 py-3 whitespace-nowrap">Intern ID</th>
//               <th className="px-5 py-3 whitespace-nowrap">Department</th>
//               <th className="px-5 py-3 whitespace-nowrap">Stipend</th>
//               <th className="px-5 py-3 whitespace-nowrap">Status</th>
//               <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-gray-100">
//             {loading && (
//               <tr>
//                 <td
//                   colSpan={6}
//                   className="px-5 py-10 text-center text-sm text-gray-500"
//                 >
//                   Loading...
//                 </td>
//               </tr>
//             )}

//             {!loading && error && (
//               <tr>
//                 <td
//                   colSpan={6}
//                   className="px-5 py-10 text-center text-sm text-red-600"
//                 >
//                   {error}
//                 </td>
//               </tr>
//             )}

//             {!loading && !error && !pageRows.length && (
//               <tr>
//                 <td
//                   colSpan={6}
//                   className="px-5 py-10 text-center text-sm text-gray-500"
//                 >
//                   No intern stipend records for {monthLabel(month)}.
//                 </td>
//               </tr>
//             )}

//             {!loading &&
//               pageRows.map((row) => (
//                 <tr key={row.intern_id} className="hover:bg-gray-50">
//                   <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
//                     {row.intern_name || "-"}
//                   </td>
//                   <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
//                     {row.intern_code || "-"}
//                   </td>
//                   <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
//                     {row.department_name || "-"}
//                   </td>
//                   <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
//                     {formatAmount(row.amount)}
//                   </td>
//                   <td className="px-5 py-3.5 whitespace-nowrap">
//                     <span
//                       className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
//                         STATUS_STYLE[row.status] || STATUS_STYLE.Pending
//                       }`}
//                     >
//                       {row.status}
//                     </span>
//                   </td>
//                   <td className="px-5 py-3.5 text-right whitespace-nowrap">
//                     <button
//                       type="button"
//                       onClick={() => setSelected(row)}
//                       className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-900 hover:bg-gray-100 cursor-pointer"
//                     >
//                       View Payslip
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination - only when there is more than one page */}
//       {filteredRows.length > PAGE_SIZE && (
//         <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm text-gray-600">
//           <span>
//             {filteredRows.length} interns · Page {safePage} of {totalPages}
//           </span>

//           <div className="flex gap-2">
//             <button
//               type="button"
//               disabled={safePage === 1}
//               onClick={() => setPage(safePage - 1)}
//               className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//             >
//               Previous
//             </button>
//             <button
//               type="button"
//               disabled={safePage === totalPages}
//               onClick={() => setPage(safePage + 1)}
//               className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}

//       {selected && (
//         <InternStipendSlipModal
//           row={selected}
//           onClose={() => setSelected(null)}
//           onPaid={handlePaid}
//         />
//       )}
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import internStipendServices from "../../services/internStipendServices";
import InternStipendSlipModal from "./InternStipendSlipModal";
import { formatLocalDate } from "../../utils/dateUtils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["Paid", "Pending", "Free"];

const STATUS_STYLE = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Free: "bg-gray-100 text-gray-600",
};

const currentYearMonth = () => formatLocalDate(new Date()).slice(0, 7);

const shiftMonth = (yearMonth, step) => {
  const [year, month] = yearMonth.split("-").map(Number);
  return formatLocalDate(new Date(year, month - 1 + step, 1)).slice(0, 7);
};

const monthLabel = (yearMonth) => {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const controlClass =
  "h-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-yellow-400";

export default function InternStipendTab({ departmentOptions = [] }) {
  const maxMonth = currentYearMonth();

  const [month, setMonth] = useState(maxMonth);
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await internStipendServices.getMonthly(month);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      setRows([]);
      setError(
        err?.response?.data?.message || "Unable to load intern stipends.",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        (row.intern_name || "").toLowerCase().includes(search) ||
        (row.intern_code || "").toLowerCase().includes(search);

      const matchesDepartment =
        !filters.department || row.department_name === filters.department;

      const matchesStatus = !filters.status || row.status === filters.status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const changeMonth = (value) => {
    if (!value || value > maxMonth) return;
    setMonth(value);
    setPage(1);
  };

  const handlePaid = async () => {
    setSelected(null);
    await loadRows();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-5 border-b border-gray-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search interns..."
            className={`${controlClass} w-full pl-9 pr-3`}
          />
        </div>

        <div className="relative w-52">
          <select
            value={filters.department}
            onChange={(e) => updateFilter("department", e.target.value)}
            className={`${controlClass} w-full appearance-none pl-3 pr-9 cursor-pointer`}
          >
            <option value="">All Departments</option>
            {departmentOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        {/* Month stepper */}
        <div className={`${controlClass} flex items-center px-1`}>
          <button
            type="button"
            onClick={() => changeMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          <label className="relative flex items-center gap-1.5 px-2 text-sm font-medium cursor-pointer">
            {monthLabel(month)}
            <ChevronDown size={14} className="text-gray-500" />
            <input
              type="month"
              value={month}
              max={maxMonth}
              onChange={(e) => changeMonth(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={() => changeMonth(shiftMonth(month, 1))}
            disabled={month >= maxMonth}
            aria-label="Next month"
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="relative w-40">
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className={`${controlClass} w-full appearance-none pl-3 pr-9 cursor-pointer`}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-medium text-gray-500">
              <th className="px-5 py-3 whitespace-nowrap">Intern Name</th>
              <th className="px-5 py-3 whitespace-nowrap">Intern ID</th>
              <th className="px-5 py-3 whitespace-nowrap">Department</th>
              <th className="px-5 py-3 whitespace-nowrap">Stipend</th>
              <th className="px-5 py-3 whitespace-nowrap">Status</th>
              <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-red-600"
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && !pageRows.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  No intern stipend records for {monthLabel(month)}.
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((row) => (
                <tr key={row.intern_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {row.intern_name || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                    {row.intern_code || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                    {row.department_name || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatAmount(row.amount)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                        STATUS_STYLE[row.status] || STATUS_STYLE.Pending
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {row.status === "Free" ? (
                      <span className="text-xs text-gray-400">No stipend</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-900 hover:bg-gray-100 cursor-pointer"
                      >
                        View Payslip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - only when there is more than one page */}
      {filteredRows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm text-gray-600">
          <span>
            {filteredRows.length} interns · Page {safePage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <InternStipendSlipModal
          row={selected}
          onClose={() => setSelected(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}