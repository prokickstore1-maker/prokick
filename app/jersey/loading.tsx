export default function JerseyLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-8">
        <div className="border-b border-white/10 pb-4 space-y-3">
          <div className="h-3 w-40 bg-white/10 rounded" />
          <div className="h-8 w-72 bg-white/10 rounded" />
        </div>
        <div className="flex gap-2">
          {[96, 120, 88, 104].map((w) => (
            <div key={w} className="h-9 bg-white/5 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#121217] border border-white/8 rounded-2xl overflow-hidden">
              <div className="aspect-[3/4] bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-2.5 w-3/4 bg-white/10 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
