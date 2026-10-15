<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mulai sesi

1. Baca `00-DOCS.md` — peta dokumen, status proyek, backlog prioritas, aturan main.
2. Status bug: lihat `bug-audit/AUDIT.md` sebelum mengklaim sesuatu sudah/belum difix.
3. Verifikasi sebelum klaim selesai: `node_modules/.bin/tsc --noEmit` harus EXIT=0.
4. Jangan commit/push/build/migration tanpa izin user.

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
