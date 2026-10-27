<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan Kerja Sesi & Dokumentasi

1. **Awal Sesi**:
   - Baca `00-DOCS.md` — peta dokumen, status proyek, dan backlog prioritas.
   - Periksa `DAILY_TASKS.md` dan `HANDOFF.md`. Jika masuk tanggal/hari baru, buat heading tanggal baru di paling atas `DAILY_TASKS.md`.
2. **Saat Kerja**:
   - Status bug teknis: rujuk `bug-audit/AUDIT.md`.
   - Patuhi guardrail di `HANDOFF.md` (bagian terlarang diutak-atik).
3. **Sebelum Klaim Selesai**:
   - Verifikasi wajib: `node_modules/.bin/tsc --noEmit` harus EXIT=0.
   - **Wajib perbarui `DAILY_TASKS.md` secara otomatis**: centang target `[x]`, catat ringkasan teknis yang selesai dan hash commit-nya pada tanggal hari ini, serta tulis prioritas sesi berikutnya.
   - Perbarui status estafet di `HANDOFF.md`.
4. **Izin Operasi**:
   - Jangan commit/push/build/migration tanpa izin eksplisit dari user.

<!-- antislop:start -->
## antislop
Untuk kerja UI, copy, people, mobile layout, atau code comment, baca `.claude/skills/antislop/SKILL.md` (core) lalu skill untuk tugasnya:
- UI / visual: `.claude/skills/antislop-ui/SKILL.md`
- Copy & text: `.claude/skills/antislop-copywriting/SKILL.md`
- People: `.claude/skills/antislop-human/SKILL.md` (+ `contrast-check.py`)
- Mobile / responsive: `.claude/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.claude/skills/antislop-code/SKILL.md`
Arah visual: `DESIGN.md`. Sebelum mulai, tanya user kapan antislop berlaku: saat kerja, atau setelah selesai (audit).
<!-- antislop:end -->
