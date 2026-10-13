"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdminAction } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <main className="admin-surface min-h-screen flex items-center justify-center bg-[#09090B] p-4 text-[#FAFAFA]">
      <form
        className="w-full max-w-sm space-y-5 rounded-2xl border border-[#27272A] bg-[#121217] p-6 sm:p-8 shadow-2xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          try {
            const result = await loginAdminAction(email, password);
            if (result.success) {
              router.push("/admin");
            } else {
              setError(result.error || "Gagal masuk");
              setLoading(false);
            }
          } catch {
            setError("Terjadi kesalahan. Coba lagi.");
            setLoading(false);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-[#27272A] pb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F952] text-[#09090B] text-xs font-black font-display tracking-tight">
            PK
          </span>
          <div>
            <h1 className="text-lg font-black font-display tracking-tight text-[#FAFAFA]">
              Admin ProKick
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">
              Operasional Indonesia
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-zinc-300">
            Email
          </Label>
          <Input
            id="email"
            required
            type="email"
            autoComplete="email"
            placeholder="admin@prokick.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#09090B] border-[#27272A] text-sm text-white placeholder:text-zinc-500 focus-visible:border-[#E2F952]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-zinc-300">
            Password
          </Label>
          <Input
            id="password"
            required
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#09090B] border-[#27272A] text-sm text-white placeholder:text-zinc-500 focus-visible:border-[#E2F952]"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-auto py-3 text-xs uppercase tracking-wider font-extrabold bg-[#E2F952] text-[#09090B] hover:bg-[#d6ed47] transition-colors"
        >
          {loading ? "Memproses..." : "Masuk ke Admin"}
        </Button>
      </form>
    </main>
  );
}
