import api from "./api";

const internStipendServices = {
  // Every intern whose internship covers `month` ("YYYY-MM"), with that
  // month's stipend amount and Paid / Pending status.
  getMonthly: async (month) => {
    const response = await api.get("/interns/stipends/monthly", {
      params: { month },
    });
    return response.data;
  },

  // One intern's full schedule (newest month first): every billable month
  // with amount, Paid / Pending status, paid_date and reference.
  getByIntern: async (internId) => {
    const response = await api.get(`/interns/${internId}/stipends`);
    return response.data;
  },

  // month is the 1st of the month ("2026-10-01"); paid_date / reference are
  // optional (the server defaults paid_date to today).
  markPaid: async (internId, { month, paid_date, reference }) => {
    const response = await api.post(`/interns/${internId}/stipends/pay`, {
      month,
      paid_date: paid_date || undefined,
      reference: reference || undefined,
    });
    return response.data;
  },
};

export default internStipendServices;