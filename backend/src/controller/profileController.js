import supabase from "../config/supabase.js";
import {
  uploadProfilePhotoToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";
import { safeErrorMessage } from "../utils/httpError.js";

// Everything the profile page needs. Salary and other payroll data are
// deliberately NOT selected here.
const PROFILE_COLUMNS = `
  id,
  employee_code,
  first_name,
  personal_email,
  phone,
  address,
  designation,
  joining_date,
  role,
  profile_image_url,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation,
  departments (
    department_name
  )
`;

const shapeProfile = (row) => ({
  id: row.id,
  employee_code: row.employee_code,
  full_name: row.first_name,
  email: row.personal_email,
  phone: row.phone,
  address: row.address,
  position: row.designation,
  department: row.departments?.department_name ?? null,
  joining_date: row.joining_date,
  role: row.role,
  profile_image_url: row.profile_image_url,
  emergency_contact: {
    name: row.emergency_contact_name,
    phone: row.emergency_contact_phone,
    relation: row.emergency_contact_relation,
  },
});

const fetchProfile = async (employeeId) => {
  const { data, error } = await supabase
    .from("employees")
    .select(PROFILE_COLUMNS)
    .eq("id", employeeId)
    .single();

  if (error) throw error;
  return shapeProfile(data);
};

// Trim, and turn "" into null so cleared fields are actually cleared.
const clean = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,18}[0-9]$/;

/* GET /api/profile */
export const getProfile = async (req, res) => {
  try {
    const profile = await fetchProfile(req.user.employee_id);
    return res.status(200).json(profile);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: safeErrorMessage(err, "profileController") });
  }
};

/* PUT /api/profile */
export const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const body = req.body || {};
    const emergency = body.emergency_contact || {};

    const fullName = clean(body.full_name);
    const phone = clean(body.phone);
    const address = clean(body.address);
    const emergencyName = clean(emergency.name);
    const emergencyPhone = clean(emergency.phone);
    const emergencyRelation = clean(emergency.relation);

    if (fullName !== undefined && (!fullName || fullName.length > 100)) {
      return res
        .status(400)
        .json({ message: "Full name is required (max 100 characters)." });
    }

    for (const [label, value] of [
      ["Phone", phone],
      ["Emergency contact phone", emergencyPhone],
    ]) {
      if (value && !PHONE_PATTERN.test(value)) {
        return res
          .status(400)
          .json({ message: `${label} is not a valid phone number.` });
      }
    }

    if (address && address.length > 255) {
      return res
        .status(400)
        .json({ message: "Address must be 255 characters or fewer." });
    }

    for (const value of [emergencyName, emergencyRelation]) {
      if (value && value.length > 100) {
        return res.status(400).json({
          message: "Emergency contact fields must be 100 characters or fewer.",
        });
      }
    }

    // Whitelist: role, salary, department, employee_code etc. can never be
    // changed from here, whatever the request body contains.
    const updates = {};
    if (fullName !== undefined) updates.first_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (emergencyName !== undefined) updates.emergency_contact_name = emergencyName;
    if (emergencyPhone !== undefined) updates.emergency_contact_phone = emergencyPhone;
    if (emergencyRelation !== undefined)
      updates.emergency_contact_relation = emergencyRelation;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", employeeId);

      if (error) throw error;
    }

    const profile = await fetchProfile(employeeId);
    return res.status(200).json(profile);
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: safeErrorMessage(err, "profileController") });
  }
};

/* POST /api/profile/photo  (multipart, field name "photo") */
export const uploadPhoto = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!req.file) {
      return res.status(400).json({ message: "Please choose an image to upload." });
    }

    let result;
    try {
      result = await uploadProfilePhotoToCloudinary(req.file.buffer, employeeId);
    } catch (uploadError) {
      console.error("Profile photo upload error:", uploadError);
      return res
        .status(500)
        .json({ message: `Photo upload failed: ${uploadError.message}` });
    }

    const { error } = await supabase
      .from("employees")
      .update({
        profile_image_url: result.secure_url,
        profile_image_public_id: result.public_id,
      })
      .eq("id", employeeId);

    if (error) throw error;

    return res.status(200).json({ profile_image_url: result.secure_url });
  } catch (err) {
    console.error("Upload photo error:", err);
    return res.status(500).json({ message: safeErrorMessage(err, "profileController") });
  }
};

/* DELETE /api/profile/photo */
export const removePhoto = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    const { data: row, error: readError } = await supabase
      .from("employees")
      .select("profile_image_public_id")
      .eq("id", employeeId)
      .single();

    if (readError) throw readError;

    if (row?.profile_image_public_id) {
      try {
        await deleteFromCloudinary(row.profile_image_public_id);
      } catch (destroyError) {
        // The photo is still detached from the profile below; an orphaned
        // Cloudinary asset is harmless compared with blocking the user.
        console.error("Cloudinary delete failed:", destroyError);
      }
    }

    const { error } = await supabase
      .from("employees")
      .update({ profile_image_url: null, profile_image_public_id: null })
      .eq("id", employeeId);

    if (error) throw error;

    return res.status(200).json({ profile_image_url: null });
  } catch (err) {
    console.error("Remove photo error:", err);
    return res.status(500).json({ message: safeErrorMessage(err, "profileController") });
  }
};