import * as crud from "./crudServices";

const RESOURCE = "employee-announcements";

const employeeAnnouncementServices = {
  getAll: () => crud.getAll(RESOURCE),
};

export default employeeAnnouncementServices;
    