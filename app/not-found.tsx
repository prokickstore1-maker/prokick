import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121217] p-6 sm:p-8 space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
          404
        </span>
        <h1 className="text-lg font-black uppercase tracking-tight font-display text-white">
          Page not found
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          That link has no kit behind it. Browse the current season or search for your club.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Button asChild className="h-auto rounded-lg px-7 py-3 text-xs uppercase tracking-wider font-extrabold min-h-11">
            <Link href="/jersey">Browse All Kits</Link>
          </Button>
          <Button asChild variant="outline" className="h-auto rounded-lg bg-white/6 px-7 py-3 text-xs uppercase tracking-wider font-extrabold text-white border-white/14 hover:bg-white/12 hover:text-white hover:border-white/28 min-h-11">
            <Link href="/">Back to Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
