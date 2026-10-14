import * as crud from "./crudServices";

const RESOURCE = "designations";

const designationServices = {
  getAll: (params) => crud.getAll(RESOURCE, params),
  getById: (id) => crud.getById(RESOURCE, id),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
};

export default designationServices;