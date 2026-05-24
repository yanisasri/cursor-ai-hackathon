interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-cozy-200 bg-white p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-cozy-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-cozy-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-plum-600 hover:bg-plum-700"
            }`}
            onClick={onConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
