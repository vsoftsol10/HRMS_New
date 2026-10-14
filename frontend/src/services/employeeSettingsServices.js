import api from "./api";

const RESOURCE = "employee-settings";

const employeeSettingsServices = {
  getLeavePolicy: async () => {
    const response = await api.get(`/${RESOURCE}/leave-policy`);

    return response.data;
  },

  getCompanyPolicy: async () => {
    const response = await api.get(`/${RESOURCE}/company-policy`);

    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put(`/${RESOURCE}/change-password`, data);

    return response.data;
  },
};

export default employeeSettingsServices;
