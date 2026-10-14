// import { useRef, useState } from "react";
// import {
//   Briefcase,
//   Building2,
//   Calendar,
//   Camera,
//   Check,
//   Hash,
//   Heart,
//   Loader2,
//   Mail,
//   MapPin,
//   Phone,
//   Trash2,
//   User,
//   Users,
//   X,
// } from "lucide-react";

// import MainLayout from "../../components/Layout/layout";
// import { useDialog } from "../../components/Dialogbox/DialogContext";
// import useFetch from "../../hooks/useFetch";
// import profileServices, {
//   PROFILE_PHOTO_MAX_MB,
//   PROFILE_PHOTO_TYPES,
//   notifyProfileUpdated,
// } from "../../services/profileServices";

// const EMPTY_FORM = {
//   full_name: "",
//   phone: "",
//   address: "",
//   emergency_name: "",
//   emergency_phone: "",
//   emergency_relation: "",
// };

// const toForm = (profile) => ({
//   full_name: profile?.full_name ?? "",
//   phone: profile?.phone ?? "",
//   address: profile?.address ?? "",
//   emergency_name: profile?.emergency_contact?.name ?? "",
//   emergency_phone: profile?.emergency_contact?.phone ?? "",
//   emergency_relation: profile?.emergency_contact?.relation ?? "",
// });

// const formatJoiningDate = (value) => {
//   if (!value) return "Not set";
//   const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
//   return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// // Shared by the admin (/admin/profile) and employee (/employee/profile) portals.
// export default function MyProfile() {
//   const { alert, confirm } = useDialog();
//   const { data, loading, error, reload } = useFetch(profileServices);

//   // Only the fields the user has changed; everything else comes from the
//   // server copy, so there is no effect needed to keep the form in sync.
//   const [edits, setEdits] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [photoBusy, setPhotoBusy] = useState(false);
//   const fileInputRef = useRef(null);

//   // useFetch starts with [] before the first response arrives.
//   const profile = data && data.id ? data : null;

//   const original = profile ? toForm(profile) : EMPTY_FORM;
//   const form = { ...original, ...edits };

//   const setField = (key) => (event) => {
//     const value = event.target.value;
//     setEdits((prev) => ({ ...prev, [key]: value }));
//   };

//   const dirty = Object.keys(EMPTY_FORM).some((key) => form[key] !== original[key]);

//   const handleCancel = () => setEdits({});

//   const handleSave = async () => {
//     if (!form.full_name.trim()) {
//       await alert({ title: "Full name required", message: "Please enter your full name.", type: "error" });
//       return;
//     }

//     try {
//       setSaving(true);
//       await profileServices.update({
//         full_name: form.full_name,
//         phone: form.phone,
//         address: form.address,
//         emergency_contact: {
//           name: form.emergency_name,
//           phone: form.emergency_phone,
//           relation: form.emergency_relation,
//         },
//       });
//       await reload();
//       setEdits({});
//       notifyProfileUpdated();
//       await alert({ title: "Profile updated", message: "Your changes have been saved.", type: "success" });
//     } catch (err) {
//       await alert({
//         title: "Couldn't save profile",
//         message: err.response?.data?.message || "Something went wrong. Please try again.",
//         type: "error",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handlePhotoChosen = async (event) => {
//     const file = event.target.files?.[0];
//     event.target.value = ""; // allow choosing the same file again
//     if (!file) return;

//     if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
//       await alert({ title: "Unsupported file", message: "Please choose a JPG, PNG or WEBP image.", type: "error" });
//       return;
//     }
//     if (file.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
//       await alert({
//         title: "Image too large",
//         message: `Please choose an image smaller than ${PROFILE_PHOTO_MAX_MB} MB.`,
//         type: "error",
//       });
//       return;
//     }

//     try {
//       setPhotoBusy(true);
//       await profileServices.uploadPhoto(file);
//       await reload();
//       notifyProfileUpdated();
//     } catch (err) {
//       await alert({
//         title: "Photo upload failed",
//         message: err.response?.data?.message || "Unable to upload your photo. Please try again.",
//         type: "error",
//       });
//     } finally {
//       setPhotoBusy(false);
//     }
//   };

//   const handlePhotoRemove = async () => {
//     const confirmed = await confirm({
//       title: "Remove profile photo?",
//       message: "Your photo will be deleted and your initial will be shown instead.",
//     });
//     if (!confirmed) return;

//     try {
//       setPhotoBusy(true);
//       await profileServices.removePhoto();
//       await reload();
//       notifyProfileUpdated();
//     } catch (err) {
//       await alert({
//         title: "Couldn't remove photo",
//         message: err.response?.data?.message || "Please try again.",
//         type: "error",
//       });
//     } finally {
//       setPhotoBusy(false);
//     }
//   };

//   if (loading && !profile) {
//     return (
//       <MainLayout title="My Profile">
//         <p className="text-gray-500">Loading...</p>
//       </MainLayout>
//     );
//   }

//   if (error || !profile) {
//     return (
//       <MainLayout title="My Profile">
//         <div className="mx-auto max-w-3xl rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
//           <p className="text-red-700">Unable to load your profile.</p>
//           <button type="button" onClick={reload} className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer">
//             Retry
//           </button>
//         </div>
//       </MainLayout>
//     );
//   }

//   const initial = (profile.full_name || "?").slice(0, 1).toUpperCase();
//   const subtitle = [profile.role, profile.department].filter(Boolean).join(" · ");

//   return (
//     <MainLayout title="My Profile">
//       <div className="mx-auto max-w-3xl space-y-5">
//         <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

//         {/* Identity + photo */}
//         <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
//           <div className="flex items-center gap-5">
//             <div className="relative shrink-0">
//               {profile.profile_image_url ? (
//                 <img
//                   src={profile.profile_image_url}
//                   alt={profile.full_name}
//                   className="h-20 w-20 rounded-xl object-cover"
//                 />
//               ) : (
//                 <div className="h-20 w-20 rounded-xl bg-yellow-400 flex items-center justify-center text-3xl font-semibold text-gray-900">
//                   {initial}
//                 </div>
//               )}

//               {photoBusy && (
//                 <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center">
//                   <Loader2 size={22} className="animate-spin text-gray-700" />
//                 </div>
//               )}
//             </div>

//             <div className="min-w-0">
//               <p className="text-lg font-semibold text-gray-900 truncate">{profile.full_name}</p>
//               <p className="text-sm text-gray-500">{subtitle}</p>
//               <p className="text-xs text-gray-500">{profile.email || "No email on file"}</p>

//               <div className="mt-2 flex items-center gap-4">
//                 <button
//                   type="button"
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={photoBusy}
//                   className="flex items-center gap-1.5 text-xs font-medium text-gray-800 hover:text-yellow-600 disabled:opacity-50"
//                 >
//                   <Camera size={13} />
//                   {profile.profile_image_url ? "Change photo" : "Upload photo"}
//                 </button>

//                 {profile.profile_image_url && (
//                   <button
//                     type="button"
//                     onClick={handlePhotoRemove}
//                     disabled={photoBusy}
//                     className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
//                   >
//                     <Trash2 size={13} />
//                     Remove
//                   </button>
//                 )}
//               </div>

//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept={PROFILE_PHOTO_TYPES.join(",")}
//                 onChange={handlePhotoChosen}
//                 className="hidden"
//               />
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <button
//               type="button"
//               onClick={handleCancel}
//               disabled={!dirty || saving}
//               className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
//             >
//               <X size={14} />
//               Cancel
//             </button>
//             <button
//               type="button"
//               onClick={handleSave}
//               disabled={!dirty || saving}
//               className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-sm font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
//               Save
//             </button>
//           </div>
//         </div>

//         <Section title="Personal Information">
//           <Field label="Full Name" icon={User} value={form.full_name} onChange={setField("full_name")} maxLength={100} />
//           <Field label="Email" icon={Mail} value={profile.email || ""} readOnly />
//         </Section>

//         <Section title="Contact Details">
//           <Field label="Phone" icon={Phone} value={form.phone} onChange={setField("phone")} placeholder="+91 98765 43210" maxLength={20} />
//           <Field label="Address" icon={MapPin} value={form.address} onChange={setField("address")} maxLength={255} />
//         </Section>

//         <Section title="Emergency Contact" columns={3}>
//           <Field label="Contact Name" icon={Heart} value={form.emergency_name} onChange={setField("emergency_name")} maxLength={100} />
//           <Field label="Contact Phone" icon={Phone} value={form.emergency_phone} onChange={setField("emergency_phone")} maxLength={20} />
//           <Field label="Relation" icon={Users} value={form.emergency_relation} onChange={setField("emergency_relation")} maxLength={100} />
//         </Section>

//         <Section title="Employment Details">
//           <Field label="Department" icon={Building2} value={profile.department || "Not set"} readOnly />
//           <Field label="Position" icon={Briefcase} value={profile.position || "Not set"} readOnly />
//           <Field label="Date of Joining" icon={Calendar} value={formatJoiningDate(profile.joining_date)} readOnly />
//           <Field label="Employee ID" icon={Hash} value={profile.employee_code || "Not set"} readOnly />
//         </Section>
//       </div>
//     </MainLayout>
//   );
// }

// function Section({ title, columns = 2, children }) {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-5">
//       <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
//       <div className={`grid grid-cols-1 gap-4 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
//         {children}
//       </div>
//     </div>
//   );
// }

// function Field({ label, icon: Icon, readOnly = false, ...inputProps }) {
//   return (
//     <label className="block">
//       <span className="block text-[11px] font-medium text-gray-500 mb-1.5">{label}</span>
//       <span
//         className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
//           readOnly
//             ? "border-transparent bg-gray-100"
//             : "border-gray-200 bg-white focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400"
//         }`}
//       >
//         <Icon size={14} className="shrink-0 text-gray-400" />
//         <input
//           {...inputProps}
//           readOnly={readOnly}
//           tabIndex={readOnly ? -1 : undefined}
//           className={`w-full bg-transparent text-sm outline-none ${readOnly ? "text-gray-600 cursor-default" : "text-gray-900"}`}
//         />
//       </span>
//     </label>
//   );
// }

import { useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  Hash,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import useFetch from "../../hooks/useFetch";
import profileServices, {
  PROFILE_PHOTO_MAX_MB,
  PROFILE_PHOTO_TYPES,
  notifyProfileUpdated,
} from "../../services/profileServices";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  address: "",
  emergency_name: "",
  emergency_phone: "",
  emergency_relation: "",
};

const toForm = (profile) => ({
  full_name: profile?.full_name ?? "",
  phone: profile?.phone ?? "",
  address: profile?.address ?? "",
  emergency_name: profile?.emergency_contact?.name ?? "",
  emergency_phone: profile?.emergency_contact?.phone ?? "",
  emergency_relation: profile?.emergency_contact?.relation ?? "",
});

const formatJoiningDate = (value) => {
  if (!value) return "Not set";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Shared by the admin (/admin/profile) and employee (/employee/profile) portals.
export default function MyProfile() {
  const { alert, confirm } = useDialog();
  const { data, loading, error, reload } = useFetch(profileServices);

  // Only the fields the user has changed; everything else comes from the
  // server copy, so there is no effect needed to keep the form in sync.
  const [edits, setEdits] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef(null);

  // useFetch starts with [] before the first response arrives.
  const profile = data && data.id ? data : null;

  const original = profile ? toForm(profile) : EMPTY_FORM;
  const form = { ...original, ...edits };

  const setField = (key) => (event) => {
    const value = event.target.value;
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const dirty = Object.keys(EMPTY_FORM).some((key) => form[key] !== original[key]);

  const handleCancel = () => {
    setEdits({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      await alert({ title: "Full name required", message: "Please enter your full name.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      await profileServices.update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        emergency_contact: {
          name: form.emergency_name,
          phone: form.emergency_phone,
          relation: form.emergency_relation,
        },
      });
      await reload();
      setEdits({});
      setIsEditing(false);
      notifyProfileUpdated();
      await alert({ title: "Profile updated", message: "Your changes have been saved.", type: "success" });
    } catch (err) {
      await alert({
        title: "Couldn't save profile",
        message: err.response?.data?.message || "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChosen = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      await alert({ title: "Unsupported file", message: "Please choose a JPG, PNG or WEBP image.", type: "error" });
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
      await alert({
        title: "Image too large",
        message: `Please choose an image smaller than ${PROFILE_PHOTO_MAX_MB} MB.`,
        type: "error",
      });
      return;
    }

    try {
      setPhotoBusy(true);
      await profileServices.uploadPhoto(file);
      await reload();
      notifyProfileUpdated();
    } catch (err) {
      await alert({
        title: "Photo upload failed",
        message: err.response?.data?.message || "Unable to upload your photo. Please try again.",
        type: "error",
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    const confirmed = await confirm({
      title: "Remove profile photo?",
      message: "Your photo will be deleted and your initial will be shown instead.",
    });
    if (!confirmed) return;

    try {
      setPhotoBusy(true);
      await profileServices.removePhoto();
      await reload();
      notifyProfileUpdated();
    } catch (err) {
      await alert({
        title: "Couldn't remove photo",
        message: err.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  if (loading && !profile) {
    return (
      <MainLayout title="My Profile">
        <p className="text-gray-500">Loading...</p>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout title="My Profile">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-red-700">Unable to load your profile.</p>
          <button type="button" onClick={reload} className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer">
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  const initial = (profile.full_name || "?").slice(0, 1).toUpperCase();
  const subtitle = [profile.role, profile.department].filter(Boolean).join(" · ");

  return (
    <MainLayout title="My Profile">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">
            {isEditing
              ? "You're editing your profile. Save when you're done."
              : "View your details. Click Edit Profile to make changes."}
          </p>
        </div>

        {/* Identity + photo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-7">
            <div className="relative shrink-0">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.full_name}
                  className="h-28 w-28 rounded-2xl object-cover"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-yellow-400 flex items-center justify-center text-5xl font-semibold text-gray-900">
                  {initial}
                </div>
              )}

              {photoBusy && (
                <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-gray-700" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-2xl font-semibold text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-base text-gray-500 mt-0.5">{subtitle}</p>
              <p className="text-sm text-gray-500">{profile.email || "No email on file"}</p>

              {isEditing && (
                <div className="mt-3 flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoBusy}
                    className="flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-yellow-600 disabled:opacity-50"
                  >
                    <Camera size={16} />
                    {profile.profile_image_url ? "Change photo" : "Upload photo"}
                  </button>

                  {profile.profile_image_url && (
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      disabled={photoBusy}
                      className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={PROFILE_PHOTO_TYPES.join(",")}
                onChange={handlePhotoChosen}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving || photoBusy}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-base text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <X size={17} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-base font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                  Save
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-base font-medium text-gray-900"
              >
                <Pencil size={17} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <Section title="Personal Information" columns={2}>
          <Field label="Full Name" icon={User} value={form.full_name} onChange={setField("full_name")} maxLength={100} editing={isEditing} placeholder="Not set" />
          <Field label="Email" icon={Mail} value={profile.email || ""} locked placeholder="Not set" />
        </Section>

        <Section title="Contact Details" columns={2}>
          <Field label="Phone" icon={Phone} value={form.phone} onChange={setField("phone")} maxLength={20} editing={isEditing} placeholder={isEditing ? "+91 98765 43210" : "Not set"} />
          <Field label="Address" icon={MapPin} value={form.address} onChange={setField("address")} maxLength={255} editing={isEditing} placeholder="Not set" />
        </Section>

        <Section title="Emergency Contact" columns={3}>
          <Field label="Contact Name" icon={Heart} value={form.emergency_name} onChange={setField("emergency_name")} maxLength={100} editing={isEditing} placeholder="Not set" />
          <Field label="Contact Phone" icon={Phone} value={form.emergency_phone} onChange={setField("emergency_phone")} maxLength={20} editing={isEditing} placeholder="Not set" />
          <Field label="Relation" icon={Users} value={form.emergency_relation} onChange={setField("emergency_relation")} maxLength={100} editing={isEditing} placeholder="Not set" />
        </Section>

        <Section title="Employment Details" columns={4} note={isEditing ? "Employment details and email are managed by HR / Admin and can't be edited here." : null}>
          <Field label="Department" icon={Building2} value={profile.department || "Not set"} locked />
          <Field label="Position" icon={Briefcase} value={profile.position || "Not set"} locked />
          <Field label="Date of Joining" icon={Calendar} value={formatJoiningDate(profile.joining_date)} locked />
          <Field label="Employee ID" icon={Hash} value={profile.employee_code || "Not set"} locked />
        </Section>
      </div>
    </MainLayout>
  );
}

const COLUMN_CLASS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

function Section({ title, columns = 2, note = null, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>
      <div className={`grid grid-cols-1 gap-6 ${COLUMN_CLASS[columns]}`}>{children}</div>
      {note && <p className="text-sm text-gray-500 mt-5">{note}</p>}
    </div>
  );
}

// locked  = never editable here (email, employment details)
// editing = the page is in edit mode, so non-locked fields become inputs
function Field({ label, icon: Icon, locked = false, editing = false, ...inputProps }) {
  const editable = editing && !locked;

  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-600 mb-2">{label}</span>
      <span
        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
          editable
            ? "border-gray-300 bg-white focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-200"
            : "border-transparent bg-gray-100"
        }`}
      >
        <Icon size={18} className="shrink-0 text-gray-400" />
        <input
          {...inputProps}
          readOnly={!editable}
          tabIndex={editable ? undefined : -1}
          className={`w-full bg-transparent text-base outline-none placeholder:text-gray-400 ${
            editable ? "text-gray-900" : "text-gray-700 cursor-default"
          }`}
        />
      </span>
    </label>
  );
}