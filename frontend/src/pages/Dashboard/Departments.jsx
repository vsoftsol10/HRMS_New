// import { useState } from "react";
// import { Building2, Plus } from "lucide-react";
// import useCrud from "../../hooks/useCrud";
// import useFetch from "../../hooks/useFetch";
// import PageHeader from "../../components/PageHeader";
// import Modal from "../../components/Modal/Modal";
// import DepartmentCard from "../../components/Departments/DepartmentCard";
// import AddDepartment from "../../components/Departments/AddDepartment";
// import MainLayout from "../../components/Layout/layout";
// import departmentServices from "../../services/departmentServices";
// import { useDialog } from "../../components/Dialogbox/DialogContext";

// export default function Departments() {

// const { confirm, alert } = useDialog();

//   const [selectedDepartment, setSelectedDepartment] = useState(null);

//   const { data: departments = [], reload } = useFetch(departmentServices);

// const { remove  } = useCrud(departmentServices);

// const handleDelete = async (id) => {
//   const isConfirmed = await confirm({
//     title: "Delete Department",
//     message: "Are you sure you want to delete this department?",
//   });

//   if (!isConfirmed) return;

//  try {
//    await remove(id);

//    await reload();

//    await alert({
//      title: "Success",
//      message: "Department deleted successfully.",
//      type: "success",
//    });
//  } catch (err) {
//    await alert({
//      title: "Cannot Delete",
//      message: err.response?.data?.message || "Something went wrong.",
//      type: "error",
//    });
//  }
// };

//  const handleEdit = (id) => {
//    const department = departments.find((dept) => dept.id === id);

//    setSelectedDepartment(department);
//    setOpen(true);
//  };

//   const [open, setOpen] = useState(false);

//   return (
//     <MainLayout title="Departments" icon={Building2}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Departments"
//           description="Organize your team into departments and assign heads."
//           actions={[
//             {
//               label: "Add Department",
//               icon: Plus,
//               onClick: () => {
//                 setSelectedDepartment(null);
//                 setOpen(true);
//               },
//             },
//           ]}
//         />

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {departments.map((department) => (
//             <DepartmentCard
//               key={department.id}
//               department={department}
//               onDelete={handleDelete}
//               onEdit={handleEdit}
//             />
//           ))}
//         </div>

//         {open && (
//           <Modal size="max-w-2xl" onClose={() => setOpen(false)}>
//             <AddDepartment
//               department={selectedDepartment}
//               onClose={() => {
//                 setOpen(false);
//                 setSelectedDepartment(null);
//               }}
//               onSuccess={reload}
//             />
//           </Modal>
//         )}
//       </div>
//     </MainLayout>
//   );
// }

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import useCrud from "../../hooks/useCrud";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal/Modal";
import DepartmentCard from "../../components/Departments/DepartmentCard";
import AddDepartment from "../../components/Departments/AddDepartment";
import MainLayout from "../../components/Layout/layout";
import departmentServices from "../../services/departmentServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";

export default function Departments() {

const { confirm, alert } = useDialog();

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const { data: departments = [], reload } = useFetch(departmentServices);

const { remove  } = useCrud(departmentServices);

const handleDelete = async (id) => {
  const isConfirmed = await confirm({
    title: "Delete Department",
    message: "Are you sure you want to delete this department?",
  });

  if (!isConfirmed) return;

 try {
   await remove(id);

   await reload();

   await alert({
     title: "Success",
     message: "Department deleted successfully.",
     type: "success",
   });
 } catch (err) {
   await alert({
     title: "Cannot Delete",
     message: err.response?.data?.message || "Something went wrong.",
     type: "error",
   });
 }
};

 const handleEdit = (id) => {
   const department = departments.find((dept) => dept.id === id);

   setSelectedDepartment(department);
   setOpen(true);
 };

  const [open, setOpen] = useState(false);

  return (
    <MainLayout title="Departments" icon={Building2}>
      <div className="space-y-6">
        <PageHeader
          title="Departments"
          description="Manage teams, leads, and workforce strength."
          actions={[
            {
              label: "Add Department",
              icon: Plus,
              onClick: () => {
                setSelectedDepartment(null);
                setOpen(true);
              },
            },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>

        {open && (
          <Modal size="max-w-2xl" onClose={() => setOpen(false)}>
            <AddDepartment
              department={selectedDepartment}
              onClose={() => {
                setOpen(false);
                setSelectedDepartment(null);
              }}
              onSuccess={reload}
            />
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}
