export default function JacketLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1540px] mx-auto space-y-8">
        <div className="h-12 w-72 rounded-lg bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

