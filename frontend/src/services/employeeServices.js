import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "employees";

const employeeServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),

  getById: (id) => crud.getById(RESOURCE, id),

  create: (data) => crud.create(RESOURCE, data),

  update: (id, data) => crud.update(RESOURCE, id, data),

  remove: (id) => crud.remove(RESOURCE, id),

  getNextEmployeeCode: async () => {
    const response = await api.get("/employees/next-code");
    return response.data;
  },
};
export default employeeServices;
