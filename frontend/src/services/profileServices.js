import api from "./api";

// One endpoint set for every role; the backend scopes everything to the
// logged-in user (token picked by api.js from the current portal path).
export const PROFILE_PHOTO_MAX_MB = 10;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Header and profile page stay in sync through this event.
export const PROFILE_UPDATED_EVENT = "profile:updated";
export const notifyProfileUpdated = () =>
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));

const profileServices = {
  getAll: async () => (await api.get("/profile")).data,

  update: async (payload) => (await api.put("/profile", payload)).data,

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return (await api.post("/profile/photo", formData)).data;
  },

  removePhoto: async () => (await api.delete("/profile/photo")).data,
};

export default profileServices;