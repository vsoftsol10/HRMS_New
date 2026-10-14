// import * as crud from "./crudServices";

// const RESOURCE = "employee-payroll";

// const employeePayrollServices = {
//   getAll: () => crud.getAll(RESOURCE),
// };

// export default employeePayrollServices;


import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "employee-payroll";

const employeePayrollServices = {
  getAll: () => crud.getAll(RESOURCE),
  getSixMonthSummary: async () => {
    const response = await api.get(`/${RESOURCE}/six-month-summary`);
    return response.data;
  },
};

export default employeePayrollServices;