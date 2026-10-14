import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";
import { processAttendanceLop } from "../services/attendanceLopService.js";
import { rejectSelfAction } from "../utils/selfActionGuard.js";


// holiday check helper
const isHoliday = async (dateString) => {
  const { data, error } = await supabase
    .from("holidays")
    .select("id, holiday_name, holiday_date")
    .eq("holiday_date", dateString)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

/* =========================================================
   DATE / TIME HELPERS
========================================================= */

/**
 * Get today's date as YYYY-MM-DD using server local time.
 */
const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Get current time as HH:mm:ss using server local time.
 */
const getCurrentTime = () => {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Convert HH:mm or HH:mm:ss to total minutes.
 */
const timeToMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

/**
 * Convert total minutes to HH:mm:ss.
 */
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
};

/**
 * Convert working_hours value to minutes.
 *
 * attendance_policy.working_hours is integer.
 * Example:
 * 8 -> 480 minutes
 */
const workingHoursToMinutes = (workingHours) => {
  const hours = Number(workingHours);

  if (!Number.isFinite(hours) || hours < 0) {
    return null;
  }

  return Math.round(hours * 60);
};

/**
 * Check whether today is a configured weekly off day.
 *
 * weekly_off_days examples:
 * "Saturday, Sunday"
 * "Sunday"
 * "Saturday,Sunday"
 */
const isWeeklyOffDay = (dateString, weeklyOffDays) => {
  if (!weeklyOffDays) return false;

  const date = new Date(`${dateString}T00:00:00`);

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const offDays = String(weeklyOffDays)
    .split(",")
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean);

  return offDays.includes(dayName.toLowerCase());
};

/* =========================================================
   ATTENDANCE POLICY
========================================================= */

/**
 * Get the current attendance policy.
 */
const getAttendancePolicy = async () => {
  const { data: policy, error } = await supabase
    .from("attendance_policy")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!policy) {
    throw new Error("Attendance policy is not configured.");
  }

  return policy;
};

/**
 * Validate attendance policy.
 */
const validateAttendancePolicy = (policy) => {
  if (!policy.office_start_time) {
    throw new Error("Office start time is not configured.");
  }

  if (!policy.office_end_time) {
    throw new Error("Office end time is not configured.");
  }

  if (policy.grace_period === null || policy.grace_period === undefined) {
    throw new Error("Grace period is not configured.");
  }

  if (!policy.half_day_cutoff_time) {
    throw new Error("Half-day cutoff time is not configured.");
  }

  if (policy.working_hours === null || policy.working_hours === undefined) {
    throw new Error("Working hours are not configured.");
  }

  const startMinutes = timeToMinutes(policy.office_start_time);
  const endMinutes = timeToMinutes(policy.office_end_time);
  const cutoffMinutes = timeToMinutes(policy.half_day_cutoff_time);

  if (startMinutes === null) {
    throw new Error("Invalid office start time.");
  }

  if (endMinutes === null) {
    throw new Error("Invalid office end time.");
  }

  if (cutoffMinutes === null) {
    throw new Error("Invalid half-day cutoff time.");
  }

  if (endMinutes <= startMinutes) {
    throw new Error("Office end time must be after office start time.");
  }

  if (Number(policy.grace_period) < 0) {
    throw new Error("Grace period cannot be negative.");
  }

  if (Number(policy.working_hours) <= 0) {
    throw new Error("Working hours must be greater than zero.");
  }
};

/**
 * Calculate check-in status using attendance policy.
 *
 * Rules:
 *
 * before/equal start + grace:
 *   Present
 *
 * after start + grace but before half-day cutoff:
 *   Late
 *
 * at/after half-day cutoff:
 *   Half Day
 */
const calculateCheckInStatus = (currentTime, policy) => {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(policy.office_start_time);
  const cutoffMinutes = timeToMinutes(policy.half_day_cutoff_time);

  const gracePeriod = Number(policy.grace_period);

  const graceEndMinutes = startMinutes + gracePeriod;

  if (currentMinutes >= cutoffMinutes) {
    return "Half Day";
  }

  if (currentMinutes > graceEndMinutes) {
    return "Late";
  }

  return "Present";
};

/**
 * Calculate working hours from check-in and check-out.
 */
const calculateWorkingMinutes = (checkIn, checkOut) => {
  const checkInMinutes = timeToMinutes(checkIn);
  const checkOutMinutes = timeToMinutes(checkOut);

  if (checkInMinutes === null || checkOutMinutes === null) {
    return null;
  }

  let difference = checkOutMinutes - checkInMinutes;

  /*
   * Handles overnight attendance.
   *
   * Example:
   * Check-in 22:00
   * Check-out 06:00
   */
  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
};

/**
 * Calculate final status at check-out.
 *
 * Rules:
 *
 * 1. If check-in was already Half Day -> Half Day
 * 2. If checkout is before half-day cutoff -> Half Day
 * 3. If total working hours are less than policy working hours
 *    -> Half Day
 * 4. Otherwise retain Present/Late.
 */
const calculateCheckOutStatus = ({
  currentStatus,
  checkOut,
  workingMinutes,
  policy,
}) => {
  const cutoffMinutes = timeToMinutes(policy.half_day_cutoff_time);
  const checkOutMinutes = timeToMinutes(checkOut);

  const requiredWorkingMinutes = workingHoursToMinutes(policy.working_hours);

  if (currentStatus === "Half Day") {
    return "Half Day";
  }

  if (checkOutMinutes < cutoffMinutes) {
    return "Half Day";
  }

  if (
    requiredWorkingMinutes !== null &&
    workingMinutes < requiredWorkingMinutes
  ) {
    return "Half Day";
  }

  return currentStatus;
};

/* =========================================================
   GET ATTENDANCE
========================================================= */

export const getAttendance = async (req, res) => {
  try {
    const { date, fromDate, toDate } = req.query;

    const today = getToday();

    let query = supabase.from("attendance").select(`
      id,
      employee_id,
      attendance_date,
      check_in,
      check_out,
      working_hours,
      status,
      leave_processed,
      auto_checkout,
      employees!inner (
        employee_code,
        first_name,
        role,
        departments (
          department_name
        )
      )
    `);

    // No filter → today's attendance
    if (!date && !fromDate && !toDate) {
      query = query.eq("attendance_date", today);
    }

    // Single date
    if (date) {
      query = query.eq("attendance_date", date);
    }

    // From date
    if (fromDate) {
      query = query.gte("attendance_date", fromDate);
    }

    // To date
    if (toDate) {
      query = query.lte("attendance_date", toDate);
    }

    const { data: attendance, error: attendanceError } = await query
      // Interns have their own tab (GET /attendance/interns).
      .neq("employees.role", "Intern")
      .order("attendance_date", { ascending: false })
      .order("check_in", { ascending: true });

    if (attendanceError) {
      throw attendanceError;
    }

    // Today's statistics
    const [
      { count: totalActiveEmployees, error: employeeError },
      { count: presentToday, error: presentError },
      { count: lateArrivals, error: lateError },
      { data: workingHours, error: workingHoursError },
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active")
        .neq("role", "Intern"),

      supabase
        .from("attendance")
        .select("id, employees!inner(role)", { count: "exact", head: true })
        .neq("employees.role", "Intern")
        .eq("attendance_date", today)
        .in("status", ["Present", "Late", "Half Day"]),

      supabase
        .from("attendance")
        .select("id, employees!inner(role)", { count: "exact", head: true })
        .neq("employees.role", "Intern")
        .eq("attendance_date", today)
        .in("status", ["Late", "Half Day"]),

      supabase
        .from("attendance")
        .select("working_hours, employees!inner(role)")
        .neq("employees.role", "Intern")
        .eq("attendance_date", today)
        .not("working_hours", "is", null),
    ]);

    if (employeeError) throw employeeError;
    if (presentError) throw presentError;
    if (lateError) throw lateError;
    if (workingHoursError) throw workingHoursError;

    const totalEmployees = totalActiveEmployees || 0;
    const present = presentToday || 0;

    const absentToday = Math.max(totalEmployees - present, 0);

    // Calculate average working hours
    let avgWorkingHours = "-";

    if (workingHours?.length) {
      let totalMinutes = 0;
      let validRecords = 0;

      for (const record of workingHours) {
        if (!record.working_hours) continue;

        const [hours, minutes] = record.working_hours.split(":").map(Number);

        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
          continue;
        }

        totalMinutes += hours * 60 + minutes;
        validRecords++;
      }

      if (validRecords > 0) {
        const averageMinutes = Math.round(totalMinutes / validRecords);

        const hours = Math.floor(averageMinutes / 60);
        const minutes = averageMinutes % 60;

        avgWorkingHours = `${hours}h ${minutes}m`;
      }
    }

    return res.status(200).json({
      attendance: attendance || [],
      stats: {
        totalEmployees,
        presentToday: present,
        absentToday,
        lateArrivals: lateArrivals || 0,
        avgWorkingHours,
      },
    });
  } catch (err) {
    console.error("Get attendance error:", err);

    return res.status(500).json({
      message: safeErrorMessage(err, "attendanceController"),
    });
  }
};

/* =========================================================
   GET LOGGED-IN EMPLOYEE ATTENDANCE
========================================================= */

export const getEmployeeAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Employee authentication required.",
      });
    }

    // Optional ?month=1-12&year=YYYY so the employee can view past months.
    // Falls back to the current month when missing/invalid.
    const now = new Date();
    const reqMonth = parseInt(req.query.month, 10);
    const reqYear = parseInt(req.query.year, 10);
    const validMonth = reqMonth >= 1 && reqMonth <= 12;
    const validYear = reqYear >= 2000 && reqYear <= 2100;
    const targetYear = validYear ? reqYear : now.getFullYear();
    const targetMonth = validMonth ? reqMonth - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);

    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const { data: attendance, error } = await supabase
      .from("attendance")
      .select(
        `
        id,
        attendance_date,
        check_in,
        check_out,
        working_hours,
        status,
        auto_checkout
      `,
      )
      .eq("employee_id", employeeId)
      .gte("attendance_date", formatDate(startOfMonth))
      .lte("attendance_date", formatDate(endOfMonth))
      .order("attendance_date", { ascending: false });

    if (error) {
      throw error;
    }

    const records = attendance || [];

    const presentDays = records.filter(
      (item) => item.status === "Present",
    ).length;

    const lateDays = records.filter((item) => item.status === "Late").length;

    const halfDays = records.filter(
      (item) => item.status === "Half Day",
    ).length;

    const leaveDays = records.filter((item) => item.status === "Leave").length;

    const absentDays = records.filter(
      (item) => item.status === "Absent",
    ).length;

    /*
     * Half Day counts as 0.5 attendance.
     * Present + Late = 1 day.
     */
    const attendedDays = presentDays + lateDays + halfDays * 0.5;

    const totalRecordedDays =
      presentDays + lateDays + halfDays + absentDays + leaveDays;

    const attendancePercentage =
      totalRecordedDays > 0
        ? Math.round((attendedDays / totalRecordedDays) * 100)
        : 0;

    return res.status(200).json({
      attendance: records,
      stats: {
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        leaveDays,
        attendancePercentage,
      },
    });
  } catch (err) {
    console.error("Get employee attendance error:", err);

    return res.status(500).json({
      message: safeErrorMessage(err, "attendanceController"),
    });
  }
};

/* =========================================================
   EMPLOYEE CHECK-IN
========================================================= */

export const signInAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Employee authentication required.",
      });
    }

    /*
     * Get attendance policy.
     */
    const policy = await getAttendancePolicy();

    validateAttendancePolicy(policy);

   const today = getToday();
   const currentTime = getCurrentTime();

   /*
    * Check weekly off day.
    */
   if (isWeeklyOffDay(today, policy.weekly_off_days)) {
     return res.status(400).json({
       message: `Today is a weekly off day (${policy.weekly_off_days}).`,
       status: "Weekly Off",
     });
   }

   /*
    * Check holiday.
    */
   const holiday = await isHoliday(today);

   if (holiday) {
     return res.status(400).json({
       message: `Today is a holiday: ${holiday.holiday_name}.`,
       status: "Holiday",
       holiday: holiday.holiday_name,
     });
   }

    /*
     * Check existing attendance.
     */
    const { data: existingAttendance, error: existingError } = await supabase
      .from("attendance")
      .select("id, status, check_in, check_out")
      .eq("employee_id", employeeId)
      .eq("attendance_date", today)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    /*
     * FIX: an employee who genuinely checks in late can still be
     * blocked here by a row the evening "processDailyAbsence" job
     * already inserted (e.g. due to timezone drift, or simply
     * running before the employee got online). Previously ANY
     * existing row - including an auto-generated "Absent" with no
     * check_in yet - permanently blocked check-in for the day with
     * no self-service fix. Treat an un-checked-in "Absent" row as
     * correctable: reopen it as a real check-in and reverse the
     * 1-day LOP that was applied for it. Any other existing status
     * (Present, Leave, or an Absent that somehow already has a
     * check_in) still blocks as before.
     */
    const isCorrectableAbsence =
      existingAttendance?.status === "Absent" && !existingAttendance.check_in;

    if (existingAttendance && !isCorrectableAbsence) {
      return res.status(400).json({
        message: "You have already checked in today.",
      });
    }

    /*
     * Calculate status using attendance policy.
     */
    const status = calculateCheckInStatus(currentTime, policy);

    let attendance;

    if (isCorrectableAbsence) {
      const { data: updatedAttendance, error: updateError } = await supabase
        .from("attendance")
        .update({
          check_in: currentTime,
          status,
          leave_processed: false,
          // The Absent row carried lop_days = 1; clear it and let the LOP
          // job recalculate this day from the hours actually worked.
          lop_days: 0,
          lop_processed: false,
        })
        .eq("id", existingAttendance.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      attendance = updatedAttendance;

      // Reverse the 1-day LOP the absence job applied, since the
      // employee has now actually checked in.
      const year = new Date(today).getFullYear();

      const { data: balance, error: balanceError } = await supabase
        .from("leave_balance")
        .select("id, lop")
        .eq("employee_id", employeeId)
        .eq("year", year)
        .maybeSingle();

      if (balanceError) {
        console.error(
          "Failed to look up leave balance while reversing absence LOP:",
          balanceError.message,
        );
      } else if (balance) {
        const revertedLop = Math.max(0, Number(balance.lop || 0) - 1);

        const { error: revertError } = await supabase
          .from("leave_balance")
          .update({
            lop: revertedLop,
            updated_at: new Date().toISOString(),
          })
          .eq("id", balance.id);

        if (revertError) {
          console.error(
            "Failed to reverse absence LOP after late check-in:",
            revertError.message,
          );
        }
      }
    } else {
      /*
       * Insert attendance.
       */
      const { data: insertedAttendance, error: insertError } = await supabase
        .from("attendance")
        .insert({
          employee_id: employeeId,
          attendance_date: today,
          check_in: currentTime,
          status,
          leave_processed: false,
        })
        .select()
        .single();

      if (insertError) {
        /*
         * Unique constraint violation.
         */
        if (insertError.code === "23505") {
          return res.status(400).json({
            message: "You have already checked in today.",
          });
        }

        throw insertError;
      }

      attendance = insertedAttendance;
    }

    return res.status(200).json({
      message: isCorrectableAbsence
        ? "Check In Successful. Your earlier Absent mark for today has been corrected."
        : "Check In Successful",
      attendance: {
        attendance_date: today,
        check_in: currentTime,
        status,
      },
      policy: {
        office_start_time: policy.office_start_time,
        office_end_time: policy.office_end_time,
        grace_period: policy.grace_period,
        half_day_cutoff_time: policy.half_day_cutoff_time,
        working_hours: policy.working_hours,
        weekly_off_days: policy.weekly_off_days,
      },
    });
  } catch (err) {
    console.error("Sign in error:", err);

    return res.status(500).json({
      message: safeErrorMessage(err, "attendanceController"),
    });
  }
};

/* =========================================================
   EMPLOYEE CHECK-OUT
========================================================= */

export const signOutAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(401).json({
        message: "Employee authentication required.",
      });
    }

    /*
     * Get attendance policy.
     */
    const policy = await getAttendancePolicy();

    validateAttendancePolicy(policy);

   const today = getToday();
   const checkOut = getCurrentTime();

   /*
    * Check weekly off.
    */
   if (isWeeklyOffDay(today, policy.weekly_off_days)) {
     return res.status(400).json({
       message: `Today is a weekly off day (${policy.weekly_off_days}).`,
       status: "Weekly Off",
     });
   }

   /*
    * Check holiday.
    */
   const holiday = await isHoliday(today);

   if (holiday) {
     return res.status(400).json({
       message: `Today is a holiday: ${holiday.holiday_name}.`,
       status: "Holiday",
       holiday: holiday.holiday_name,
     });
   }

    /*
     * Get today's attendance.
     */
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("id, check_in, check_out, status")
      .eq("employee_id", employeeId)
      .eq("attendance_date", today)
      .maybeSingle();

    if (attendanceError) {
      throw attendanceError;
    }

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found.",
      });
    }

    if (!attendance.check_in) {
      return res.status(400).json({
        message: "You have not checked in today.",
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        message: "You have already checked out today.",
      });
    }

    /*
     * Calculate actual working time.
     */
    const workingMinutes = calculateWorkingMinutes(
      attendance.check_in,
      checkOut,
    );

    if (workingMinutes === null || workingMinutes < 0) {
      return res.status(400).json({
        message: "Invalid check-in/check-out time.",
      });
    }

    const workingHours = minutesToTime(workingMinutes);

    /*
     * Calculate final status based on policy.
     */
    const status = calculateCheckOutStatus({
      currentStatus: attendance.status,
      checkOut,
      workingMinutes,
      policy,
    });

    /*
     * Update attendance.
     */
    const { data: updatedAttendance, error: updateError } = await supabase
      .from("attendance")
      .update({
        check_out: checkOut,
        working_hours: workingHours,
        status,
      })
      .eq("id", attendance.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: "Check Out Successful",
      attendance: {
        attendance_date: today,
        check_in: attendance.check_in,
        check_out: checkOut,
        working_hours: workingHours,
        status,
      },
      policy: {
        office_start_time: policy.office_start_time,
        office_end_time: policy.office_end_time,
        grace_period: policy.grace_period,
        half_day_cutoff_time: policy.half_day_cutoff_time,
        working_hours: policy.working_hours,
        weekly_off_days: policy.weekly_off_days,
      },
    });
  } catch (err) {
    console.error("Sign out error:", err);

    return res.status(500).json({
      message: safeErrorMessage(err, "attendanceController"),
    });
  }
};


/* =========================================================
   FIX A MISSING / AUTO CHECK-OUT (HR / Admin)

   A day with no check-out is closed automatically at office end time and
   flagged auto_checkout (see jobs/processAutoCheckout.js). Here HR enters
   the real check-out; hours, status and LOP are then worked out and the
   flag is cleared.
========================================================= */

const CHECK_OUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const fixMissingCheckOut = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid attendance id." });
    }

    const rawCheckOut = String(req.body?.check_out ?? "").trim();

    if (!CHECK_OUT_PATTERN.test(rawCheckOut)) {
      return res.status(400).json({
        message: "check_out must be a time like 17:30 (24-hour HH:mm).",
      });
    }

    const checkOut = rawCheckOut.length === 5 ? `${rawCheckOut}:00` : rawCheckOut;

    const { data: row, error: rowError } = await supabase
      .from("attendance")
      .select(
        "id, employee_id, attendance_date, check_in, check_out, status, auto_checkout",
      )
      .eq("id", id)
      .maybeSingle();

    if (rowError) throw rowError;

    if (!row) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    // HR must not correct their own attendance - an Admin has to.
    if (rejectSelfAction(req, res, row.employee_id, "correct your check-out")) {
      return;
    }

    if (!row.check_in) {
      return res.status(400).json({ message: "This record has no check-in." });
    }

    if (row.check_out && !row.auto_checkout) {
      return res.status(409).json({
        message: "This record already has a real check-out.",
      });
    }

    const workingMinutes = calculateWorkingMinutes(row.check_in, checkOut);
    const inMinutes = timeToMinutes(row.check_in);
    const outMinutes = timeToMinutes(checkOut);

    if (workingMinutes === null || outMinutes <= inMinutes) {
      return res.status(400).json({
        message: "Check-out must be later than the check-in time.",
      });
    }

    if (row.attendance_date === getToday() && outMinutes > timeToMinutes(getCurrentTime())) {
      return res.status(400).json({
        message: "Check-out cannot be in the future.",
      });
    }

    const policy = await getAttendancePolicy();

    validateAttendancePolicy(policy);

    const status = calculateCheckOutStatus({
      currentStatus: row.status,
      checkOut,
      workingMinutes,
      policy,
    });

    const { data: updated, error: updateError } = await supabase
      .from("attendance")
      .update({
        check_out: checkOut,
        working_hours: minutesToTime(workingMinutes),
        status,
        auto_checkout: false,
        lop_processed: false,
        lop_days: 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Work out LOP right away instead of waiting for the next scheduler run.
    // Not fatal: the scheduler retries every row that is still unprocessed.
    try {
      const result = await processAttendanceLop(updated);

      if (!result.needsReview) {
        await supabase.from("attendance").update({ lop_processed: true }).eq("id", id);
        updated.lop_processed = true;
      }

      updated.lop_days = result.lopDays;
    } catch (lopError) {
      console.error("[attendance.fixMissingCheckOut] LOP recalculation failed:", lopError.message);
    }

    return res.json({ message: "Check-out updated.", attendance: updated });
  } catch (err) {
    console.error("Fix check-out error:", err);

    return res.status(500).json({
      message: safeErrorMessage(err, "attendanceController"),
    });
  }
};