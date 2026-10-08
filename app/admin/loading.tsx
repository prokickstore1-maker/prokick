export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-40 bg-black/5 rounded" />
        <div className="h-8 w-56 bg-black/5 rounded" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 w-full bg-black/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
