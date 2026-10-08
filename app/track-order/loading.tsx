export default function TrackOrderLoading() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="border-b border-white/10 pb-4 space-y-3">
          <div className="h-3 w-36 bg-white/10 rounded" />
          <div className="h-8 w-64 bg-white/10 rounded" />
        </div>
        <div className="space-y-4 rounded-2xl bg-[#121217] border border-white/8 p-5">
          <div className="h-3 w-40 bg-white/10 rounded" />
          <div className="h-11 w-full bg-white/5 rounded-lg" />
          <div className="h-11 w-full bg-white/5 rounded-lg" />
          <div className="h-11 w-full bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
