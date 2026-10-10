export default function CartLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-white/10 pb-4 space-y-3">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-8 w-56 bg-white/10 rounded" />
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-[#121217] border border-white/8">
              <div className="w-20 h-24 bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-1/3 bg-white/5 rounded" />
                <div className="h-5 w-20 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-2xl bg-[#121217] border border-white/8 p-4">
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-2/3 bg-white/5 rounded" />
          <div className="h-9 w-full bg-white/10 rounded-full mt-2" />
        </div>
      </div>
    </div>
  );
}
