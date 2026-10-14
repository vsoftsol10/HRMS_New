// // services/companySettingsServices.js

// import * as crud from "../services/crudServices.js";

// const RESOURCE = "company-settings";

// const companySettingsServices = {
//   getAll: () => crud.getAll(RESOURCE),
// //   getById: (id) => crud.getById(RESOURCE, id),
//   save: (data) => crud.patch(RESOURCE, data),
// };

// export default companySettingsServices;

// services/companySettingsServices.js

import * as crud from "../services/crudServices.js";

const RESOURCE = "company-settings";

const companySettingsServices = {
  getAll: () => crud.getAll(RESOURCE),
//   getById: (id) => crud.getById(RESOURCE, id),
  save: (data) => crud.patch(RESOURCE, data),
};

export default companySettingsServices;