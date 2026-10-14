  export default function StatCard({ title, value, icon: Icon, iconBg }) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="uppercase text-gray-500 font-bold text-[13px]">{title}</p>

            <h2 className="text-xl font-bold mt-2">{value}</h2>
          </div>

          <div
            className={`h-12 w-12 rounded-lg ${iconBg} flex items-center justify-center`}
          >
            <Icon />
          </div>
        </div>
      </div>
    );
  }
