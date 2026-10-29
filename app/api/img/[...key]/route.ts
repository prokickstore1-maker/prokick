import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "https://is3.cloudhost.id";
const region = process.env.S3_REGION || "id-jkt-1";
const bucket = process.env.S3_BUCKET || "prokick";

// Proxy gambar publik (foto produk) dari object storage.
// Bucket tetap privat; route ini hanya melayani prefix "products/".
// Receipt TIDAK lewat sini — ada /api/orders/[orderId]/receipt dengan cek akses sendiri.
const accessKeyId = process.env.S3_ACCESS_KEY || "";
const secretAccessKey = process.env.S3_SECRET_KEY || "";

const client = endpoint && accessKeyId && secretAccessKey
  ? new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
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
    const publicUrl = `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
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
