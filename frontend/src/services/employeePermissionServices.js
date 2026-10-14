// employeePermissionServices.js
import * as crud from "./crudServices";

const RESOURCE = "employee-permissions";

const employeePermissionServices = {
  getAll: () => crud.getAll(RESOURCE),
  create: (data) => crud.create(RESOURCE, data),
};

export default employeePermissionServices;