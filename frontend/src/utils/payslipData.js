/**
 * Resolve the data a payslip should display for one payroll row.
 *
 * Finalized/Paid payroll created by the new lifecycle (Step 6) carries a
 * frozen `snapshot` - department, designation, structure name, the
 * component/deduction breakdown, and the attendance summary at the time
 * it was finalized. Payslips must read from THIS, not from the live
 * employee/department/designation records, so a payslip never changes
 * retroactively if the employee later moves department or their
 * designation is renamed.
 *
 * Payroll rows created before this redesign (or any row somehow missing
 * a snapshot) have no snapshot - those fall back to the old live-join
 * shape, exactly as PayslipTemplate/PayslipPDF read it before.
 */
export const resolvePayslipData = (payroll) => {
  if (payroll.snapshot) {
    const { snapshot } = payroll;

    const earnings = [
      { item_name: "Basic Salary", amount: Number(snapshot.basicSalary) },
      ...(snapshot.components || []).map((item) => ({
        item_name: item.name,
        amount: Number(item.amount),
      })),
    ];

    const deductions = (snapshot.deductionItems || []).map((item) => ({
      item_name: item.name,
      amount: Number(item.amount),
    }));

    return {
      employeeName: payroll.employees?.first_name,
      employeeCode: payroll.employees?.employee_code,
      department: snapshot.department,
      designation: snapshot.designation,
      joiningDate: payroll.employees?.joining_date,
      employmentType: payroll.employees?.employment_type,
      earnings,
      deductions,
      totalEarnings: Number(snapshot.grossSalary),
      totalDeductions: Number(snapshot.deductions),
      netSalary: Number(snapshot.netSalary),
      isLegacy: false,
    };
  }

  // ------------------------------------------------------------
  // Legacy fallback - no snapshot, read live-joined data as before.
  // ------------------------------------------------------------
  const earnings = [
    { item_name: "Basic Salary", amount: Number(payroll.basic_salary) },
    ...(payroll.payroll_items || []).filter(
      (item) => item.item_type === "Component",
    ),
  ];

  const deductions = (payroll.payroll_items || []).filter(
    (item) => item.item_type === "Deduction",
  );

  const totalEarnings = earnings.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const totalDeductions = deductions.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  return {
    employeeName: payroll.employees?.first_name,
    employeeCode: payroll.employees?.employee_code,
    department: payroll.employees?.departments?.department_name,
    designation: payroll.employees?.designation,
    joiningDate: payroll.employees?.joining_date,
    employmentType: payroll.employees?.employment_type,
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions,
    isLegacy: true,
  };
};