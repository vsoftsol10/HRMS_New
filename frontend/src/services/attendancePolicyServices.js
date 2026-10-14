import * as crud from "./crudServices";

const RESOURCE = "attendance-policy";

const attendancePolicyServices = {
  getAll: () => crud.getAll(RESOURCE),
  save: (data) => crud.patch(RESOURCE, data),
};

export default attendancePolicyServices;