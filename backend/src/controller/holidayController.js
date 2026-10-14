import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getHolidays = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("holidays")
      .select("*")
      .order("holiday_date", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "holidayController") });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { holiday_name, holiday_date, type, description } = req.body;

    const { data, error } = await supabase
      .from("holidays")
      .insert([
        {
          holiday_name,
          holiday_date,
          type,
          description,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Create Holiday Error:", err.message);

    res.status(500).json({
      success: false,
      message: safeErrorMessage(err, "holidayController"),
    });
  }
};
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const { holiday_name, holiday_date, type, description } = req.body;

    const { data, error } = await supabase
      .from("holidays")
      .update({
        holiday_name,
        holiday_date,
        type,
        description,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "holidayController") });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("holidays").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Holiday deleted" });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "holidayController") });
  }
};