export default function DetailMetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_18px_40px_-26px_rgba(99,79,201,0.65)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value || '—'}</p>
    </div>
  );
}
