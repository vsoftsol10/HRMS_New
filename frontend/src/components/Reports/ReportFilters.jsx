import FormInput from "../AddForm/FormInput";

export default function ReportFilters() {
  return (
    <div className="bg-white rounded-3xl border border-gray-300 p-6">
      <h2 className="text-xl font-semibold mb-6">Filters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FormInput label="From" type="date" />

        <FormInput label="To" type="date" />

        <div>
          <label className="font-medium mb-2 block">Department</label>

          <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
        </div>

        <div>
          <FormInput label="Emplloyee" type="text"/>
        </div>
      </div>
    </div>
  );
}
