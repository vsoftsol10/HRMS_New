import * as crud from "./crudServices";

const RESOURCE = "attendance-chart";

const attendanceChartServices = {
  getAll: () => crud.getAll(RESOURCE),
};

export default attendanceChartServices;
