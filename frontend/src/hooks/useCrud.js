import { useState } from "react";


export default function useCrud(service) {
  const [loading, setLoading] = useState(false);

  const create = async (data) => {
    setLoading(true);

    try {
      return await service.create(data);
    } finally {
      setLoading(false);
    }
  };
const getById = async (id) => {
  console.log("useCrud id:", id);
  return await service.getById(id);
};
  const update = async (id, data) => {
    setLoading(true);

    try {
      return await service.update(id, data);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);

    try {
      return await service.remove(id);
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    update,
    remove,
    getById,
    loading,
  };
}