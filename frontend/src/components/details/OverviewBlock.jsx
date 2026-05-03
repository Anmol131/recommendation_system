export default function OverviewBlock({ text }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Overview</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-50">What to expect</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
        {text || 'No overview available. Check similar mood suggestions below for more great recommendations.'}
      </p>
    </section>
  );
}
