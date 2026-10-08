"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 p-6 sm:p-8 bg-[#121217] border-white/10 space-y-4 text-center">
        <h1 className="text-lg font-black uppercase tracking-tight font-display text-white">
          Something broke on our side
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The page could not be loaded. Your bag is untouched and no order was placed.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-zinc-400">Reference: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Button
            onClick={reset}
            className="rounded-lg px-7 uppercase tracking-wider font-extrabold text-xs min-h-11"
          >
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-lg px-7 uppercase tracking-wider font-bold text-xs min-h-11 bg-white/6 text-white border-white/14 hover:bg-white/12 hover:text-white hover:border-white/28"
          >
            <Link href="/">Back to Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
