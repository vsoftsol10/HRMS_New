import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ActionMenu({ onEdit, onDelete }) {

    const [position, setPosition] = useState({
      top: 0,
      left: 0,
    });

    const buttonRef = useRef(null);
    
  const [open, setOpen] = useState(false);

  const menuRef = useRef();
  const portalRef = useRef(null);
  
 useEffect(() => {
   const close = (e) => {
     const clickedMenu = menuRef.current?.contains(e.target);
     const clickedPortal = portalRef.current?.contains(e.target);

     if (!clickedMenu && !clickedPortal) {
       setOpen(false);
     }
   };

   document.addEventListener("mousedown", close);

   return () => {
     document.removeEventListener("mousedown", close);
   };
 }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open) {
            const rect = buttonRef.current.getBoundingClientRect();

            setPosition({
              top: rect.bottom + 5,
              left: rect.right - 128,
            });
          }

          setOpen(!open);
        }}
        className="hover:bg-gray-100 p-1 rounded-full"
      >
        <MoreVertical size={18} />
      </button>

      {open &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed w-32 overflow-hidden bg-white border rounded-xl shadow-lg z-[9999]"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
