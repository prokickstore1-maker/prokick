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
  if (!client) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  const { key: parts } = await params;
  const key = parts.map((p) => decodeURIComponent(p)).join("/");

  // hanya foto produk yang publik; tolak path aneh & traversal
  if (!key.startsWith("products/") || key.includes("..") || !/^[\w.\-/]+$/.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes) return NextResponse.json({ error: "Empty" }, { status: 404 });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": obj.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
