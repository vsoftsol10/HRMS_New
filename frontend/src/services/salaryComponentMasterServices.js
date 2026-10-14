import * as crud from "./crudServices";

const RESOURCE = "salary-component-master";

export default {
  getAll: () => crud.getAll(RESOURCE),

  create: (data) => crud.create(RESOURCE, data),

  update: (id, data) => crud.update(RESOURCE, id, data),

  // remove: (id) => crud.remove(RESOURCE, id),
};
