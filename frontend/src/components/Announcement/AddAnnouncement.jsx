// import { useState } from "react";
// import FormInput from "../AddForm/FormInput";
// import announcementServices from "../../services/announcementServices";
// import useFetch from "../../hooks/useFetch";
// import departmentServices from "../../services/departmentServices";
// import MultiSelect from "../../components/AddForm/MultiSelect";
// import Button from "../Button";

// export default function AddAnnouncement({ announcement, onClose, reload }) {
//   const { data: departments = [] } = useFetch(departmentServices);
//   const [loading, setLoading] = useState(false);
//   const [submitStatus, setSubmitStatus] = useState(null);

//   const departmentOptions = [
//     {
//       label: "All Departments",
//       value: "All",
//     },

//     ...departments.map((department) => ({
//       label: department.department_name,
//       value: department.id,
//     })),
//   ];

// // An existing announcement's `department` field may come back from the
// // backend as null, a single id, or an array of ids depending on how the
// // row was created/edited - normalize to an array so state and MultiSelect
// // always get a consistent shape.
// const normalizeDepartment = (dept) => {
//   if (dept === null || dept === undefined) return [];
//   return Array.isArray(dept) ? dept : [dept];
// };

// const currentDepartments = normalizeDepartment(announcement?.department);

// const isAllDepartments =
//   currentDepartments.length > 0 &&
//   currentDepartments.length === departments.length;

// const [errors, setErrors] = useState({});

// const [formData, setFormData] = useState({
//   title: announcement?.title || "",
//   description: announcement?.description || "",
//   department: isAllDepartments ? ["All"] : currentDepartments,
// });

//   const handleChange = (e) => {
//     setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

// const handleSubmit = async (e) => {
//   e.preventDefault();

//   const nextErrors = {};
//   if (!formData.title.trim()) nextErrors.title = "This field is required";
//   if (!formData.description.trim()) nextErrors.description = "This field is required";
//   if (!formData.department.length) nextErrors.department = "This field is required";
//   if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

//   const status = e.nativeEvent.submitter.value;
//   setSubmitStatus(status);

//   let selectedDepartments = formData.department;

//   // Convert "All Departments" into all department IDs
//   if (selectedDepartments.includes("All")) {
//     selectedDepartments = departments.map((dept) => dept.id);
//   }

//   const payload = {
//     title: formData.title,
//     description: formData.description,
//     department: selectedDepartments,
//     status,
//   };

//   setLoading(true);
//   try {
//     if (announcement) {
//       await announcementServices.update(announcement.id, payload);
//     } else {
//       await announcementServices.create(payload);
//     }

//     reload();
//     onClose();
//   } catch (error) {
//     console.log(error);
//   } finally {
//     setLoading(false);
//   }
// };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white rounded-2xl p-2 w-full max-w-3xl"
//     >
//       <h2 className="text-2xl font-bold mb-6">
//         {announcement ? "Edit Announcement" : "New Announcement"}
//       </h2>

//       <div className="space-y-8">
//         <FormInput
//           label="Title"
//           name="title"
//           value={formData.title}
//           onChange={handleChange}
//           error={errors.title}
//         />

//         <div>
//           <label className="block text-xl font-medium mb-2">Description</label>

//           <textarea
//             name="description"
//             rows={5}
//             value={formData.description}
//             onChange={handleChange}
//             className={`w-full border ${errors.description ? "border-red-500" : "border-gray-300"} rounded-xl p-4
//             resize-none focus:outline-none focus:ring-2
//             focus:ring-yellow-400`}
//             required
//           />
//           {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
//         </div>

//         <MultiSelect
//           label="Departments"
//           options={departmentOptions}
//           value={formData.department}
//           onChange={(values) => { setErrors((prev) => ({ ...prev, department: "" })); setFormData((prev) => ({ ...prev, department: values })); }}
//           error={errors.department}
//         />
//       </div>
//       <div className="flex justify-between gap-3 mt-10">
//         <div>
//           <Button
//             type="submit"
//             value="Draft"
//             variant="secondary"
//             disabled={loading}
//             loading={loading && submitStatus === "Draft"}
//             loadingText="Saving..."
//           >
//             Save Draft
//           </Button>
//         </div>
//         <div className="flex gap-3">
//           <Button
//             type="button"
//             variant="secondary"
//             onClick={onClose}
//             disabled={loading}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             value="Published"
//             disabled={loading}
//             loading={loading && submitStatus === "Published"}
//             loadingText="Publishing..."
//           >
//             Publish
//           </Button>
//         </div>
//       </div>
//     </form>
//   );
// }

import { useState } from "react";
import FormInput from "../AddForm/FormInput";
import announcementServices from "../../services/announcementServices";
import useFetch from "../../hooks/useFetch";
import departmentServices from "../../services/departmentServices";
import MultiSelect from "../../components/AddForm/MultiSelect";
import Button from "../Button";

export default function AddAnnouncement({ announcement, onClose, reload }) {
  const { data: departments = [] } = useFetch(departmentServices);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const departmentOptions = [
    {
      label: "All Departments",
      value: "All",
    },

    ...departments.map((department) => ({
      label: department.department_name,
      value: department.id,
    })),

    // Reaches every intern, whatever their department.
    {
      label: "Interns",
      value: "Interns",
    },
  ];

// An existing announcement's `department` field may come back from the
// backend as null, a single id, or an array of ids depending on how the
// row was created/edited - normalize to an array so state and MultiSelect
// always get a consistent shape.
const normalizeDepartment = (dept) => {
  if (dept === null || dept === undefined) return [];
  return Array.isArray(dept) ? dept : [dept];
};

const currentDepartments = normalizeDepartment(announcement?.department);

const includesInterns = currentDepartments.includes("Interns");
const departmentIdsOnly = currentDepartments.filter((d) => d !== "Interns");

const isAllDepartments =
  departmentIdsOnly.length > 0 &&
  departmentIdsOnly.length === departments.length;

const [errors, setErrors] = useState({});

const [formData, setFormData] = useState({
  title: announcement?.title || "",
  description: announcement?.description || "",
  department: isAllDepartments
    ? includesInterns
      ? ["All", "Interns"]
      : ["All"]
    : currentDepartments,
});

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const nextErrors = {};
  if (!formData.title.trim()) nextErrors.title = "This field is required";
  if (!formData.description.trim()) nextErrors.description = "This field is required";
  if (!formData.department.length) nextErrors.department = "This field is required";
  if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

  const status = e.nativeEvent.submitter.value;
  setSubmitStatus(status);

  let selectedDepartments = formData.department;

  // Convert "All Departments" into all department IDs
  if (selectedDepartments.includes("All")) {
    selectedDepartments = [...departments.map((dept) => dept.id)];

    if (formData.department.includes("Interns")) {
      selectedDepartments.push("Interns");
    }
  }

  const payload = {
    title: formData.title,
    description: formData.description,
    department: selectedDepartments,
    status,
  };

  setLoading(true);
  try {
    if (announcement) {
      await announcementServices.update(announcement.id, payload);
    } else {
      await announcementServices.create(payload);
    }

    reload();
    onClose();
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-2 w-full max-w-3xl"
    >
      <h2 className="text-2xl font-bold mb-6">
        {announcement ? "Edit Announcement" : "New Announcement"}
      </h2>

      <div className="space-y-8">
        <FormInput
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
        />

        <div>
          <label className="block text-xl font-medium mb-2">Description</label>

          <textarea
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            className={`w-full border ${errors.description ? "border-red-500" : "border-gray-300"} rounded-xl p-4
            resize-none focus:outline-none focus:ring-2
            focus:ring-yellow-400`}
            required
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        <MultiSelect
          label="Send To (Departments / Interns)"
          options={departmentOptions}
          independentValues={["Interns"]}
          value={formData.department}
          onChange={(values) => { setErrors((prev) => ({ ...prev, department: "" })); setFormData((prev) => ({ ...prev, department: values })); }}
          error={errors.department}
        />
      </div>
      <div className="flex justify-between gap-3 mt-10">
        <div>
          <Button
            type="submit"
            value="Draft"
            variant="secondary"
            disabled={loading}
            loading={loading && submitStatus === "Draft"}
            loadingText="Saving..."
          >
            Save Draft
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            value="Published"
            disabled={loading}
            loading={loading && submitStatus === "Published"}
            loadingText="Publishing..."
          >
            Publish
          </Button>
        </div>
      </div>
    </form>
  );
}