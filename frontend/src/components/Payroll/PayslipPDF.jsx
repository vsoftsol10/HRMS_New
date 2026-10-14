// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// const styles = StyleSheet.create({
//   page: {
//     padding: 25,
//     fontSize: 10,
//     fontFamily: "Helvetica",
//   },

//   topStrip: {
//     height: 8,
//     backgroundColor: "#f4b400",
//     marginBottom: 15,
//   },

//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 15,
//   },

//   leftHeader: {
//     width: "65%",
//   },

//   logo: {
//     fontSize: 32,
//     color: "#f4b400",
//     fontWeight: "bold",
//     marginBottom: 5,
//   },

//   companyName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },

//   companyText: {
//     marginBottom: 2,
//     lineHeight: 1.5,
//   },

//   rightHeader: {
//     alignItems: "flex-end",
//   },

//   payslipTitle: {
//     fontSize: 28,
//     color: "#f4b400",
//     fontWeight: "bold",
//     marginBottom: 15,
//   },

//   payText: {
//     marginBottom: 5,
//   },

//   divider: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#f4b400",
//     marginBottom: 15,
//   },

//   sectionHeader: {
//     backgroundColor: "#f4b400",
//     padding: 8,
//     fontWeight: "bold",
//     fontSize: 12,
//     width: 150,
//     borderTopLeftRadius: 4,
//     borderTopRightRadius: 4,
//   },

//   employeeBox: {
//     borderWidth: 1,
//     borderColor: "#f4b400",
//     padding: 15,
//     marginBottom: 20,
//   },

//   employeeGrid: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },

//   column: {
//     width: "48%",
//   },

//   detailRow: {
//     flexDirection: "row",
//     marginBottom: 10,
//   },

//   label: {
//     width: "50%",
//   },

//   value: {
//     width: "50%",
//   },

//   salaryContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },

//   salaryColumn: {
//     width: "48%",
//   },

//   table: {
//     borderWidth: 1,
//     borderColor: "#f4b400",
//   },

//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: "#fff7df",
//     borderBottomWidth: 1,
//     borderBottomColor: "#f4b400",
//     paddingVertical: 8,
//     fontWeight: "bold",
//   },

//   tableRow: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderBottomColor: "#dddddd",
//     paddingVertical: 8,
//   },

//   description: {
//     width: "65%",
//     paddingHorizontal: 8,
//   },

//   amount: {
//     width: "35%",
//     textAlign: "right",
//     paddingHorizontal: 8,
//   },

//   totalRow: {
//     flexDirection: "row",
//     paddingVertical: 10,
//     backgroundColor: "#fff7df",
//     fontWeight: "bold",
//   },

//   netSalary: {
//     borderWidth: 1,
//     borderColor: "#f4b400",
//     padding: 15,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 25,
//     fontSize: 14,
//     fontWeight: "bold",
//   },

//   footerBox: {
//     borderWidth: 1,
//     borderColor: "#d9d9d9",
//     padding: 15,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },

//   footerLeft: {
//     width: "48%",
//   },

//   footerRight: {
//     width: "48%",
//   },

//   footerTitle: {
//     marginBottom: 4,
//   },

//   bottomStrip: {
//     height: 8,
//     backgroundColor: "#f4b400",
//     marginTop: 20,
//   },
// });

// export default function PayslipPDF({ payroll }) {
//   if (!payroll) return null;

//   const earnings = [
//     {
//       item_name: "Basic Salary",
//       amount: Number(payroll.basic_salary),
//     },
//     ...payroll.payroll_items.filter((item) => item.item_type === "Component"),
//   ];

//   const deductions = payroll.payroll_items.filter(
//     (item) => item.item_type === "Deduction",
//   );

//   const totalEarnings = earnings.reduce(
//     (sum, item) => sum + Number(item.amount),
//     0,
//   );

//   const totalDeductions = deductions.reduce(
//     (sum, item) => sum + Number(item.amount),
//     0,
//   );

//   const netSalary = totalEarnings - totalDeductions;

//   const payrollMonth = new Date(payroll.payroll_month).toLocaleDateString(
//     "en-GB",
//     {
//       month: "long",
//       year: "numeric",
//     },
//   );

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <View style={styles.topStrip} />

//         {/* Header */}

//         <View style={styles.header}>
//           <View style={styles.leftHeader}>
//             <Text style={styles.logo}>vsoft</Text>

//             <Text style={styles.companyName}>VSOFT SOLUTIONS PVT. LTD.</Text>

//             <Text style={styles.companyText}>No.45, Embassy TechVillage</Text>

//             <Text style={styles.companyText}>
//               Bengaluru - 560103, Karnataka
//             </Text>

//             <Text style={styles.companyText}>CIN: U72200KA2010PTC053456</Text>
//           </View>

//           <View style={styles.rightHeader}>
//             <Text style={styles.payslipTitle}>PAYSLIP</Text>

//             <Text style={styles.payText}>Month : {payrollMonth}</Text>

//             <Text style={styles.payText}>
//               Pay Date :
//               {payroll.paid_at
//                 ? new Date(payroll.paid_at).toLocaleDateString("en-GB")
//                 : "-"}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.divider} />

//         {/* Employee Details */}

//         <Text style={styles.sectionHeader}>EMPLOYEE DETAILS</Text>

//         <View style={styles.employeeBox}>
//           <View style={styles.employeeGrid}>
//             <View style={styles.column}>
//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Employee Name</Text>
//                 <Text style={styles.value}>{payroll.employees.first_name}</Text>
//               </View>

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Employee ID</Text>
//                 <Text style={styles.value}>
//                   {payroll.employees.employee_code}
//                 </Text>
//               </View>

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Department</Text>
//                 <Text style={styles.value}>
//                   {payroll.employees.departments.department_name}
//                 </Text>
//               </View>

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Designation</Text>
//                 <Text style={styles.value}>
//                   {payroll.employees.designation}
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.column}>
//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Joining Date</Text>
//                 <Text style={styles.value}>
//                   {payroll.employees.joining_date}
//                 </Text>
//               </View>

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Employment Type</Text>
//                 <Text style={styles.value}>
//                   {payroll.employees.employment_type}
//                 </Text>
//               </View>

//               {/* Optional fields */}

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Location</Text>
//                 <Text style={styles.value}>Bengaluru</Text>
//               </View>

//               <View style={styles.detailRow}>
//                 <Text style={styles.label}>Bank Name</Text>
//                 <Text style={styles.value}>{payroll.bank_name || "-"}</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Earnings + Deductions */}

//         <View style={styles.salaryContainer}>
//           {/* Earnings */}

//           <View style={styles.salaryColumn}>
//             <Text style={styles.sectionHeader}>EARNINGS</Text>

//             <View style={styles.table}>
//               <View style={styles.tableHeader}>
//                 <Text style={styles.description}>DESCRIPTION</Text>
//                 <Text style={styles.amount}>AMOUNT</Text>
//               </View>

//               {earnings.map((item) => (
//                 <View key={item.item_name} style={styles.tableRow}>
//                   <Text style={styles.description}>{item.item_name}</Text>

//                   <Text style={styles.amount}>
//                     ₹{Number(item.amount).toLocaleString()}
//                   </Text>
//                 </View>
//               ))}

//               <View style={styles.totalRow}>
//                 <Text style={styles.description}>TOTAL EARNINGS</Text>

//                 <Text style={styles.amount}>
//                   ₹{totalEarnings.toLocaleString()}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Deductions */}

//           <View style={styles.salaryColumn}>
//             <Text style={styles.sectionHeader}>DEDUCTIONS</Text>

//             <View style={styles.table}>
//               <View style={styles.tableHeader}>
//                 <Text style={styles.description}>DESCRIPTION</Text>
//                 <Text style={styles.amount}>AMOUNT</Text>
//               </View>

//               {deductions.map((item) => (
//                 <View key={item.item_name} style={styles.tableRow}>
//                   <Text style={styles.description}>{item.item_name}</Text>

//                   <Text style={styles.amount}>
//                     ₹{Number(item.amount).toLocaleString()}
//                   </Text>
//                 </View>
//               ))}

//               <View style={styles.totalRow}>
//                 <Text style={styles.description}>TOTAL DEDUCTIONS</Text>

//                 <Text style={styles.amount}>
//                   ₹{totalDeductions.toLocaleString()}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Net Salary */}

//         <View style={styles.netSalary}>
//           <Text>NET SALARY (₹)</Text>

//           <Text>₹ {netSalary.toLocaleString()}</Text>
//         </View>

//         {/* Footer */}

//         <View style={styles.footerBox}>
//           <View style={styles.footerLeft}>
//             <Text style={styles.footerTitle}>
//               This is a system generated payslip.
//             </Text>

//             <Text>No signature is required.</Text>
//           </View>

//           <View style={styles.footerRight}>
//             <Text>For any queries please contact HR/Payroll.</Text>

//             <Text>hr@vsoft.com | +91 80 1234 5678</Text>
//           </View>
//         </View>

//         <View style={styles.bottomStrip} />
//       </Page>
//     </Document>
//   );
// }


import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { resolvePayslipData } from "../../utils/payslipData";

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  topStrip: {
    height: 8,
    backgroundColor: "#f4b400",
    marginBottom: 15,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  leftHeader: {
    width: "65%",
  },

  logo: {
    fontSize: 32,
    color: "#f4b400",
    fontWeight: "bold",
    marginBottom: 5,
  },

  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  companyText: {
    marginBottom: 2,
    lineHeight: 1.5,
  },

  rightHeader: {
    alignItems: "flex-end",
  },

  payslipTitle: {
    fontSize: 28,
    color: "#f4b400",
    fontWeight: "bold",
    marginBottom: 15,
  },

  payText: {
    marginBottom: 5,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f4b400",
    marginBottom: 15,
  },

  sectionHeader: {
    backgroundColor: "#f4b400",
    padding: 8,
    fontWeight: "bold",
    fontSize: 12,
    width: 150,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  employeeBox: {
    borderWidth: 1,
    borderColor: "#f4b400",
    padding: 15,
    marginBottom: 20,
  },

  employeeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  column: {
    width: "48%",
  },

  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  label: {
    width: "50%",
  },

  value: {
    width: "50%",
  },

  salaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  salaryColumn: {
    width: "48%",
  },

  table: {
    borderWidth: 1,
    borderColor: "#f4b400",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fff7df",
    borderBottomWidth: 1,
    borderBottomColor: "#f4b400",
    paddingVertical: 8,
    fontWeight: "bold",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingVertical: 8,
  },

  description: {
    width: "65%",
    paddingHorizontal: 8,
  },

  amount: {
    width: "35%",
    textAlign: "right",
    paddingHorizontal: 8,
  },

  totalRow: {
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: "#fff7df",
    fontWeight: "bold",
  },

  netSalary: {
    borderWidth: 1,
    borderColor: "#f4b400",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    fontSize: 14,
    fontWeight: "bold",
  },

  footerBox: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerLeft: {
    width: "48%",
  },

  footerRight: {
    width: "48%",
  },

  footerTitle: {
    marginBottom: 4,
  },

  bottomStrip: {
    height: 8,
    backgroundColor: "#f4b400",
    marginTop: 20,
  },
});

export default function PayslipPDF({ payroll }) {
  if (!payroll) return null;

  const data = resolvePayslipData(payroll);

  const earnings = data.earnings;
  const deductions = data.deductions;
  const totalEarnings = data.totalEarnings;
  const totalDeductions = data.totalDeductions;
  const netSalary = data.netSalary;

  const payrollMonth = new Date(payroll.payroll_month).toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topStrip} />

        {/* Header */}

        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <Text style={styles.logo}>vsoft</Text>

            <Text style={styles.companyName}>VSOFT SOLUTIONS PVT. LTD.</Text>

            <Text style={styles.companyText}>No.45, Embassy TechVillage</Text>

            <Text style={styles.companyText}>
              Bengaluru - 560103, Karnataka
            </Text>

            <Text style={styles.companyText}>CIN: U72200KA2010PTC053456</Text>
          </View>

          <View style={styles.rightHeader}>
            <Text style={styles.payslipTitle}>PAYSLIP</Text>

            <Text style={styles.payText}>Month : {payrollMonth}</Text>

            <Text style={styles.payText}>
              Pay Date :
              {payroll.paid_at
                ? new Date(payroll.paid_at).toLocaleDateString("en-GB")
                : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Employee Details */}

        <Text style={styles.sectionHeader}>EMPLOYEE DETAILS</Text>

        <View style={styles.employeeBox}>
          <View style={styles.employeeGrid}>
            <View style={styles.column}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Employee Name</Text>
                <Text style={styles.value}>{data.employeeName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Employee ID</Text>
                <Text style={styles.value}>
                  {data.employeeCode}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Department</Text>
                <Text style={styles.value}>
                  {data.department}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Designation</Text>
                <Text style={styles.value}>
                  {data.designation}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Joining Date</Text>
                <Text style={styles.value}>
                  {data.joiningDate}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Employment Type</Text>
                <Text style={styles.value}>
                  {data.employmentType}
                </Text>
              </View>

              {/* Optional fields */}

              <View style={styles.detailRow}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>Bengaluru</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Bank Name</Text>
                <Text style={styles.value}>{payroll.bank_name || "-"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings + Deductions */}

        <View style={styles.salaryContainer}>
          {/* Earnings */}

          <View style={styles.salaryColumn}>
            <Text style={styles.sectionHeader}>EARNINGS</Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.description}>DESCRIPTION</Text>
                <Text style={styles.amount}>AMOUNT</Text>
              </View>

              {earnings.map((item) => (
                <View key={item.item_name} style={styles.tableRow}>
                  <Text style={styles.description}>{item.item_name}</Text>

                  <Text style={styles.amount}>
                    ₹{Number(item.amount).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.description}>TOTAL EARNINGS</Text>

                <Text style={styles.amount}>
                  ₹{totalEarnings.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Deductions */}

          <View style={styles.salaryColumn}>
            <Text style={styles.sectionHeader}>DEDUCTIONS</Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.description}>DESCRIPTION</Text>
                <Text style={styles.amount}>AMOUNT</Text>
              </View>

              {deductions.map((item) => (
                <View key={item.item_name} style={styles.tableRow}>
                  <Text style={styles.description}>{item.item_name}</Text>

                  <Text style={styles.amount}>
                    ₹{Number(item.amount).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.description}>TOTAL DEDUCTIONS</Text>

                <Text style={styles.amount}>
                  ₹{totalDeductions.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Net Salary */}

        <View style={styles.netSalary}>
          <Text>NET SALARY (₹)</Text>

          <Text>₹ {netSalary.toLocaleString()}</Text>
        </View>

        {/* Footer */}

        <View style={styles.footerBox}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTitle}>
              This is a system generated payslip.
            </Text>

            <Text>No signature is required.</Text>
          </View>

          <View style={styles.footerRight}>
            <Text>For any queries please contact HR/Payroll.</Text>

            <Text>hr@vsoft.com | +91 80 1234 5678</Text>
          </View>
        </View>

        <View style={styles.bottomStrip} />
      </Page>
    </Document>
  );
}