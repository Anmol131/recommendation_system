export default function OverviewSection({ text }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-50px_rgba(96,69,190,0.8)] backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Overview</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-50">Story and summary</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
        {text || 'This content does not have a description yet. Try another title or explore similar mood picks below.'}
      </p>
    </section>
  );
}
