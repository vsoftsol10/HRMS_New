import * as crud from "./crudServices";

const RESOURCE = "employee-chart";

const employeeChartServices = {
  getAll: () => crud.getAll(RESOURCE),
};

export default employeeChartServices;
