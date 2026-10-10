export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-8">
        <div className="h-3 w-48 bg-white/10 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-[3/4] bg-white/5 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-9 w-3/4 bg-white/10 rounded" />
            <div className="h-6 w-32 bg-white/5 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-5/6 bg-white/5 rounded" />
            </div>
            <div className="flex gap-2 pt-2">
              {[44, 44, 44, 44].map((w, i) => (
                <div key={i} className="h-11 bg-white/5 rounded-lg" style={{ width: w }} />
              ))}
            </div>
            <div className="h-12 w-full bg-white/10 rounded-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
