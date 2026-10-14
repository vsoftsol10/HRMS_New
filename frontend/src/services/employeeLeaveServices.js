// employeeLeaveServices.js
import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "employee-leave";

const leaveServices = {
  getAll: () => crud.getAll(RESOURCE),
  // getById: (id) => crud.getById(RESOURCE, id),

  // FIX: when an attachment file is included, this now sends
  // multipart/form-data (axios sets the correct headers automatically
  // for a FormData body) instead of plain JSON, so the file actually
  // reaches the backend's multer middleware.
  create: (data) => {
    if (!data.attachment) {
      return crud.create(RESOURCE, data);
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return crud.create(RESOURCE, formData);
  },

  getAttachmentUrl: async (id) => {
    const response = await api.get(`/${RESOURCE}/${id}/attachment`);
    return response.data.url;
  },
};

export default leaveServices;