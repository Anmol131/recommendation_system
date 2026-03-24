import { CheckCircle2, Info, X } from 'lucide-react';

const toneStyles = {
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300',
  info: 'border-blue-400/30 bg-blue-500/15 text-blue-100 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300',
};

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle2 : Info;

  return (
    <div className={`fixed right-4 top-24 z-[70] min-w-64 max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${toneStyles[type] || toneStyles.info}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-current/80 transition hover:bg-white/10 hover:text-current"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default Toast;
