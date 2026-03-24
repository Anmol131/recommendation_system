import { useState } from 'react';
import { FiLink } from 'react-icons/fi';

function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-primary/60 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-primary transition hover:bg-slate-50 dark:hover:bg-slate-800 duration-200"
    >
      <FiLink />
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

export default ShareButton;