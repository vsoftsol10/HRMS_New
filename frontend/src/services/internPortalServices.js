import api from "./api";

// Intern portal (self-service). Every call is scoped server-side to the
// logged-in intern via the JWT - no intern id is ever sent from here.
const internPortalServices = {
  // useFetch(internPortalServices) on the Dashboard page
  getAll: async () => {
    const response = await api.get("/intern-portal/dashboard");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/intern-portal/profile");
    return response.data;
  },

  updateEmergencyContact: async (data) => {
    const response = await api.put("/intern-portal/emergency-contact", data);
    return response.data;
  },

  updatePersonalInfo: async (data) => {
    const response = await api.put("/intern-portal/personal-info", data);
    return response.data;
  },

  getDocuments: async () => {
    const response = await api.get("/intern-portal/documents");
    return response.data;
  },

  getDocumentUrl: async (docId, { download = false } = {}) => {
    const response = await api.get(`/intern-portal/documents/${docId}/url`, {
      params: download ? { download: 1 } : {},
    });
    return response.data.url;
  },

  uploadDocument: async (file, docType) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("doc_type", docType);

    const response = await api.post("/intern-portal/documents", formData);
    return response.data;
  },

  removeDocument: async (docId) => {
    const response = await api.delete(`/intern-portal/documents/${docId}`);
    return response.data;
  },

  getTasks: async () => {
    const response = await api.get("/intern-portal/tasks");
    return response.data;
  },

  startTask: async (id) => {
    const response = await api.patch(`/intern-portal/tasks/${id}/start`);
    return response.data;
  },

  // status: "Pending" | "In Progress" | "Completed"
  updateTaskStatus: async (id, status) => {
    const response = await api.patch(`/intern-portal/tasks/${id}/status`, { status });
    return response.data;
  },

  // { file, comment }
  submitTask: async (id, { file, comment }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (comment) formData.append("comment", comment);

    const response = await api.post(`/intern-portal/tasks/${id}/submit`, formData);
    return response.data;
  },

  getSubmissionUrl: async (id, { download = false } = {}) => {
    const response = await api.get(`/intern-portal/tasks/${id}/submission-url`, {
      params: download ? { download: 1 } : {},
    });
    return response.data.url;
  },

  getStipends: async () => {
    const response = await api.get("/intern-portal/stipends");
    return response.data;
  },
};

export default internPortalServices;