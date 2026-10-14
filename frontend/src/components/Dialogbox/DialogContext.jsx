import { createContext, useContext, useRef, useState } from "react";
import { CheckCircle, AlertCircle, HelpCircle, XCircle } from "lucide-react";

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [promptValue, setPromptValue] = useState("");
  const promptValueRef = useRef("");

  const alert = ({ title, message, type = "info" }) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
      });
    });
  };

  const confirm = ({ title, message }) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: "confirm",
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        },
      });
    });
  };

  const prompt = ({ title, message, defaultValue = "" }) => {
    return new Promise((resolve) => {
      promptValueRef.current = defaultValue;
      setPromptValue(defaultValue);
      setDialog({
        title,
        message,
        type: "prompt",
        onConfirm: () => { setDialog(null); resolve(promptValueRef.current); },
        onCancel: () => { setDialog(null); resolve(null); },
      });
    });
  };

  const styles = {
    success: {
      icon: <CheckCircle size={40} className="text-green-500" />,
      button: "bg-green-500 hover:bg-green-600",
    },
    error: {
      icon: <XCircle size={40} className="text-red-500" />,
      button: "bg-red-500 hover:bg-red-600",
    },
    info: {
      icon: <AlertCircle size={40} className="text-blue-500" />,
      button: "bg-blue-500 hover:bg-blue-600",
    },
    confirm: {
      icon: <HelpCircle size={40} className="text-yellow-500" />,
      button: "bg-yellow-500 hover:bg-yellow-600",
    },
    prompt: {
      icon: <HelpCircle size={40} className="text-yellow-500" />,
      button: "bg-yellow-500 hover:bg-yellow-600",
    },
  };

  const current = dialog && styles[dialog.type];

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[400px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-4">{current.icon}</div>

            <h2 className="text-xl font-semibold text-center">
              {dialog.title}
            </h2>

            <p className="mt-2 text-center text-gray-600">{dialog.message}</p>

            {dialog.type === "prompt" && (
              <input
                autoFocus
                value={promptValue}
                onChange={(event) => { promptValueRef.current = event.target.value; setPromptValue(event.target.value); }}
                className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-center gap-3">
              {(dialog.type === "confirm" || dialog.type === "prompt") && (
                <button
                  onClick={dialog.onCancel}
                  className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={dialog.onConfirm}
                className={`rounded-lg px-5 py-2 text-white transition ${current.button}`}
              >
                {dialog.type === "confirm" || dialog.type === "prompt" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

// The hook lives next to its provider on purpose; this only affects dev hot-reload.
// eslint-disable-next-line react-refresh/only-export-components
export const useDialog = () => useContext(DialogContext);