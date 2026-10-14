import { useState } from "react";
import { KeyRound, FileX2, Building2 } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";

import SettingsSidebar from "../../components/EmployeeComponents/EmployeeSettings/SettingsSidebar";
import ChangePassword from "../../components/EmployeeComponents/EmployeeSettings/ChangePassword";
import LeavePolicy from "../../components/EmployeeComponents/EmployeeSettings/LeavePolicy";
import CompanyPolicy from "../../components/EmployeeComponents/EmployeeSettings/CompanyPolicy";

export default function EmployeeSettings() {
  const [activeTab, setActiveTab] = useState("password");

  const menuItems = [
    {
      key: "password",
      label: "Change Password",
      icon: KeyRound,
    },
    {
      key: "leave",
      label: "Leave Policy",
      icon: FileX2,
    },
    {
      key: "company",
      label: "Company Policy",
      icon: Building2,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "password":
        return <ChangePassword />;

      case "leave":
        return <LeavePolicy />;

      case "company":
        return <CompanyPolicy />;

      default:
        return (
          <div className="rounded-2xl border border-gray-300 bg-white p-8">
            Coming Soon...
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Settings" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3">
            <SettingsSidebar
              items={menuItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          <div className="xl:col-span-9">{renderContent()}</div>
        </div>
      </div>
    </MainLayout>
  );
}