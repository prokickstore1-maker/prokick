import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// wajib dari env — tanpa default, biar salah provider ketahuan langsung
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "garage";
const bucket = process.env.S3_BUCKET || "prokick-store";

// Proxy gambar publik (foto produk) dari object storage.
// Bucket tetap privat; route ini hanya melayani prefix "products/".
// Receipt TIDAK lewat sini — ada /api/orders/[orderId]/receipt dengan cek akses sendiri.
const client = endpoint
  ? new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      forcePathStyle: true,
    })
  : null;

export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map((p) => decodeURIComponent(p)).join("/");

  // hanya foto produk yang publik; tolak path aneh & traversal
  if (!key.startsWith("products/") || key.includes("..") || !/^[\w.\-/]+$/.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 1. Coba S3 Client jika kredensial env tersedia
  if (client) {
    try {
      const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await obj.Body?.transformToByteArray();
      if (bytes) {
        return new NextResponse(Buffer.from(bytes), {
          headers: {
            "Content-Type": obj.ContentType || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {
      // lanjut ke fallback
    }
  }

  // 2. Fallback langsung ke S3 endpoint publik IDCloudHost
  try {
    const publicUrl = `https://is3.cloudhost.id/${bucket}/${key}`;
    const pubRes = await fetch(publicUrl);
    if (pubRes.ok) {
      const bytes = await pubRes.arrayBuffer();
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": pubRes.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    // gagal
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
