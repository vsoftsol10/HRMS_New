import * as crud from "./crudServices";

// Same endpoint the employee portal uses; ?month=1-12&year=YYYY picks the month.
const RESOURCE = "attendance/employee";

const internAttendanceServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),
};

export default internAttendanceServices;