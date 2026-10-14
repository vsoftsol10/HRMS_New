// import { useState } from "react";
// import { GraduationCap, Plus, TriangleAlert } from "lucide-react";

// import MainLayout from "../../components/Layout/layout";
// import PageHeader from "../../components/PageHeader";
// import MyInternCard from "../../components/Interns/MyInternCard";
// import ViewInternModal from "../../components/Interns/ViewInternModal";
// import AssignTaskModal from "../../components/Interns/AssignTaskModal";
// import useFetch from "../../hooks/useFetch";
// import employeeInternServices from "../../services/employeeInternServices";

// const TABS = [
//   { key: "mine", label: "My Interns" },
//   { key: "coverage", label: "Temporary Coverage" },
// ];

// // Employee portal -> My Intern (a mentor's view of the interns they look
// // after, plus interns they are covering temporarily).
// export default function EmployeeInterns() {
//   const { data, loading, error, reload } = useFetch(employeeInternServices);

//   const myInterns = data?.my_interns ?? [];
//   const coverageInterns = data?.coverage_interns ?? [];

//   const [tab, setTab] = useState("mine");
//   const [viewId, setViewId] = useState(null);
//   // null = closed, otherwise { initialIds } for the Assign task modal
//   const [assign, setAssign] = useState(null);
//   // Bumped after a task is created so an open View modal refreshes itself.
//   const [refreshKey, setRefreshKey] = useState(0);

//   const assignable = [...myInterns, ...coverageInterns];
//   const shown = tab === "mine" ? myInterns : coverageInterns;

//   const handleAssigned = () => {
//     reload();
//     setRefreshKey((key) => key + 1);
//   };

//   return (
//     <MainLayout title="My Interns" icon={GraduationCap}>
//       <div className="space-y-6">
//         <PageHeader
//           title="My Intern"
//           description="Manage your assigned interns."
//           actions={[
//             {
//               label: "Assign task",
//               icon: Plus,
//               disabled: assignable.length === 0,
//               onClick: () => setAssign({ initialIds: [] }),
//             },
//           ]}
//         />

//         <div role="tablist" className="flex gap-6 border-b border-gray-300">
//           {TABS.map(({ key, label }) => {
//             const count = key === "mine" ? myInterns.length : coverageInterns.length;

//             return (
//               <button
//                 key={key}
//                 type="button"
//                 role="tab"
//                 aria-selected={tab === key}
//                 onClick={() => setTab(key)}
//                 className={`pb-3 -mb-px border-b-2 font-medium cursor-pointer ${
//                   tab === key
//                     ? "border-yellow-500 text-black"
//                     : "border-transparent text-gray-500 hover:text-black"
//                 }`}
//               >
//                 {label}{" "}
//                 <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm">
//                   {count}
//                 </span>
//               </button>
//             );
//           })}
//         </div>

//         {tab === "coverage" && coverageInterns.length > 0 && (
//           <div className="flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
//             <TriangleAlert size={18} className="shrink-0" />
//             These interns are temporarily assigned to you while their primary
//             employee is away.
//           </div>
//         )}

//         {error && (
//           <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
//             <p className="text-red-700">Unable to load your interns.</p>
//             <button
//               type="button"
//               onClick={reload}
//               className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
//             >
//               Retry
//             </button>
//           </div>
//         )}

//         {shown.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
//             {shown.map((intern) => (
//               <MyInternCard
//                 key={intern.id}
//                 intern={intern}
//                 variant={tab === "coverage" ? "coverage" : "mine"}
//                 onView={setViewId}
//                 onAssign={(id) => setAssign({ initialIds: [id] })}
//               />
//             ))}
//           </div>
//         ) : (
//           !error && (
//             <p className="py-10 text-center text-gray-500">
//               {loading
//                 ? "Loading interns..."
//                 : tab === "mine"
//                   ? "No interns are assigned to you yet."
//                   : "You have no temporary coverage right now."}
//             </p>
//           )
//         )}
//       </div>

//       {viewId && (
//         <ViewInternModal
//           internId={viewId}
//           refreshKey={refreshKey}
//           onClose={() => setViewId(null)}
//           onAssign={(id) => setAssign({ initialIds: [id] })}
//         />
//       )}

//       {assign && (
//         <AssignTaskModal
//           interns={assignable.map(({ id, full_name }) => ({ id, full_name }))}
//           initialIds={assign.initialIds}
//           onClose={() => setAssign(null)}
//           onAssigned={handleAssigned}
//         />
//       )}
//     </MainLayout>
//   );
// }

import { useState } from "react";
import { GraduationCap, Info, Plus } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import MyInternCard from "../../components/Interns/MyInternCard";
import ViewInternModal from "../../components/Interns/ViewInternModal";
import AssignTaskModal from "../../components/Interns/AssignTaskModal";
import useFetch from "../../hooks/useFetch";
import employeeInternServices from "../../services/employeeInternServices";

const TABS = [
  { key: "mine", label: "My Interns" },
  { key: "coverage", label: "Temporary Coverage" },
];

// Employee portal -> My Intern (a mentor's view of the interns they look
// after, plus interns they are covering temporarily).
export default function EmployeeInterns() {
  const { data, loading, error, reload } = useFetch(employeeInternServices);

  const myInterns = data?.my_interns ?? [];
  const coverageInterns = data?.coverage_interns ?? [];

  const [tab, setTab] = useState("mine");
  const [viewId, setViewId] = useState(null);
  // null = closed, otherwise { initialIds } for the Assign task modal
  const [assign, setAssign] = useState(null);
  // Bumped after a task is created so an open View modal refreshes itself.
  const [refreshKey, setRefreshKey] = useState(0);

  const assignable = [...myInterns, ...coverageInterns];
  const shown = tab === "mine" ? myInterns : coverageInterns;

  const handleAssigned = () => {
    reload();
    setRefreshKey((key) => key + 1);
  };

  return (
    <MainLayout title="My Interns" icon={GraduationCap}>
      <div className="space-y-6">
        <PageHeader
          title="My Intern"
          description="Manage your assigned interns."
          actions={[
            {
              label: "Assign task",
              icon: Plus,
              disabled: assignable.length === 0,
              onClick: () => setAssign({ initialIds: [] }),
            },
          ]}
        />

        <div role="tablist" className="flex gap-6 border-b border-gray-300">
          {TABS.map(({ key, label }) => {
            const count = key === "mine" ? myInterns.length : coverageInterns.length;

            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`pb-3 -mb-px border-b-2 text-sm font-medium cursor-pointer ${
                  tab === key
                    ? "border-[#ffbc00] text-[#ffa800]"
                    : "border-transparent text-[#39526d] hover:text-black"
                }`}
              >
                {label}
                <span className="ml-2">{count}</span>
              </button>
            );
          })}
        </div>

        {tab === "coverage" && coverageInterns.length > 0 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-[#ffb020] bg-[#fff8e6] px-4 py-3 text-sm text-[#c25e00]">
            <Info size={16} className="shrink-0" />
            These interns are temporarily assigned to you while their primary
            employee is away.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">Unable to load your interns.</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {shown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {shown.map((intern) => (
              <MyInternCard
                key={intern.id}
                intern={intern}
                variant={tab === "coverage" ? "coverage" : "mine"}
                onView={setViewId}
                onAssign={(id) => setAssign({ initialIds: [id] })}
              />
            ))}
          </div>
        ) : (
          !error && (
            <p className="py-10 text-center text-gray-500">
              {loading
                ? "Loading interns..."
                : tab === "mine"
                  ? "No interns are assigned to you yet."
                  : "You have no temporary coverage right now."}
            </p>
          )
        )}
      </div>

      {viewId && (
        <ViewInternModal
          internId={viewId}
          refreshKey={refreshKey}
          onClose={() => setViewId(null)}
          onAssign={(id) => setAssign({ initialIds: [id] })}
        />
      )}

      {assign && (
        <AssignTaskModal
          interns={assignable.map(({ id, full_name }) => ({ id, full_name }))}
          initialIds={assign.initialIds}
          onClose={() => setAssign(null)}
          onAssigned={handleAssigned}
        />
      )}
    </MainLayout>
  );
}