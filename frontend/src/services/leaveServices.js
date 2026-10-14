import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "leaves";

const leaveServices = {
  getAll: () => crud.getAll(RESOURCE),
  // getById: (id) => crud.getById(RESOURCE, id),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
  // Reuses the employee-leave attachment endpoint - it's role-aware on
  // the backend (Admin/HR can view any request's attachment).
  getAttachmentUrl: async (id) => {
    const response = await api.get(`/employee-leave/${id}/attachment`);
    return response.data.url;
  },
};

export default leaveServices;
