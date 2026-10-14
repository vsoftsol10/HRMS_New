// services/leaveBalanceService.js

import supabase from "../config/supabase.js";

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

/**
 * Initialize leave balance for one employee.
 *
 * If the employee already has a balance for that year,
 * return the existing balance.
 *
 * Otherwise, create it from the current leave policy.
 */
export const initializeLeaveBalance = async (
  employeeId,
  year = getCurrentYear(),
) => {
  // ---------------------------------------------
  // 1. Check existing balance
  // ---------------------------------------------

  const {
    data: existingBalance,
    error: existingError,
  } = await supabase
    .from("leave_balance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("year", year)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  // Already initialized
  if (existingBalance) {
    return existingBalance;
  }

  // ---------------------------------------------
  // 2. Get leave policy
  // ---------------------------------------------

  const {
    data: policy,
    error: policyError,
  } = await supabase
    .from("leave_policy")
    .select("id, casual_leave, sick_leave, earned_leave")
    .limit(1)
    .maybeSingle();

  if (policyError) {
    throw policyError;
  }

  if (!policy) {
    throw new Error(
      "Leave policy has not been configured.",
    );
  }

  // ---------------------------------------------
  // 3. Create employee leave balance
  // ---------------------------------------------

  const {
    data: newBalance,
    error: insertError,
  } = await supabase
    .from("leave_balance")
    .insert({
      employee_id: employeeId,
      casual_leave: Number(policy.casual_leave || 0),
      sick_leave: Number(policy.sick_leave || 0),
      earned_leave: Number(policy.earned_leave || 0),
      lop: 0,
      year,
      // FIX: "updated_at" is @updatedAt in schema.prisma, which Prisma
      // only auto-fills when writes go through Prisma Client. This
      // insert goes through the raw Supabase client instead, and the
      // column is NOT NULL with no DB-level default - so it must be
      // set explicitly or every insert fails with a not-null violation.
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return newBalance;
};
