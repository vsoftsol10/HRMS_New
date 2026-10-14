import { useParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import InternForm from "../../components/Interns/InternForm";

// Serves both /admin/interns/new and /admin/interns/:id/edit.
export default function AddIntern() {
  const { id } = useParams();

  return (
    <MainLayout title={id ? "Edit Intern" : "Add Intern"} icon={GraduationCap}>
      {/* key: switching between "new" and an edit URL must reset the form */}
      <InternForm key={id || "new"} internId={id} />
    </MainLayout>
  );
}