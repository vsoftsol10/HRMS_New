export default function PageHeader({ title, description, actions = [] }) {
  return (
    <div className="flex justify-between items-center">
      <div className="">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-500 mt-2">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition ${
                action.variant === "secondary"
                  ? "border border-gray-400 bg-white hover:bg-gray-100 hover:shadow-lg"
                  : "bg-yellow-400 hover:bg-yellow-300 hover:shadow-lg"
              } ${action.disabled ? "opacity-50 cursor-not-allowed hover:shadow-none" : ""}`}
            >
              {Icon && <Icon size={18} />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}