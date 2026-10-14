import * as crud from "./crudServices";

const RESOURCE = "permissions";

const permissionServices = {
  getAll: () => crud.getAll(RESOURCE),
  update: (id, data) => crud.update(RESOURCE, id, data),
};

export default permissionServices;