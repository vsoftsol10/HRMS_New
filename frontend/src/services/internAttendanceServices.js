import * as crud from "./crudServices";

// Same endpoint the employee portal uses; ?month=YYYY-MM picks the month.
const RESOURCE = "attendance/employee";

const internAttendanceServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),
};

export default internAttendanceServices;