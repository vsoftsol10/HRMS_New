// import * as crud from "./crudServices";

// const RESOURCE = "salary-configurations";

// const salaryConfigurationServices = {
//   getAll: () => crud.getAll(RESOURCE),
//   getById: (id) => crud.getById(RESOURCE, id),
//   create: (data) => crud.create(RESOURCE, data),
//   update: (id, data) => crud.update(RESOURCE, id, data),
//   remove: (id) => crud.remove(RESOURCE, id),
// };

// export default salaryConfigurationServices;


import * as crud from "./crudServices";

const RESOURCE = "salary-configurations";

const salaryConfigurationServices = {
  getAll: () => crud.getAll(RESOURCE),
  getById: (id) => crud.getById(RESOURCE, id),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
  // { [configurationId]: number of employees currently assigned }
  getUsageSummary: () => crud.getAll(`${RESOURCE}/usage`),
  // { active_assignments, open_payrolls, locked_payrolls }
  getUsage: (id) => crud.getAll(`${RESOURCE}/${id}/usage`),
};

export default salaryConfigurationServices;