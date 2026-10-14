import * as crud from "./crudServices";

const RESOURCE = "salary-deductions";

const salaryDeductionServices = {
  getAll: () => crud.getAll(RESOURCE),
  getById: (id) => crud.getById(RESOURCE, id),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
};

export default salaryDeductionServices;
