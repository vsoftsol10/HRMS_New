import * as crud from "./crudServices";

const RESOURCE = "payroll-runs";

const payrollRunServices = {
  getAll: () => crud.getAll(RESOURCE),

  getById: (id) => crud.getById(RESOURCE, id),

  generatePayroll: (data) => crud.create(`${RESOURCE}/generate`, data),
};

export default payrollRunServices;
