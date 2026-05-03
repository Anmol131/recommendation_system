export default function DetailsInfoBlock({ details = [] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Details</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-50">Key details</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-3xl border border-white/10 bg-[#08111f]/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">{detail.label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">{detail.value || 'N/A'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
