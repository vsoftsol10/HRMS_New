import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

// FIX: singleton config table - .single() 500'd on a fresh project with no
// row yet. maybeSingle() returns null instead so the frontend can show an
// empty form rather than an error.
export const getCompanySettings = async (req, res) => {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: safeErrorMessage(error, "companySettingsController") });
  }

  res.json(data);
};

// FIX: same root cause as attendance_policy/leave_policy - PUT /:id
// required an id the frontend didn't have yet on first save ("invalid
// input syntax for type integer: undefined"). This now looks up the
// existing singleton row (if any) itself and inserts the first one
// instead of requiring a caller-supplied id.
export const saveCompanySettings = async (req, res) => {
  const { data: existing, error: fetchError } = await supabase
    .from("company_settings")
    .select("id")
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ message: fetchError.message });
  }

  const payload = { ...req.body, updated_at: new Date() };

  const query = existing
    ? supabase.from("company_settings").update(payload).eq("id", existing.id)
    : supabase.from("company_settings").insert(payload);

  const { data, error } = await query.select().single();

  if (error) {
    return res.status(500).json({ message: safeErrorMessage(error, "companySettingsController") });
  }

  res.json(data);
};