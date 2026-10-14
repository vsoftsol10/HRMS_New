export default function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
        flex
        justify-center
          bg-white
          rounded-2xl
          shadow-xl
          w-full
          max-w-3xl
          max-h-[90vh]
          overflow-y-auto
          p-4 sm:p-6
        "
      >
        {children}
      </div>
    </div>
  );
}
