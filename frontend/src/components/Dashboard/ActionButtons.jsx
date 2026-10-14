// import { Plus, CalendarCheck, CalendarDays, Wallet } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function ActionButtons({navigationurl}) {
//   const navigate = useNavigate();
//   const buttons = [
//     { text: "Add Employee", icon: Plus, primary: true, path:"/employees" },
//     { text: "Mark Attendance", icon: CalendarCheck, path: "/attendance"},
//     { text: "Apply Leave", icon: CalendarDays, path: "/leavemanagement" },
//   ];

//   return (
//     <div className="bg-white rounded-2xl p-4 border border-gray-300 flex gap-4">
//       {buttons.map((btn, i) => {
//         const Icon = btn.icon;

//         return (
//           <button
//             onClick={() => navigate(btn.path)}
//             key={i}
//             className={`flex items-center gap-2 px-4 py-2 rounded-xl border 
//             ${
//               btn.primary
//                 ? "bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-100"
//                 : "bg-gray-100 border-gray-300 hover:bg-red-100"
//             } shadow-sm `}
//           >
//             <Icon size={18} />
//             {btn.text}
//           </button>
//         );
//       })}
//     </div>
//   );
// }
