// import * as crud from "./crudServices";
// import api from "./api";

// const RESOURCE = "certificates";

// const certificateServices = {
//   getAll: (params = {}) => crud.getAll(RESOURCE, params),

//   getById: (id) => crud.getById(RESOURCE, id),

//   // { organization_name, authorized_person, certificate_types }
//   getMeta: async () => {
//     const response = await api.get(`/${RESOURCE}/meta`);
//     return response.data;
//   },

//   // Saves a Draft when the wizard reaches the preview step.
//   create: (data) => crud.create(RESOURCE, data),

//   update: (id, data) => crud.update(RESOURCE, id, data),

//   // The PDF was downloaded: Draft -> Issued.
//   markIssued: async (id) => {
//     const response = await api.post(`/${RESOURCE}/${id}/issue`);
//     return response.data;
//   },

//   // Emails the generated PDF to the intern: -> Sent.
//   send: async (id, pdfBlob, fileName) => {
//     const formData = new FormData();
//     formData.append("file", pdfBlob, fileName);

//     const response = await api.post(`/${RESOURCE}/${id}/send`, formData);
//     return response.data;
//   },

//   // Uploaded (custom) templates, each with a short-lived signed `url`.
//   getTemplates: async () => {
//     const response = await api.get(`/${RESOURCE}/templates`);
//     return response.data;
//   },

//   uploadTemplate: async (file) => {
//     const formData = new FormData();
//     formData.append("file", file);

//     const response = await api.post(`/${RESOURCE}/templates`, formData);
//     return response.data;
//   },
// };

// export default certificateServices;

import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "certificates";

const certificateServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),

  getById: (id) => crud.getById(RESOURCE, id),

  // { organization_name, authorized_person, certificate_types }
  getMeta: async () => {
    const response = await api.get(`/${RESOURCE}/meta`);
    return response.data;
  },

  // Saves a Draft when the wizard reaches the preview step.
  create: (data) => crud.create(RESOURCE, data),

  update: (id, data) => crud.update(RESOURCE, id, data),

  // The PDF was downloaded: Draft -> Issued.
  markIssued: async (id) => {
    const response = await api.post(`/${RESOURCE}/${id}/issue`);
    return response.data;
  },

  // Emails the generated PDF to the intern: -> Sent.
  send: async (id, pdfBlob, fileName) => {
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);

    const response = await api.post(`/${RESOURCE}/${id}/send`, formData);
    return response.data;
  },

  // Uploaded (custom) templates, each with a short-lived signed `url`.
  getTemplates: async () => {
    const response = await api.get(`/${RESOURCE}/templates`);
    return response.data;
  },

  uploadTemplate: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/${RESOURCE}/templates`, formData);
    return response.data;
  },

  // Rename an uploaded template.
  updateTemplate: async (id, name) => {
    const response = await api.put(`/${RESOURCE}/templates/${id}`, { name });
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await api.delete(`/${RESOURCE}/templates/${id}`);
    return response.data;
  },
};

export default certificateServices;