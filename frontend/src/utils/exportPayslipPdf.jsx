import { pdf } from "@react-pdf/renderer";
import PayslipPDF from "../components/Payroll/PayslipPDF";

export const generatePayslipPDF = async (payroll) => {
  return await pdf(<PayslipPDF payroll={payroll} />).toBlob();
};
