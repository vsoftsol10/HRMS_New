import { useState } from "react";
import { Plus, Building2 } from "lucide-react";

import Table from "../Table";
import Modal from "../Modal/Modal";
import ActionMenu from "../ActionMenu";
import useFetch from "../../hooks/useFetch";
import companyPolicyServices from "../../services/companyPolicyServices";
import AddCompanyPolicy from "./AddCompanyPolicy";
import { useDialog } from "../Dialogbox/DialogContext";

export default function CompanyPolicy() {
  const { alert, confirm } = useDialog();

  const [open, setOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const { data: policies = [], reload } = useFetch(companyPolicyServices);

  const columns = [
    {
      key: "title",
      label: "Title",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <ActionMenu
          onEdit={() => {
            setSelectedPolicy(row);
            setOpen(true);
          }}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete Policy",
      message: "Are you sure you want to delete this policy?",
    });

    if (!confirmed) return;

    try {
      await companyPolicyServices.remove(id);

      await alert({
        title: "Success",
        message: "Policy deleted successfully.",
        type: "success",
      });

      reload();
    } catch {
      await alert({
        title: "Error",
        message: "Failed to delete policy.",
        type: "error",
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-yellow-50">
            <Building2 className="text-yellow-600" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Company Policy</h2>
            <p className="text-gray-500 text-sm">
              Manage the policies shown to employees.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedPolicy(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 font-medium"
        >
          <Plus size={18} />
          Add Policy
        </button>
      </div>

      <Table columns={columns} data={policies} />

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <AddCompanyPolicy
            policy={selectedPolicy}
            reload={reload}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}