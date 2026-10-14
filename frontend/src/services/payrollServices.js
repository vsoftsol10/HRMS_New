// import * as crud from "./crudServices";

// const RESOURCE = "payroll";

// const payrollServices = {
//   getAll: () => crud.getAll(RESOURCE),
//   getByMonth: (month) =>
//     crud.getAll(RESOURCE, {
//       month,
//     }),
//   getByRange: (fromMonth, toMonth) =>
//     crud.getAll(RESOURCE, {
//       fromMonth,
//       toMonth,
//     }),
//   getById: (id) => crud.getById(RESOURCE, id),
//   create: (data) => crud.create(RESOURCE, data),
//   update: (id, data) => crud.update(RESOURCE, id, data),
//   remove: (id) => crud.remove(RESOURCE, id),
// };

// export default payrollServices;

import * as crud from "./crudServices";
import api from "./api";

const RESOURCE = "payroll";

const payrollServices = {
  getAll: () => crud.getAll(RESOURCE),
  getByMonth: (month) =>
    crud.getAll(RESOURCE, {
      month,
    }),
  getByRange: (fromMonth, toMonth) =>
    crud.getAll(RESOURCE, {
      fromMonth,
      toMonth,
    }),
  getById: (id) => crud.getById(RESOURCE, id),
  create: (data) => crud.create(RESOURCE, data),
  update: (id, data) => crud.update(RESOURCE, id, data),
  remove: (id) => crud.remove(RESOURCE, id),
  // Lifecycle: Draft -> Review -> Finalized -> Paid
  review: async (id) => {
    const response = await api.put(`/${RESOURCE}/${id}/review`);
    return response.data;
  },
  finalize: async (id) => {
    const response = await api.put(`/${RESOURCE}/${id}/finalize`);
    return response.data;
  },
  markAsPaid: async (id) => {
    const response = await api.put(`/${RESOURCE}/${id}/mark-paid`);
    return response.data;
  },
  getSixMonthSummary: async (employeeId) => {
    const response = await api.get(`/${RESOURCE}/six-month-summary/${employeeId}`);
    return response.data;
  },
};

export default payrollServices;