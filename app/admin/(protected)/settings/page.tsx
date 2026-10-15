import { db, checkDbConnection } from "@/lib/db";
import { banners, paymentMethods, settings, testimonials } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await isAdmin())) redirect("/");
  if (!(await checkDbConnection())) {
    return <div className="rounded-xl border border-[#27272A] bg-[#121217] p-6 text-sm">Database is unavailable. Settings require an active database connection.</div>;
  }

  const [storedSettings, storedBanners, storedPayments, storedTestimonials] = await Promise.all([
    db.select().from(settings),
    db.select().from(banners).orderBy(banners.displayOrder),
    db.select().from(paymentMethods),
    db.select().from(testimonials).orderBy(desc(testimonials.createdAt)),
  ]);

  return <SettingsForm initialSettings={storedSettings} initialBanners={storedBanners} initialPayments={storedPayments} initialTestimonials={storedTestimonials} />;
}
