"use client";

import Link from "next/link";

// global-error menggantikan ROOT layout, jadi CSS Tailwind tak ikut ter-load —
// gaya wajib inline pakai token proyek. ponytail: cukup untuk layar gagal sekali;
// upgrade ke error.tsx biasa kalau nanti ada layar error yang lebih sering muncul.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#09090B",
          color: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#121217",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", margin: "0 0 1rem" }}>
            Something broke on our side
          </h1>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.625, color: "#a1a1aa", margin: "0 0 1.5rem" }}>
            The store could not be loaded. Try again in a moment.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#fff",
                color: "#000",
                border: 0,
                borderRadius: "0.5rem",
                padding: "0.75rem 1.75rem",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "0.5rem",
                padding: "0.75rem 1.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              Back to Store
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
