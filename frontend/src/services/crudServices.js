import api from "./api";

export const getAll = async (resource, params = {}) => {
  const response = await api.get(`${resource}`, {
    params,
  });

  return response.data;
};
// export const getById = async (resource, id) => {
//   const response = await api.get(`/${resource}/${id}`);
//   return response.data;
// };

export const create = async (resource, data) => {
  const response = await api.post(`/${resource}`, data);
  return response.data;
};

export const update = async (resource, id, data) => {
  const response = await api.put(`/${resource}/${id}`, data);
  return response.data;
};

export const remove = async (resource, id) => {
  const response = await api.delete(`/${resource}/${id}`);
  return response.data;
};

export const getById = async (resource, id) => {
  console.log("resource:", resource);
  console.log("id:", id);

  const response = await api.get(`/${resource}/${id}`);
  return response.data;
};

export const patch = async (resource, data = {}) => {
  const response = await api.patch(`/${resource}`, data);
  return response.data;
};