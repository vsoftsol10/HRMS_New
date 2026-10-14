/**
 * Payroll redesign test-data seed.
 *
 * NOTE: this uses the Supabase JS client directly, NOT Prisma. All of
 * the payroll redesign's new tables/columns (designations,
 * employee_salary_assignments, salary_configurations.basic_salary,
 * salary_components/salary_deductions.calculation_type, etc.) were
 * added straight to Supabase and are not in prisma/schema.prisma,
 * which was only ever "reconstructed" and has not been re-pulled since.
 * Run this with `node prisma/seedPayroll.js` from the backend root
 * (needs the same SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars
 * server.js uses).
 *
 * This is ADDITIVE ONLY - it creates new employees/structures/
 * attendance rows, never touches existing data. Every row it creates
 * is logged with its id so it can be cleanly deleted afterwards if
 * this was only meant for a one-off test.
 */

import supabase from "../src/config/supabase.js";

async function main() {
  console.log("Seeding payroll test data...\n");

  // ------------------------------------------------------------
  // 1. Employees - two new ones, in different departments, so the
  // whole department/designation/structure chain gets exercised.
  // ------------------------------------------------------------
  const { data: priya, error: priyaError } = await supabase
    .from("employees")
    .insert({
      employee_code: "SEED001",
      first_name: "Priya (seed)",
      role: "Employee",
      status: "Active",
      department_id: 5, // Engineering
      designation_id: 1, // Web developer
      employment_type: "Full-time",
      joining_date: "2026-01-15",
    })
    .select()
    .single();
  if (priyaError) throw priyaError;
  console.log("Created employee:", priya.id, priya.first_name);

  const { data: arun, error: arunError } = await supabase
    .from("employees")
    .insert({
      employee_code: "SEED002",
      first_name: "Arun (seed)",
      role: "Employee",
      status: "Active",
      department_id: 17, // Testing
      designation_id: 2, // Technical
      employment_type: "Full-time",
      joining_date: "2026-02-01",
    })
    .select()
    .single();
  if (arunError) throw arunError;
  console.log("Created employee:", arun.id, arun.first_name);

  // ------------------------------------------------------------
  // 2. Salary structures - one plain (%-of-Basic deduction), one
  // exercising %-of-Gross (deductions only - components can't).
  // ------------------------------------------------------------
  const { data: engStructure, error: engStructureError } = await supabase
    .from("salary_configurations")
    .insert({
      structure_name: "Engineering - Web Developer (seed)",
      department_id: 5,
      designation_id: 1,
      basic_salary: 45000,
      effective_from: "2026-09-01",
    })
    .select()
    .single();
  if (engStructureError) throw engStructureError;
  console.log("Created structure:", engStructure.id, engStructure.structure_name);

  await supabase.from("salary_components").insert([
    {
      salary_configuration_id: engStructure.id,
      component_name: "HRA",
      amount: 20,
      is_included: true,
      calculation_type: "Percentage",
      calc_base: "Basic",
    },
    {
      salary_configuration_id: engStructure.id,
      component_name: "Travel Allowance",
      amount: 2000,
      is_included: true,
      calculation_type: "Fixed",
    },
  ]);

  await supabase.from("salary_deductions").insert([
    {
      salary_configuration_id: engStructure.id,
      deduction_name: "Professional Tax",
      amount: 200,
      is_included: true,
      calculation_type: "Fixed",
    },
    {
      salary_configuration_id: engStructure.id,
      deduction_name: "PF",
      amount: 12,
      is_included: true,
      calculation_type: "Percentage",
      calc_base: "Basic",
    },
  ]);

  const { data: testStructure, error: testStructureError } = await supabase
    .from("salary_configurations")
    .insert({
      structure_name: "Testing - Technical (seed)",
      department_id: 17,
      designation_id: 2,
      basic_salary: 35000,
      effective_from: "2026-09-01",
    })
    .select()
    .single();
  if (testStructureError) throw testStructureError;
  console.log("Created structure:", testStructure.id, testStructure.structure_name);

  await supabase.from("salary_components").insert({
    salary_configuration_id: testStructure.id,
    component_name: "HRA",
    amount: 20,
    is_included: true,
    calculation_type: "Percentage",
    calc_base: "Basic",
  });

  await supabase.from("salary_deductions").insert([
    {
      salary_configuration_id: testStructure.id,
      deduction_name: "Professional Tax",
      amount: 200,
      is_included: true,
      calculation_type: "Fixed",
    },
    {
      // % of GROSS - exercises the branch %-of-Basic deductions don't.
      salary_configuration_id: testStructure.id,
      deduction_name: "PF",
      amount: 12,
      is_included: true,
      calculation_type: "Percentage",
      calc_base: "Gross",
    },
  ]);

  // ------------------------------------------------------------
  // 3. Assignments - Priya on the plain structure, Arun with a Basic
  // override so that branch of calculatePayrollForEmployee is exercised.
  // ------------------------------------------------------------
  await supabase.from("employee_salary_assignments").insert({
    employee_id: priya.id,
    salary_configuration_id: engStructure.id,
    effective_from: "2026-09-01",
  });

  await supabase.from("employee_salary_assignments").insert({
    employee_id: arun.id,
    salary_configuration_id: testStructure.id,
    override_basic_salary: 38000,
    effective_from: "2026-09-01",
  });

  console.log("Created salary assignments for both employees.");

  // ------------------------------------------------------------
  // 4. One more holiday - Optional type, to exercise "Optional counts
  // as non-working too" in the working-days calculation.
  // ------------------------------------------------------------
  await supabase.from("holidays").insert({
    holiday_name: "Founder's Day (seed)",
    holiday_date: "2026-09-15",
    type: "Optional",
  });

  // ------------------------------------------------------------
  // 5. One approved permission for Priya, covering a late arrival on
  // 2026-09-08, to exercise the shortfall-offset branch.
  // ------------------------------------------------------------
  await supabase.from("permissions").insert({
    employee_id: priya.id,
    permission_type: "Late Arrival",
    permission_date: "2026-09-08",
    start_time: "09:00:00",
    end_time: "09:45:00",
    is_half_day: false,
    reason: "Doctor visit (seed)",
    status: "Approved",
    applied_at: new Date().toISOString(),
  });

  // ------------------------------------------------------------
  // 6. Attendance rows for Priya - one for each branch of the LOP
  // formula (office 9:00-18:30, 8h required, 1h grace, 1PM cutoff).
  // ------------------------------------------------------------
  const priyaAttendance = [
    // On-time, full day - no shortfall.
    { date: "2026-09-02", checkIn: "09:05:00", checkOut: "18:00:00", status: "Present" },
    // Late but within grace, stays to close - completes 8h+.
    { date: "2026-09-03", checkIn: "09:50:00", checkOut: "18:30:00", status: "Late" },
    // Late beyond grace, leaves early - real shortfall, no permission.
    { date: "2026-09-04", checkIn: "10:15:00", checkOut: "16:00:00", status: "Late" },
    // Check-in after 1PM cutoff - genuine Half Day.
    { date: "2026-09-07", checkIn: "13:20:00", checkOut: "17:00:00", status: "Half Day" },
    // Late arrival (09:00-09:45 permission window) then completes the
    // rest of the day - shortfall should be fully offset.
    { date: "2026-09-08", checkIn: "09:40:00", checkOut: "17:45:00", status: "Late" },
    // Missing check-out - needs manual review, never silently LOP'd.
    { date: "2026-09-09", checkIn: "09:10:00", checkOut: null, status: "Present" },
  ];

  for (const row of priyaAttendance) {
    await supabase.from("attendance").insert({
      employee_id: priya.id,
      attendance_date: row.date,
      check_in: row.checkIn,
      check_out: row.checkOut,
      status: row.status,
    });
  }

  console.log(`Created ${priyaAttendance.length} attendance rows for Priya.`);

  // A couple of rows for Arun too, so both employees show up in a
  // payroll preview.
  const arunAttendance = [
    { date: "2026-09-02", checkIn: "09:00:00", checkOut: "18:30:00", status: "Present" },
    { date: "2026-09-03", checkIn: "12:30:00", checkOut: "17:00:00", status: "Half Day" },
  ];

  for (const row of arunAttendance) {
    await supabase.from("attendance").insert({
      employee_id: arun.id,
      attendance_date: row.date,
      check_in: row.checkIn,
      check_out: row.checkOut,
      status: row.status,
    });
  }

  console.log(`Created ${arunAttendance.length} attendance rows for Arun.`);

  console.log("\nSeed complete. To remove this test data later, delete:");
  console.log(`- employees id IN (${priya.id}, ${arun.id})`);
  console.log(`- salary_configurations id IN (${engStructure.id}, ${testStructure.id})`);
  console.log("  (their components/deductions/assignments cascade or can be deleted alongside)");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });