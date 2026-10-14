import * as crud from "./crudServices";

const RESOURCE = "notifications";

const notificationServices = {
  getAll: () => crud.getAll(RESOURCE),

  markAsRead: (id) => crud.patch(`${RESOURCE}/${id}/read`),

  markAllAsRead: () => crud.patch(`${RESOURCE}/read-all`),

  remove: (id) => crud.remove(RESOURCE, id),
};

export default notificationServices;