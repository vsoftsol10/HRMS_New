import api from "./api";

const employeeSalaryAssignmentServices = {
  getActive: async (employeeId) => {
    const response = await api.get(`/employee-salary-assignments/${employeeId}/active`);
    return response.data;
  },
  getHistory: async (employeeId) => {
    const response = await api.get(`/employee-salary-assignments/${employeeId}/history`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(`/employee-salary-assignments`, data);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/employee-salary-assignments/${id}`);
    return response.data;
  },
};

export default employeeSalaryAssignmentServices;