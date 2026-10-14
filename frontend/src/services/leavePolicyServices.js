// // services/leavePolicyServices.js

// import * as crud from "./crudServices";

// const RESOURCE = "leave-policy";

// const leavePolicyServices = {
//   getAll: () => crud.getAll(RESOURCE),
//   save: (data) => crud.patch(RESOURCE, data),
// };

// export default leavePolicyServices;

// services/leavePolicyServices.js

import * as crud from "./crudServices";

const RESOURCE = "leave-policy";

const leavePolicyServices = {
  getAll: () => crud.getAll(RESOURCE),
  save: (data) => crud.patch(RESOURCE, data),
};

export default leavePolicyServices;