import api from "./api";

// Employee portal -> "My Intern". Everything is scoped on the server to the
// logged-in employee, so no employee id is ever sent from here.
const employeeInternServices = {
  // { my_interns: [...], coverage_interns: [...] }
  getAll: async () => {
    const response = await api.get("/my-interns");
    return response.data;
  },

  // Intern basics + their task list
  getById: async (id) => {
    const response = await api.get(`/my-interns/${id}`);
    return response.data;
  },

  // { title, description, due_date, intern_ids: [] } - one task per intern
  assignTasks: async (payload) => {
    const response = await api.post("/my-interns/tasks", payload);
    return response.data;
  },
};

export default employeeInternServices;