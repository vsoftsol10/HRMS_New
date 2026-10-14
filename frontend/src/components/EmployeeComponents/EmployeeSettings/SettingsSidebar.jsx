export default function SettingsSidebar({ items, activeTab, setActiveTab }) {
  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-5">
        Settings
      </h3>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition ${
                activeTab === item.key
                  ? "bg-yellow-50 text-yellow-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <Icon size={22} />

              <span className="text-lg">{item.label}</span>

              {activeTab === item.key && (
                <span className="ml-auto h-2 w-2 rounded-full bg-yellow-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
