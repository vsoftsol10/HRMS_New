// import * as crud from "./crudServices";
// import api from "./api";

// const RESOURCE = "interns";

// const internServices = {
//   getAll: (params = {}) => crud.getAll(RESOURCE, params),

//   getById: async (id) => {
//     const response = await api.get(`/${RESOURCE}/${id}`);
//     return response.data;
//   },

//   // What the Add Intern form pre-fills: { login_id, intern_code }
//   getNextCodes: async () => {
//     const response = await api.get(`/${RESOURCE}/next-codes`);
//     return response.data;
//   },

//   // Sent as multipart/form-data so documents can travel with the form.
//   // `documents` is [{ file, doc_type }, ...]; the backend receives the files
//   // plus a JSON array of their types in the same order.
//   create: ({ documents = [], ...fields }) => {
//     const formData = new FormData();

//     Object.entries(fields).forEach(([key, value]) => {
//       if (value !== undefined && value !== null) {
//         formData.append(key, value);
//       }
//     });

//     documents.forEach((document) => formData.append("documents", document.file));
//     formData.append(
//       "document_types",
//       JSON.stringify(documents.map((document) => document.doc_type)),
//     );

//     return crud.create(RESOURCE, formData);
//   },

//   update: (id, data) => crud.update(RESOURCE, id, data),

//   // Soft delete on the backend - the login is blocked, records are kept.
//   remove: (id) => crud.remove(RESOURCE, id),

//   uploadDocument: async (id, file, docType) => {
//     const formData = new FormData();
//     formData.append("document", file);
//     formData.append("doc_type", docType);

//     const response = await api.post(`/${RESOURCE}/${id}/documents`, formData);
//     return response.data;
//   },

//   // The bucket is private: this returns a short-lived signed URL.
//   getDocumentUrl: async (id, documentId, { download = false } = {}) => {
//     const response = await api.get(
//       `/${RESOURCE}/${id}/documents/${documentId}/url`,
//       { params: download ? { download: 1 } : {} },
//     );
//     return response.data.url;
//   },

//   // Read-only task list for HR (mentors create tasks from the Employee portal).
//   getTasks: async (id) => {
//     const response = await api.get(`/${RESOURCE}/${id}/tasks`);
//     return response.data;
//   },

//   // Temporary mentor coverage - assigned manually by HR.
//   getCoverage: async (id) => {
//     const response = await api.get(`/${RESOURCE}/${id}/coverage`);
//     return response.data;
//   },

//   addCoverage: async (id, data) => {
//     const response = await api.post(`/${RESOURCE}/${id}/coverage`, data);
//     return response.data;
//   },

//   removeCoverage: async (id, coverageId) => {
//     const response = await api.delete(`/${RESOURCE}/${id}/coverage/${coverageId}`);
//     return response.data;
//   },

//   removeDocument: async (id, documentId) => {
//     const response = await api.delete(
//       `/${RESOURCE}/${id}/documents/${documentId}`,
//     );
//     return response.data;
//   },
// };

// export default internServices;

import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "interns";

const internServices = {
  getAll: (params = {}) => crud.getAll(RESOURCE, params),

  getById: async (id) => {
    const response = await api.get(`/${RESOURCE}/${id}`);
    return response.data;
  },

  // What the Add Intern form pre-fills: { login_id, intern_code }
  getNextCodes: async () => {
    const response = await api.get(`/${RESOURCE}/next-codes`);
    return response.data;
  },

  // Sent as multipart/form-data so documents can travel with the form.
  // `documents` is [{ file, doc_type }, ...]; the backend receives the files
  // plus a JSON array of their types in the same order.
  create: ({ documents = [], ...fields }) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    documents.forEach((document) => formData.append("documents", document.file));
    formData.append(
      "document_types",
      JSON.stringify(documents.map((document) => document.doc_type)),
    );

    return crud.create(RESOURCE, formData);
  },

  update: (id, data) => crud.update(RESOURCE, id, data),

  // Soft delete on the backend - the login is blocked, records are kept.
  remove: (id) => crud.remove(RESOURCE, id),

  uploadDocument: async (id, file, docType) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("doc_type", docType);

    const response = await api.post(`/${RESOURCE}/${id}/documents`, formData);
    return response.data;
  },

  // The bucket is private: this returns a short-lived signed URL.
  getDocumentUrl: async (id, documentId, { download = false } = {}) => {
    const response = await api.get(
      `/${RESOURCE}/${id}/documents/${documentId}/url`,
      { params: download ? { download: 1 } : {} },
    );
    return response.data.url;
  },

  // Read-only task list for HR (mentors create tasks from the Employee portal).
  getTasks: async (id) => {
    const response = await api.get(`/${RESOURCE}/${id}/tasks`);
    return response.data;
  },

  // Temporary mentor coverage - assigned manually by HR.
  getCoverage: async (id) => {
    const response = await api.get(`/${RESOURCE}/${id}/coverage`);
    return response.data;
  },

  addCoverage: async (id, data) => {
    const response = await api.post(`/${RESOURCE}/${id}/coverage`, data);
    return response.data;
  },

  removeCoverage: async (id, coverageId) => {
    const response = await api.delete(`/${RESOURCE}/${id}/coverage/${coverageId}`);
    return response.data;
  },

  // Internship Outcome (HR / Admin)
  getConvertDefaults: async (id) => {
    const response = await api.get(`/${RESOURCE}/${id}/convert-defaults`);
    return response.data;
  },

  convert: async (id, data) => {
    const response = await api.post(`/${RESOURCE}/${id}/convert`, data);
    return response.data;
  },

  complete: async (id) => {
    const response = await api.post(`/${RESOURCE}/${id}/complete`);
    return response.data;
  },

  extend: async (id, data) => {
    const response = await api.post(`/${RESOURCE}/${id}/extend`, data);
    return response.data;
  },

  removeDocument: async (id, documentId) => {
    const response = await api.delete(
      `/${RESOURCE}/${id}/documents/${documentId}`,
    );
    return response.data;
  },
};

export default internServices;