import * as crud from "./crudServices";

const RESOURCE = "company-policy";

const companyPolicyServices = {
  getAll: () => crud.getAll(RESOURCE),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
};

export default companyPolicyServices;