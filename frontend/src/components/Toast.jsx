import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

const toneStyles = {
  success: 'var(--toast-success-bg)',
  info: 'var(--toast-info-bg)',
  loading: 'var(--toast-info-bg)',
  error: 'var(--toast-error-bg)',
};

const toneTextStyles = {
  success: 'var(--toast-success-text)',
  info: 'var(--toast-info-text)',
  loading: 'var(--toast-info-text)',
  error: 'var(--toast-error-text)',
};

const toneBorderStyles = {
  success: 'var(--toast-success-border)',
  info: 'var(--toast-info-border)',
  loading: 'var(--toast-info-border)',
  error: 'var(--toast-error-border)',
};

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  const isLoading = type === 'loading';

  return (
    <div
      className="fixed right-4 top-24 z-[70] min-w-64 max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md"
      style={{
        background: toneStyles[type] || toneStyles.info,
        color: toneTextStyles[type] || toneTextStyles.info,
        borderColor: toneBorderStyles[type] || toneBorderStyles.info,
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
      }}
    >
      <div className="flex items-start gap-3">
        {isLoading ? (
          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/20">
            <div className="h-3 w-3 animate-spin rounded-full border-t-2 border-b-2" style={{ borderColor: 'currentColor', borderTopColor: 'currentColor', borderBottomColor: 'currentColor' }} />
          </div>
        ) : (
          <Icon size={18} className="mt-0.5" />
        )}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          aria-label="Close notification"
          style={{ color: 'currentColor' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default Toast;
