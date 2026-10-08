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
  return <main className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-4"><form className="w-full max-w-sm space-y-4 rounded-2xl border border-[#E5E5E5] bg-white p-6" onSubmit={async (e) => { e.preventDefault(); setLoading(true); const result = await loginAdminAction(email, password); if (result.success) router.push("/admin/orders"); else { setError(result.error || "Login failed"); setLoading(false); } }}><h1 className="text-2xl font-black font-display">Admin login</h1>{error && <p role="alert" className="text-sm text-[#DC2626]">{error}</p>}<Label htmlFor="email" className="text-sm font-semibold">Email</Label><Input id="email" required type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><Label htmlFor="password" className="text-sm font-semibold">Password</Label><Input id="password" required type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="submit" disabled={loading} className="w-full h-auto py-3 text-xs uppercase tracking-wider font-extrabold">{loading ? "Signing in..." : "Sign in"}</Button></form></main>;
}
