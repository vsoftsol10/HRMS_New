import * as crud from "./crudServices";

const announcementServices = {
  getAll: () => crud.getAll("announcements"),

  create: (data) => crud.create("announcements", data),

  update: (id, data) => crud.update("announcements", id, data),

  remove: (id) => crud.remove("announcements", id),
};

export default announcementServices;