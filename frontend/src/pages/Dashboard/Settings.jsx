// import { useState } from "react";
// import { Settings } from "lucide-react";

// import PageHeader from "../../components/PageHeader";
// import MainLayout from "../../components/Layout/layout";

// import SecuritySettings from "../../components/Settings/SecuritySettings";
// import LeavePolicy from "../../components/Settings/LeavePolicy";
// import AttendancePolicy from "../../components/Settings/AttendancePolicy";
// import CompanySettings from "../../components/Settings/CompanySettings"
// import Tabs from "../../components/Settings/Tabs"


// export default function SettingsPage() {
//   const [tab, setTab] = useState("company");

//   return (
//     <MainLayout title="Settings" icon={Settings}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Settings"
//           description="Configure your organization."
//         />

//         <Tabs tab={tab} setTab={setTab} />

//         {tab === "company" && <CompanySettings />}
//         {tab === "attendance" && <AttendancePolicy />}
//         {tab === "leave" && <LeavePolicy />}
//         {tab === "security" && <SecuritySettings />}
//       </div>
//     </MainLayout>
//   );
// }


import { useState } from "react";
import { Settings } from "lucide-react";

import PageHeader from "../../components/PageHeader";
import MainLayout from "../../components/Layout/layout";

import SecuritySettings from "../../components/Settings/SecuritySettings";
import LeavePolicy from "../../components/Settings/LeavePolicy";
import AttendancePolicy from "../../components/Settings/AttendancePolicy";
import CompanySettings from "../../components/Settings/CompanySettings"
import CompanyPolicy from "../../components/Settings/CompanyPolicy"
import Tabs from "../../components/Settings/Tabs"


export default function SettingsPage() {
  const [tab, setTab] = useState("company");

  return (
    <MainLayout title="Settings" icon={Settings}>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure your organization."
        />

        <Tabs tab={tab} setTab={setTab} />

        {tab === "company" && <CompanySettings />}
        {tab === "attendance" && <AttendancePolicy />}
        {tab === "leave" && <LeavePolicy />}
        {tab === "policy" && <CompanyPolicy />}
        {tab === "security" && <SecuritySettings />}
      </div>
    </MainLayout>
  );
}