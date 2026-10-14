// export default function Tabs({ tab, setTab }) {
//   const tabs = [
//     {
//       id: "company",
//       label: "Company Profile",
//     },
//     {
//       id: "attendance",
//       label: "Attendance Policy",
//     },
//     {
//       id: "leave",
//       label: "Leave Policy",
//     },
//     {
//       id: "security",
//       label: "Security",
//     },
//   ];

//   return (
//     <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
//       {tabs.map((item) => (
//         <button
//           key={item.id}
//           onClick={() => setTab(item.id)}
//           className={`px-6 py-2 rounded-xl transition-all
//           ${
//             tab === item.id ? "bg-white shadow-sm font-medium" : "text-gray-600"
//           }`}
//         >
//           {item.label}
//         </button>
//       ))}
//     </div>
//   );
// }


export default function Tabs({ tab, setTab }) {
  const tabs = [
    {
      id: "company",
      label: "Company Profile",
    },
    {
      id: "attendance",
      label: "Attendance Policy",
    },
    {
      id: "leave",
      label: "Leave Policy",
    },
    {
      id: "policy",
      label: "Company Policy",
    },
    {
      id: "security",
      label: "Security",
    },
  ];

  return (
    <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
      {tabs.map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`px-6 py-2 rounded-xl transition-all
          ${
            tab === item.id ? "bg-white shadow-sm font-medium" : "text-gray-600"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}