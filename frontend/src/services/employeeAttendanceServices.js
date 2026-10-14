// import * as crud from "./crudServices";

// const RESOURCE = "attendance/employee";

// const employeeAttendanceServices = {
//   getAll: () => crud.getAll(RESOURCE),
// };

// export default employeeAttendanceServices;


import * as crud from "./crudServices";

const RESOURCE = "attendance/employee";

const employeeAttendanceServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),
};

export default employeeAttendanceServices;