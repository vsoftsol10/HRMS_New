import api from "./api";

// HR / Admin: every intern's attendance for one month (?month=YYYY-MM).
const internAttendanceAdminServices = {
  getByMonth: async (month) => {
    const response = await api.get("/attendance/interns", { params: { month } });
    return response.data;
  },
};

export default internAttendanceAdminServices;