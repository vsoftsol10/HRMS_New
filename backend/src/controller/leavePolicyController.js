import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

// FIX: singleton config table - .single() 500'd on a fresh project with no
// row yet. maybeSingle() returns null instead so the frontend can show an
// empty form rather than an error.
export const getLeavePolicy = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leave_policy")
      .select("*")
      .maybeSingle();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "leavePolicyController"),
    });
  }
};

// FIX: same root cause as attendance_policy - PUT /:id required an id the
// frontend didn't have yet on first save ("invalid input syntax for type
// integer: undefined"). This now looks up the existing singleton row (if
// any) itself and inserts the first one instead of requiring a caller-
// supplied id.
export const saveLeavePolicy = async (req, res) => {
  try {
    const { casual_leave, sick_leave, earned_leave } = req.body;

    const payload = {
      casual_leave,
      sick_leave,
      earned_leave,
      updated_at: new Date(),
    };

    const { data: existing, error: fetchError } = await supabase
      .from("leave_policy")
      .select("id")
      .maybeSingle();

    if (fetchError) throw fetchError;

    const query = existing
      ? supabase.from("leave_policy").update(payload).eq("id", existing.id)
      : supabase.from("leave_policy").insert(payload);

    const { data, error } = await query.select().single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "leavePolicyController"),
    });
  }
};