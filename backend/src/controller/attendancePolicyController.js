import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

// FIX: this table only ever holds one row (the whole app treats it as a
// singleton). Using .single() meant a brand-new project with no row yet
// would 500 here instead of just telling the frontend "nothing configured".
export const getAttendancePolicy = async (req, res) => {
  const { data, error } = await supabase
    .from("attendance_policy")
    .select("*")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: safeErrorMessage(error, "attendancePolicyController") });
  }

  res.json(data);
};

// FIX: the old PUT /:id endpoint assumed a row already existed and had to
// be given its id from the frontend. On a fresh project (no row yet) the
// frontend's id state is undefined, so the URL became
// "/attendance-policy/undefined" and Postgres rejected it with
// 'invalid input syntax for type integer: "undefined"'. This is a
// singleton config table, so the save endpoint now looks up the existing
// row itself (if any) and inserts one the first time instead of requiring
// the caller to already know an id.
export const saveAttendancePolicy = async (req, res) => {
  const { data: existing, error: fetchError } = await supabase
    .from("attendance_policy")
    .select("id")
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ message: fetchError.message });
  }

  const payload = { ...req.body, updated_at: new Date() };

  const query = existing
    ? supabase
        .from("attendance_policy")
        .update(payload)
        .eq("id", existing.id)
    : supabase.from("attendance_policy").insert(payload);

  const { data, error } = await query.select().single();

  if (error) {
    return res.status(500).json({ message: safeErrorMessage(error, "attendancePolicyController") });
  }

  res.json(data);
};