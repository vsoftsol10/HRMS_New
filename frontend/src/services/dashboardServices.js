import * as crud from "./crudServices";

const RESOURCE = "dashboard";

const dashboardServices = {
  getAll: () => crud.getAll(RESOURCE),
};

export default dashboardServices;
