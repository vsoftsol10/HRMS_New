import {
  Briefcase,
  Building2,
  CircleDollarSign,
  Code,
  Cpu,
  Headphones,
  Megaphone,
  MoreVertical,
  Pencil,
  Scale,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef, createElement } from "react";

// Pick the tile icon from the department name; unknown names fall back to a
// building so a new department always renders.
const ICON_RULES = [
  [/design|creative|ui|ux/i, Cpu],
  [/human|^hr\b|people|talent/i, Briefcase],
  [/sales|business|growth/i, TrendingUp],
  [/financ|account|payroll/i, CircleDollarSign],
  [/engineer|develop|tech|software|\bit\b|testing|qa/i, Code],
  [/market|brand|media/i, Megaphone],
  [/support|service|customer/i, Headphones],
  [/legal|compliance/i, Scale],
];

const getDepartmentIcon = (name = "") =>
  ICON_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? Building2;

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase();
};

function CountBox({ label, value }) {
  return (
    <div className="flex-1 rounded-lg border border-gray-200 px-3 py-2">
      <p className="text-[12px] leading-4 font-normal text-gray-500">{label}</p>
      <p className="text-[18px] leading-6 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function DepartmentCard({ department, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const employees = department.employees ?? 0;
  const interns = department.interns ?? 0;
  const totalMembers = employees + interns;
  const head = department.department_head?.trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-yellow-100 text-yellow-500 flex items-center justify-center">
          {createElement(getDepartmentIcon(department.department_name), { size: 18 })}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] leading-6 font-semibold text-gray-900 break-words">
            {department.department_name}
          </h2>
          <p className="text-[12px] leading-4 font-normal text-gray-500">
            {totalMembers} total {totalMembers === 1 ? "member" : "members"}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Department actions"
            onClick={() => setOpen(!open)}
            className="hover:bg-gray-100 p-1 rounded-full text-gray-500 cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded-xl shadow-lg z-10">
              <button
                type="button"
                onClick={() => {
                  onEdit(department.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-[14px] leading-5 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  onDelete(department.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-[14px] leading-5 hover:bg-red-500 hover:text-white rounded-xl cursor-pointer"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-orange-50/60 px-3 py-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-yellow-100 text-yellow-600 text-[12px] leading-4 font-semibold flex items-center justify-center">
          {head ? getInitials(head) : "-"}
        </div>

        <div className="min-w-0">
          <p className="text-[12px] leading-4 font-normal text-gray-500">
            Department Head
          </p>
          <p className="text-[14px] leading-5 font-semibold text-gray-900 truncate">
            {head || "Not assigned"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <CountBox label="Employees" value={employees} />
        <CountBox label="Interns" value={interns} />
      </div>
    </div>
  );
}