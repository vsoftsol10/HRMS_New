// import { useState } from "react";
// import Sidebar from "../Sidebar";
// import Header from "../Header";

// export default function MainLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(
//     () => typeof window === "undefined" || window.innerWidth >= 1024,
//   );
//   const [search, setSearch] = useState("");

//   return (
//     <div className="flex h-screen bg-gray-100 overflow-hidden">
//       <Sidebar
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         search={search}
//       />

//       {sidebarOpen && (
//         <button
//           type="button"
//           aria-label="Close navigation"
//           onClick={() => setSidebarOpen(false)}
//           className="fixed inset-0 z-30 bg-black/40 lg:hidden"
//         />
//       )}

//       {/* Right section */}
//       <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
//         {/* Header */}
//         <Header
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           search={search}
//           setSearch={setSearch}
//         />

//         {/* Content */}
//         <main
//           className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6"
//           onClick={() => {
//             if (sidebarOpen) {
//               setSidebarOpen(false);
//             }
//           }}
//         >
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [search, setSearch] = useState("");

  // Intern portal pages (/intern/...) use the typography scale in index.css.
  const { pathname } = useLocation();
  const isInternPortal = pathname.startsWith("/intern/");

  return (
    <div
      className={`flex h-screen bg-gray-100 overflow-hidden ${
        isInternPortal ? "intern-portal" : ""
      }`}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        search={search}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Right section */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          search={search}
          setSearch={setSearch}
        />

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6"
          onClick={() => {
            if (sidebarOpen) {
              setSidebarOpen(false);
            }
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}