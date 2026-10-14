import { ChevronRight, FileDown, FileSpreadsheet } from "lucide-react";

export default function ReportCard({ report }) {
  const Icon = report.icon;

  return (
    <div className="bg-white border border-gray-300 rounded-3xl p-4 flex justify-between">
      <div className="flex gap-5">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center">
          <Icon size={30} />
        </div>

        <div>
          <h2 className="text-xl font-semibold">{report.title}</h2>

          <p className="text-gray-500 mt-1">{report.description}</p>

          <div className="flex gap-3 mt-4">
            <button className="border border-gray-300 rounded-xl px-5 py-2 flex items-center gap-2 hover:bg-orange-100">
              <FileDown size={18} />
              Export PDF
            </button>

            <button className="border border-gray-300 rounded-xl px-5 py-2 flex items-center gap-2 hover:bg-orange-100">
              <FileSpreadsheet size={18} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <ChevronRight className="text-gray-500" />
    </div>
  );
}
