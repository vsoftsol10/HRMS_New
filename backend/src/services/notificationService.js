import supabase from "../config/supabase.js";

export const createNotification = async (notification) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.log("Notification Error :", error);
    throw error;
  }

  return data;
};
