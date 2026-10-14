import * as crud from "./crudServices";

const RESOURCE = "employee-dashboard";

const employeeDashboardServices = {
  getAll: () => crud.getAll(RESOURCE),
};

export default employeeDashboardServices;
