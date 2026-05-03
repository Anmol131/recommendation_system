import DetailMetaCard from './DetailMetaCard';

export default function DetailsGrid({ details }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-50px_rgba(96,69,190,0.8)] backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Details</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-50">Key stats</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {details.map((detail) => (
          <DetailMetaCard key={detail.label} label={detail.label} value={detail.value} />
        ))}
      </div>
    </section>
  );
}
