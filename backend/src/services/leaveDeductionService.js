import supabase from "../config/supabase.js";
import { initializeLeaveBalance } from "./leaveBalanceService.js";

const leaveTypeToColumn = {
  "Casual Leave": "casual_leave",
  "Sick Leave": "sick_leave",
  "Earned Leave": "earned_leave",
};

/**
 * Deducts leave from the balance. The returned row also carries `lopAdded`
 * - how many of the requested days could NOT be paid from balance and became
 * LOP (all of it for Unpaid Leave, the shortfall for a partly-covered leave,
 * 0 when fully covered). The caller writes it to attendance.lop_days, which
 * is what payroll reads; leave_balance.lop stays as the yearly counter shown
 * on the leave pages.
 */
export const deductLeave = async ({ employeeId, leaveType, days, year }) => {
  // Unpaid Leave directly becomes LOP
  if (leaveType === "Unpaid Leave") {
    const balance = await initializeLeaveBalance(employeeId, year);

    const { data, error } = await supabase
      .from("leave_balance")
      .update({
        lop: Number(balance.lop || 0) + Number(days),
        updated_at: new Date(),
      })
      .eq("id", balance.id)
      .select()
      .single();

    if (error) throw error;

    return { ...data, lopAdded: Number(days) };
  }

  const column = leaveTypeToColumn[leaveType];

  if (!column) {
    throw new Error(`Invalid leave type: ${leaveType}`);
  }

  const balance = await initializeLeaveBalance(employeeId, year);

  const available = Number(balance[column] || 0);
  const requested = Number(days);

  // Leave available enough
  if (available >= requested) {
    const newBalance = available - requested;

    const { data, error } = await supabase
      .from("leave_balance")
      .update({
        [column]: newBalance,
        updated_at: new Date(),
      })
      .eq("id", balance.id)
      .select()
      .single();

    if (error) throw error;

    return { ...data, lopAdded: 0 };
  }

  // Leave partially available
  // Example:
  // Available = 0.5
  // Requested = 1
  // LOP = 0.5
  const remaining = requested - available;

  const { data, error } = await supabase
    .from("leave_balance")
    .update({
      [column]: 0,
      lop: Number(balance.lop || 0) + remaining,
      updated_at: new Date(),
    })
    .eq("id", balance.id)
    .select()
    .single();

  if (error) throw error;

  return { ...data, lopAdded: remaining };
};