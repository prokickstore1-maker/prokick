export default function InvoiceLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-white/10 pb-4 space-y-3">
          <div className="h-3 w-28 bg-white/10 rounded" />
          <div className="h-8 w-48 bg-white/10 rounded" />
        </div>
        <div className="space-y-3 rounded-2xl bg-[#121217] border border-white/8 p-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-white/5 rounded" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
        <div className="mx-auto w-48 h-48 bg-white/5 rounded-2xl" />
        <div className="space-y-3 rounded-2xl bg-[#121217] border border-white/8 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 bg-white/5 rounded" style={{ width: `${80 - i * 20}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
