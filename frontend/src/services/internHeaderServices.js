import api from "./api";

// Just enough for the top header (name + role pill) on the intern portal.
// The full profile (used by Settings) is served by internPortalServices.
const internHeaderServices = {
  getAll: async () => {
    const response = await api.get("/intern-portal/profile");

    return { userName: response.data.full_name, role: "Intern" };
  },
};

export default internHeaderServices;